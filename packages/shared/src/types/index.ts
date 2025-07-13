// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  pagination: PaginationMeta;
}> {}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  roles: string[];
  permissions: string[];
  tenant: {
    id: number;
    uuid: string;
    name: string;
  };
}

// Common enums
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum AccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}