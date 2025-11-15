export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  language?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  role?: string;
  createdById?: string;
  updatedById?: string;
  createdBy?: {
    id: string;
    username: string;
  };
  updatedBy?: {
    id: string;
    username: string;
  };
}

export interface RoasterImage {
  id: string;
  url: string;
  publicId: string;
  filename?: string;
  description?: string;
  isPrimary: boolean;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy?: User;
}

export interface Roaster {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distance from user location (populated by backend when location query is used)
  images: string[];
  imageUrl?: string; // Added for API compatibility
  hours?: Record<string, any>;
  showHours?: boolean; // Toggle to show/hide hours section (separate from onlineOnly)
  onlineOnly?: boolean; // True if roaster operates online only (no physical location)
  specialties: { id: string; name: string; deprecated?: boolean }[];
  
  // People system
  people?: RoasterPerson[];
  
  // Source countries
  sourceCountries?: RoasterSourceCountry[];
  
  // Legacy owner fields (for backward compatibility during transition)
  ownerName?: string;
  ownerEmail?: string;
  ownerBio?: string;
  ownerMobile?: string;
  
  // Social Networks
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  threads?: string;
  pinterest?: string;
  bluesky?: string;
  x?: string;
  reddit?: string;
  
  founded?: number;
  
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  owner?: User;
  beans?: Bean[];
  reviews?: Review[];
  roasterImages?: RoasterImage[];
  isFavorited?: boolean;
  createdBy?: User;
  updatedBy?: User;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  countries?: Country[];
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO 2-letter country code
  flagSvg?: string; // Scalable vector flag (SVG content or URL)
  createdAt: string;
  updatedAt: string;
  regionId: string;
  region?: Region;
}

export interface RoasterSourceCountry {
  id: string;
  roasterId: string;
  countryId: string;
  createdAt: string;
  roaster?: Roaster;
  country?: Country;
}

export interface Bean {
  id: string;
  name: string;
  description?: string;
  origin?: string;
  process?: string;
  roastLevel?: string;
  price?: number;
  weight?: string;
  tastingNotes: string[];
  availability: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  roaster?: Roaster;
  createdBy?: User;
  updatedBy?: User;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  images: string[];
  helpful: number;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  user?: User;
  roaster?: Roaster;
  comments?: Comment[];
  createdBy?: User;
  updatedBy?: User;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  review?: Review;
}

export interface Favorite {
  id: string;
  createdAt: string;
  user?: User;
  roaster?: Roaster;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
  user?: User;
}

// API response for getRoasters
export interface RoastersResponse {
  roasters: Roaster[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchFilters {
  search?: string;
  city?: string;
  state?: string;
  specialty?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  city?: string;
  country?: string;
  createdAt: string;
  user: User | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export enum PersonRole {
  OWNER = "owner",
  ADMIN = "admin", 
  BILLING = "billing",
  MARKETING = "marketing"
}

export interface RoasterPerson {
  id: string;
  roasterId: string;
  roaster?: {
    id: string;
    name: string;
  };
  firstName: string;
  lastName?: string;
  title?: string;
  email?: string;
  mobile?: string;
  linkedinUrl?: string;
  bio?: string;
  userId?: string;
  user?: User;
  roles: PersonRole[];
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  createdBy?: User;
  updatedBy?: User;
}

export interface PersonPermissions {
  canEditRoaster: boolean;
  canManagePeople: boolean;
  canViewBilling: boolean;
  canEditBilling: boolean;
  canDeleteRoaster: boolean;
}

export interface AuditLogStats {
  totalLogs: number;
  recentLogs: number;
  actionStats: Array<{ action: string; count: number }>;
  entityTypeStats: Array<{ entityType: string; count: number }>;
  topUsers: Array<{ user: User; count: number }>;
}

export interface SpecialtyTranslation {
  id: string;
  specialtyId: string;
  language: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Specialty {
  id: string;
  deprecated: boolean;
  roasterCount: number;
  translations: Record<string, { name: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtyListItem {
  id: string;
  name: string;
  description: string;
  deprecated: boolean;
  roasterCount: number;
  createdAt: string;
  updatedAt: string;
}
