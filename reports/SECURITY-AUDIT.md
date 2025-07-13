# Security Audit: Next.js + Fastify Authentication

## Current Security Issues Found

### 🚨 Critical Issues

1. **Tokens Stored in JavaScript-Accessible Storage**
   - Tokens are stored in localStorage and non-httpOnly cookies
   - Vulnerable to XSS attacks
   - Any malicious script can steal authentication tokens

2. **No CSRF Protection**
   - State-changing requests not protected against CSRF
   - Missing CSRF tokens in forms and API requests

3. **Weak Password Requirements**
   - Only 6 character minimum
   - No complexity requirements
   - Vulnerable to brute force

4. **No Rate Limiting on Auth Endpoints**
   - Login endpoint can be brute forced
   - No account lockout mechanism

5. **Long Access Token Lifetime**
   - 7-day access tokens (should be 15 minutes max)
   - No token rotation on refresh

## Best Practices Implementation

### ✅ Secure Cookie-Based Authentication

```typescript
// Set httpOnly cookies (server-side)
reply
  .setCookie('accessToken', accessToken, {
    httpOnly: true,        // Not accessible via JavaScript
    secure: true,          // HTTPS only in production
    sameSite: 'lax',      // CSRF protection
    path: '/',
    maxAge: 15 * 60,      // 15 minutes
  })
  .setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh', // Restricted path
    maxAge: 30 * 24 * 60 * 60,    // 30 days
  });
```

### ✅ CSRF Protection

```typescript
// Double Submit Cookie Pattern
.setCookie('csrfToken', csrfToken, {
  httpOnly: false,     // Must be readable by JavaScript
  secure: true,
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60,    // 1 hour
});

// Client includes CSRF token in headers
headers.set('X-CSRF-Token', csrfToken);
```

### ✅ Rate Limiting & Account Lockout

```typescript
// Rate limit configuration
fastify.rateLimit({
  max: 5,              // 5 attempts
  timeWindow: '15 minutes',
  ban: 3,              // Ban after 3 429 responses
  skipSuccessfulRequests: true,
});

// Account lockout after failed attempts
const attempts = await redis.get(`lockout:${email}`);
if (attempts >= 5) {
  return reply.code(401).send({ error: 'Account locked' });
}
```

### ✅ Strong Password Policy

```typescript
const passwordSchema = z.string()
  .min(8)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Must contain uppercase, lowercase, number and special character'
  );
```

### ✅ Token Best Practices

1. **Short-lived Access Tokens**: 15 minutes
2. **Refresh Token Rotation**: New refresh token on each use
3. **Token Blacklisting**: Track revoked tokens in Redis
4. **No Sensitive Data in JWT**: Only user ID, no roles/permissions

### ✅ Security Headers

```typescript
// Helmet configuration
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

## Recommended Architecture

### Client-Side (Next.js)
- Never store tokens in localStorage
- Use `credentials: 'include'` for cookie-based auth
- Include CSRF token in all state-changing requests
- Implement proper error handling for 401/403 responses

### Server-Side (Fastify)
- Set httpOnly, secure, sameSite cookies
- Validate CSRF tokens on state-changing requests
- Implement rate limiting and account lockout
- Use short-lived access tokens with refresh rotation
- Fetch permissions on each request (not from JWT)
- Log all authentication events

### Database
- Store bcrypt hashed passwords (min 10 rounds)
- Track failed login attempts
- Audit log for all auth events
- Refresh token metadata (IP, user agent, created date)

## Migration Steps

1. **Update Fastify auth routes** to use secure cookies
2. **Update client API calls** to use `credentials: 'include'`
3. **Implement CSRF protection** on both client and server
4. **Add rate limiting** to auth endpoints
5. **Update password requirements** and force reset
6. **Implement refresh token rotation**
7. **Add security headers** via Helmet
8. **Enable HTTPS** in production

## Testing Checklist

- [ ] XSS attack attempts fail (tokens not accessible)
- [ ] CSRF attacks are blocked
- [ ] Brute force protection works
- [ ] Account lockout after failed attempts
- [ ] Tokens expire correctly
- [ ] Refresh token rotation works
- [ ] Logout blacklists tokens
- [ ] Security headers are present