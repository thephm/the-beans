import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export interface AuditLogData {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  entityName?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

interface GeolocationData {
  city?: string | null;
  country?: string | null;
}

// Cache for IP geolocation to avoid excessive API calls
const geoCache = new Map<string, GeolocationData>();

/**
 * Get geolocation data for an IP address using ipapi.co
 * Free tier allows 1000 requests per day
 */
async function getGeolocation(ipAddress: string): Promise<GeolocationData> {
  if (!ipAddress || ipAddress === '::1' || ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.')) {
    return { city: 'Local', country: 'Local' };
  }

  // Check cache first
  if (geoCache.has(ipAddress)) {
    return geoCache.get(ipAddress)!;
  }

  try {
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 3000, // 3 second timeout
      headers: {
        'User-Agent': 'The-Beans-App/1.0'
      }
    });

    const data: GeolocationData = {
      city: response.data.city || null,
      country: response.data.country_name || null
    };

    // Cache the result
    geoCache.set(ipAddress, data);
    
    return data;
  } catch (error) {
    console.error('Geolocation lookup failed:', error);
    const fallback = { city: null, country: null };
    geoCache.set(ipAddress, fallback);
    return fallback;
  }
}

/**
 * Calculate field-level changes between old and new values
 */
function calculateChanges(oldValues: Record<string, any>, newValues: Record<string, any>): Record<string, any> {
  const changes: Record<string, any> = {};

  // Skip these fields from change tracking
  const skipFields = ['id', 'createdAt', 'updatedAt', 'createdById', 'updatedById'];

  // Check for modified fields
  for (const [key, newValue] of Object.entries(newValues)) {
    if (skipFields.includes(key)) continue;
    
    const oldValue = oldValues[key];
    
    // Handle arrays specially
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }
    // Handle objects/JSON specially  
    else if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }
    // Handle primitive values
    else if (oldValue !== newValue) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }

  // Check for deleted fields (present in old but not in new)
  for (const [key, oldValue] of Object.entries(oldValues)) {
    if (skipFields.includes(key)) continue;
    
    if (!(key in newValues)) {
      changes[key] = { old: oldValue, new: null };
    }
  }

  return changes;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    let changes = null;

    // Calculate changes for UPDATE actions
    if (data.action === 'UPDATE' && data.oldValues && data.newValues) {
      const fieldChanges = calculateChanges(data.oldValues, data.newValues);
      if (Object.keys(fieldChanges).length > 0) {
        changes = fieldChanges;
      } else {
        // No actual changes detected, skip logging
        return;
      }
    }

    // For CREATE actions, show new values (excluding sensitive fields)
    if (data.action === 'CREATE' && data.newValues) {
      const createChanges: Record<string, any> = {};
      const sensitiveFields = ['password', 'hashedPassword', 'token', 'secret', 'createdAt', 'updatedAt'];
      
      // Define field order for better presentation
      const fieldOrder = ['id', 'language', 'firstName', 'lastName', 'username', 'email'];
      const otherFields: string[] = [];
      
      // First, collect all field names and separate ordered from others
      if (data.newValues) {
        Object.keys(data.newValues).forEach(key => {
          if (!sensitiveFields.includes(key) && data.newValues![key] !== undefined && data.newValues![key] !== null) {
            if (!fieldOrder.includes(key)) {
              otherFields.push(key);
            }
          }
        });
        
        // Add fields in the specified order, then any remaining fields
        [...fieldOrder, ...otherFields].forEach(key => {
          const value = data.newValues![key];
          if (!sensitiveFields.includes(key) && value !== undefined && value !== null) {
            createChanges[key] = {
              old: null,
              new: value
            };
          }
        });
      }
      
      if (Object.keys(createChanges).length > 0) {
        changes = createChanges;
      }
    }

    // Get geolocation data
    const geoData = data.ipAddress ? await getGeolocation(data.ipAddress) : { city: null, country: null };

    // Create the audit log entry
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        changes: changes || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        city: geoData.city,
        country: geoData.country,
        userId: data.userId
      }
    });

    console.log(`Audit log created: ${data.action} ${data.entityType} ${data.entityId} by user ${data.userId}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging shouldn't break the main functionality
  }
}

/**
 * Helper function to get entity name for display
 */
export function getEntityName(entityType: string, entity: any): string {
  switch (entityType) {
    case 'roaster':
      return entity.name || entity.id;
    case 'review':
      return entity.title || `Review for ${entity.roaster?.name || 'Unknown Roaster'}`;
    case 'bean':
      return entity.name || entity.id;
    case 'user':
      return entity.username || entity.email || entity.id;
    case 'favorite':
      return `Favorite: ${entity.roaster?.name || 'Unknown Roaster'}`;
    case 'comment':
      return `Comment on ${entity.review?.title || 'review'}`;
    default:
      return entity.id || 'Unknown';
  }
}

/**
 * Extract IP address from Express request, handling proxies
 */
export function getClientIP(req: any): string | undefined {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         undefined;
}

/**
 * Extract user agent from Express request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}