export interface AuthUser {
  id: string; // UUID only - no internal IDs exposed
  uuid: string; // Same as id, for compatibility
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: number;
}

export interface Session {
  id: string;
  userId: string; // UUID
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  csrfToken?: string; // CSRF token for cookie-based authentication
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  sub: string; // User UUID
  type: 'access' | 'refresh';
  sessionId: string;
  iat: number;
  exp: number;
}

export interface LoginResult {
  user: AuthUser;
  session: Session;
  tokens: TokenPair;
}