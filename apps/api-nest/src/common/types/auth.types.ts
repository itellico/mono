export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tier: string;
  permissions: string[];
  tenantId?: string;
  accountId?: string;
  currentTenantId?: string;
  currentAccountId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tier: string;
  tenantId?: string;
  accountId?: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken?: string;
  };
}