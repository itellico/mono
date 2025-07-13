# Authentication Best Practices - itellico Mono

## Current Architecture (January 2025)

The itellico Mono uses a **hybrid authentication architecture** with:
- **Fastify API Server** (Port 3001) - Handles all authentication logic
- **Custom Auth Context** - Client-side state management
- **JWT Tokens** - Secure token-based authentication

## 🔒 **Security Best Practices**

### **1. ID Security & Enumeration Prevention**

#### **UUID-First Architecture**
- **✅ ALL public APIs use UUIDs** - Never expose sequential integer IDs
- **✅ Secure ID generation** - Use UUID v4 for unpredictable identifiers
- **✅ Consistent UUID usage** - UUIDs in URLs, API responses, and client state

```typescript
// ✅ SECURE: API Response Format
{
  "user": {
    "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Always use UUID
    "email": "user@example.com",
    // id: 12345 ← Never expose integer IDs
  }
}

// ✅ SECURE: API Endpoints
GET /api/v1/users/f47ac10b-58cc-4372-a567-0e02b2c3d479
// NOT: /api/v1/users/12345
```

#### **Critical Security Fixes Applied**
- **🔒 Enumeration Attack Prevention**: Sequential IDs replaced with UUIDs
- **🔒 Tenant Boundary Enforcement**: All queries scoped to authenticated tenant
- **🔒 Permission Validation**: Every API call validates proper authorization
- **🔒 Audit Trail**: Complete logging of authentication events

### **2. RBAC Security Implementation**

#### **Secure Permission Architecture**
- **Single Permission Path**: All access goes through roles (no direct user permissions)
- **Wildcard Patterns**: `admin.*`, `users.read.*` for scalable permissions
- **Tenant Isolation**: Every permission check includes tenant context
- **Complete Audit Trail**: All permission checks logged for security analysis

#### **Eliminated Security Anti-Patterns**
- ❌ **Direct User Permissions** - Removed bypassing of RBAC system
- ❌ **Emergency Access** - Removed security backdoors
- ❌ **Sequential ID Exposure** - All public APIs use UUIDs only
- ❌ **Predictable Resource IDs** - Enumeration attacks prevented

## Best Practice Implementation

### 1. **API-First Authentication**
```typescript
// All auth logic lives in Fastify API
apps/api/src/routes/v1/auth/
├── login.ts      // POST /api/v1/auth/login
├── register.ts   // POST /api/v1/auth/register
├── logout.ts     // POST /api/v1/auth/logout
└── me.ts         // GET /api/v1/auth/me
```

### 2. **Client-Side Auth Context**
```typescript
// src/contexts/auth-context.tsx
const AuthContext = createContext<AuthContextType>();

export function AuthProvider({ children }) {
  // Manages user state
  // Handles API calls
  // Provides auth methods (login, logout, register)
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### 3. **Token Management**
```typescript
// src/lib/api-client.ts
class ApiClient {
  // Stores tokens in localStorage
  // Adds Authorization header to requests
  // Handles token refresh
  // Manages 401 responses
}
```

## Why This Is Best Practice

### ✅ **Separation of Concerns**
- Authentication logic centralized in API
- Frontend only handles UI/UX
- Clear boundaries between systems

### ✅ **Security**
- Tokens stored securely
- Server-side validation
- No sensitive logic in frontend
- CORS properly configured

### ✅ **Scalability**
- API can serve multiple frontends
- Easy to add mobile apps
- Microservice-ready architecture

### ✅ **Developer Experience**
- Simple `useAuth()` hook
- Consistent API patterns
- Clear error handling
- Type-safe with TypeScript

## Common Patterns

### Protected Routes
```typescript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) {
    redirect('/auth/signin');
    return null;
  }
  
  return children;
}
```

### Using Auth in Components
```typescript
function UserProfile() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### API Calls with Auth
```typescript
// Automatically includes auth token
const response = await apiClient.get('/api/v1/users/profile');
```

## Migration from NextAuth

If migrating from NextAuth:

1. **Remove NextAuth dependencies**
   ```bash
   npm uninstall next-auth @auth/prisma-adapter
   ```

2. **Update components**
   ```typescript
   // Before
   import { useSession } from 'next-auth/react';
   const { data: session } = useSession();
   
   // After
   import { useAuth } from '@/contexts/auth-context';
   const { user } = useAuth();
   ```

3. **Remove NextAuth API routes**
   - Delete `/src/app/api/auth/[...nextauth]/`
   - Remove `authOptions` from `/src/lib/auth.ts`

## Environment Variables

```env
# API Configuration
API_URL=http://localhost:3001
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Remove NextAuth variables
# NEXTAUTH_URL=
# NEXTAUTH_SECRET=
```

## Testing Authentication

```bash
# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test protected endpoint
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] Tokens expire appropriately (15min access, 7d refresh)
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Rate limiting on auth endpoints
- [ ] Password hashing with bcrypt
- [ ] SQL injection prevention with Prisma
- [ ] XSS protection with React
- [ ] CSRF tokens for state-changing operations

## Monitoring

- Track failed login attempts
- Monitor token refresh patterns
- Alert on suspicious activity
- Log authentication events
- Measure auth endpoint performance

---

**Last Updated**: January 2025  
**Status**: ✅ Production Ready