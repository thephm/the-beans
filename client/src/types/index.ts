export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
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
  images: string[];
  hours?: Record<string, any>;
  priceRange?: string;
  specialties: string[];
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  cafes?: Cafe[];
  beans?: Bean[];
  reviews?: Review[];
  isFavorited?: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  images: string[];
  hours?: Record<string, any>;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  roaster?: Roaster;
  reviews?: Review[];
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
  roaster?: Roaster;
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
  user?: User;
  roaster?: Roaster;
  cafe?: Cafe;
  comments?: Comment[];
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
  priceRange?: string;
}
