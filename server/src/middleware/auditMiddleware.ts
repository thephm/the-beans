import { createAuditLog, getClientIP, getUserAgent, getEntityName, AuditLogData } from '../lib/auditService';

/**
 * Middleware to capture audit information before the operation
 * This should be called before any CRUD operation that needs auditing
 */
export function auditBefore(entityType: string, action: 'CREATE' | 'UPDATE' | 'DELETE') {
  return (req: any, res: any, next: any) => {
    req.auditData = {
      entityType,
      action
    };
    next();
  };
}

/**
 * Middleware to log audit information after the operation
 * This should be called after the CRUD operation completes successfully
 */
export function auditAfter() {
  return async (req: any, res: any, next: any) => {
    // Log both successful AND failed operations
    if (req.auditData && req.userId) {
      try {
        // Extract entity information from the response or request
        const entity = res.locals.auditEntity || res.locals.entity;
        const entityId = entity?.id || req.params.id;

        // For failed operations, we might not have an entity, so use a placeholder
        const finalEntityId = entityId || 'unknown';

        // Determine if operation was successful
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        const auditLogData: AuditLogData = {
          action: req.auditData.action,
          entityType: req.auditData.entityType,
          entityId: finalEntityId,
          entityName: entity ? getEntityName(req.auditData.entityType, entity) : undefined,
          userId: req.userId,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          oldValues: req.auditData.oldValues,
          newValues: isSuccess ? entity : undefined,
          // Add failure information for failed operations
          metadata: isSuccess ? undefined : {
            failed: true,
            statusCode: res.statusCode,
            error: res.locals.errorMessage || 'Operation failed'
          }
        };

        // For DELETE actions, call audit log synchronously
        if (req.auditData.action === 'DELETE') {
          await createAuditLog(auditLogData);
        } else {
          // Create audit log asynchronously for other actions
          setTimeout(() => createAuditLog(auditLogData), 0);
        }
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    }
    next();
  };
}

/**
 * Helper middleware to store old values for UPDATE operations
 * Call this before updating to capture the current state
 */
export function captureOldValues(prismaModel: any, idField = 'id') {
  return async (req: any, res: any, next: any) => {
    if (req.auditData?.action === 'UPDATE' || req.auditData?.action === 'DELETE') {
      try {
        const entityId = req.params[idField] || req.params.id;
        if (entityId) {
          const oldEntity = await prismaModel.findUnique({
            where: { [idField]: entityId }
          });
          if (oldEntity && req.auditData) {
            req.auditData.oldValues = oldEntity;
          }
        }
      } catch (error) {
        console.error('Failed to capture old values for audit:', error);
      }
    }
    next();
  };
}

/**
 * Helper middleware to store the result entity for audit logging
 * Call this after creating/updating an entity to store it for audit
 */
export function storeEntityForAudit(entity: any) {
  return (req: any, res: any, next: any) => {
    res.locals.auditEntity = entity;
    next();
  };
}

/**
 * Combined middleware for simple CREATE operations
 */
export function auditCreate(entityType: string) {
  return [
    auditBefore(entityType, 'CREATE'),
    auditAfter()
  ];
}

/**
 * Combined middleware for UPDATE operations (requires capturing old values)
 */
export function auditUpdate(entityType: string, prismaModel: any, idField = 'id') {
  return [
    auditBefore(entityType, 'UPDATE'),
    captureOldValues(prismaModel, idField),
    auditAfter()
  ];
}

/**
 * Combined middleware for DELETE operations
 */
export function auditDelete(entityType: string, prismaModel: any, idField = 'id') {
  return [
    auditBefore(entityType, 'DELETE'),
    captureOldValues(prismaModel, idField), // Capture entity before deletion
    auditAfter()
  ];
}