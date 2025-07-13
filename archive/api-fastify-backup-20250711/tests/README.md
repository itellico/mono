# API Tests - Production Grade Testing

This directory contains comprehensive tests for the Fastify API server using real databases and following OWASP security guidelines.

## 🚀 Quick Start

```bash
# 1. Start test infrastructure (PostgreSQL + Redis)
pnpm test:setup

# 2. Run all tests
pnpm test

# 3. Run specific test categories
pnpm test:unit          # Unit tests (fast, isolated)
pnpm test:integration   # Integration tests (real DB)
pnpm test:security      # Security tests (OWASP compliance)
```

## 📁 Test Structure

```
tests/
├── setup.ts              # Global test setup and utilities
├── global-setup.ts       # Runs once before all tests
├── helpers/
│   ├── app.helper.ts     # Fastify app test helper
│   └── security.helper.ts # Security testing utilities
├── unit/                 # Unit tests (isolated, fast)
│   └── services/
├── routes/              # Integration tests (real database)
│   ├── auth.test.ts     # Authentication endpoints
│   ├── admin.test.ts    # Admin endpoints
│   └── ...
└── security/            # Security tests (OWASP compliance)
    ├── sql-injection.test.ts
    ├── rate-limiting.test.ts
    └── ...
```

## 🗄️ Test Infrastructure

### Docker Services
- **PostgreSQL** (port 5433) - Test database
- **Redis** (port 6380) - Test cache
- **Mailpit** (port 8026) - Email testing UI
- **OWASP ZAP** (port 8090) - Security scanner (optional)

### Test Credentials
- **Super Admin**: superadmin@test.com / Test123!
- **Admin**: admin@test.com / Test123!
- **User**: user1@test.com / Test123!

## ✍️ Writing Tests

### Basic Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import { testWithApp } from '../helpers/app.helper';

describe('My Feature', () => {
  it('should work correctly', async () => {
    await testWithApp(async (helper) => {
      const response = await helper.request({
        method: 'GET',
        url: '/api/v1/my-endpoint'
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        data: expect.any(Object)
      });
    });
  });
});
```

### Authenticated Test

```typescript
it('should require authentication', async () => {
  await testWithApp(async (helper) => {
    // Login as specific user type
    const auth = await helper.loginAs('user');
    
    // Make authenticated request
    const response = await helper.authenticatedRequest({
      method: 'GET',
      url: '/api/v1/user/profile',
      token: auth.accessToken
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json().data.user.email).toBe('user1@test.com');
  });
});
```

### Security Test (OWASP Compliance)

```typescript
import { SecurityTestHelper } from '../helpers/security.helper';

it('MUST prevent SQL injection attacks', async () => {
  await testWithApp(async (helper) => {
    const security = new SecurityTestHelper(helper);
    const payloads = security.getSQLInjectionPayloads();
    
    for (const payload of payloads) {
      const response = await helper.request({
        method: 'POST',
        url: '/api/v1/public/auth/login',
        payload: { email: payload, password: 'test' }
      });
      
      // Must reject with validation error, not database error
      expect([400, 401]).toContain(response.statusCode);
      
      // No database errors should be exposed
      const body = JSON.stringify(response.json());
      expect(body).not.toContain('syntax error');
      expect(body).not.toContain('PostgreSQL');
    }
  });
});
```

### Rate Limiting Test

```typescript
it('MUST enforce rate limiting', async () => {
  await testWithApp(async (helper) => {
    const result = await helper.testRateLimit('/api/v1/public/auth/login', 5);
    
    expect(result.rateLimited).toBe(true);
    expect(result.successfulRequests).toBeLessThanOrEqual(5);
    expect(result.lastResponse.statusCode).toBe(429);
    expect(result.lastResponse.headers['retry-after']).toBeDefined();
  });
});
```

## 🛡️ Security Testing

### OWASP API Security Top 10 Coverage

- ✅ **API1:2023** - Broken Object Level Authorization
- ✅ **API2:2023** - Broken Authentication
- ✅ **API3:2023** - Broken Object Property Level Authorization
- ✅ **API4:2023** - Unrestricted Resource Consumption
- ✅ **API5:2023** - Broken Function Level Authorization
- ✅ **API8:2023** - Security Misconfiguration

### Security Test Helpers

```typescript
const security = new SecurityTestHelper(app);

// Test SQL injection
await security.testSQLInjection('/api/endpoint');

// Test user enumeration
const enumeration = await security.testUserEnumeration('/login');
expect(enumeration.existingUser.message).toBe(enumeration.nonExistingUser.message);

// Test timing attacks
const timings = await security.testTimingAttack('/login', [
  { email: 'exists@test.com', password: 'wrong' },
  { email: 'notexist@test.com', password: 'wrong' }
]);
expect(Math.abs(timings[0] - timings[1])).toBeLessThan(50);

// Test security headers
const headers = await security.testSecurityHeaders('/');
expect(headers['x-frame-options']).toBe('DENY');
```

## 🏃 Running Tests

### Local Development

```bash
# Setup (run once)
cd apps/api
pnpm test:setup         # Start Docker services

# Run tests
pnpm test              # All tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report

# Specific test files
pnpm test auth.test.ts
pnpm test -- --grep "should login"

# UI mode for debugging
pnpm test:ui
```

### CI/CD Pipeline

Tests run automatically via GitHub Actions:
- On push to main/develop
- On all pull requests
- Nightly security audits

See `.github/workflows/test.yml` for configuration.

## 🔧 Test Utilities

### TestAppHelper Methods

```typescript
const helper = new TestAppHelper();

// Login helpers
await helper.loginAs('admin');        // Get admin token
await helper.loginAs('user');         // Get user token
await helper.loginAs('superadmin');   // Get superadmin token

// Request helpers
await helper.request(options);              // Unauthenticated
await helper.authenticatedRequest(options); // With auth token
await helper.adminRequest(options);         // As admin
await helper.superAdminRequest(options);    // As superadmin

// Testing helpers
await helper.testRateLimit(endpoint, limit);
await helper.measureResponseTime(request);
```

### Test Data Factories

```typescript
// Create test user in database
const user = await testUtils.createTestUser({
  email: 'custom@test.com',
  roleId: 1 // super_admin
});

// Create test tenant
const tenant = await testUtils.createTestTenant({
  name: 'Test Company',
  isActive: true
});

// Create session
const sessionId = await testUtils.createSession(user.uuid);
```

## 🎯 Best Practices

### 1. Test Real Behavior
```typescript
// ❌ Bad: Testing implementation
expect(bcrypt.hash).toHaveBeenCalled();

// ✅ Good: Testing behavior
const stored = await prisma.user.findUnique({ where: { id } });
expect(stored.password).not.toBe('plaintext');
```

### 2. Be Specific with Assertions
```typescript
// ❌ Bad: Multiple acceptable outcomes
expect([200, 401, 404]).toContain(response.statusCode);

// ✅ Good: Exact expectation
expect(response.statusCode).toBe(401);
expect(response.json().error).toBe('UNAUTHORIZED');
```

### 3. Test Security Properly
```typescript
// Always test:
- SQL injection prevention
- XSS protection
- Rate limiting
- Authentication bypass attempts
- Error message information disclosure
```

### 4. Clean Up After Tests
```typescript
afterEach(async () => {
  // Clean created test data
  if (testUser) {
    await prisma.user.delete({ where: { id: testUser.id } });
  }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using test ports
   lsof -i :5433  # Test PostgreSQL
   lsof -i :6380  # Test Redis
   ```

2. **Test data not found**
   ```bash
   # Re-seed test database
   pnpm seed:test
   ```

3. **Slow tests**
   - Check for N+1 queries
   - Use test transactions where possible
   - Minimize database round trips

4. **Flaky tests**
   - Add proper waits: `await testUtils.waitForCondition(...)`
   - Check for race conditions
   - Ensure proper test isolation

### Debug Mode

```bash
# Run with debug output
DEBUG=* pnpm test

# Run single test with logs
pnpm test -- auth.test.ts --reporter=verbose
```

## 📊 Coverage

### Requirements
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

### View Coverage Report
```bash
pnpm test:coverage
open coverage/index.html
```

## 📚 Resources

- [Testing Best Practices Guide](../../../docs/testing/TESTING_BEST_PRACTICES.md)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vitest Documentation](https://vitest.dev/)
- [Fastify Testing Guide](https://www.fastify.io/docs/latest/Guides/Testing/)