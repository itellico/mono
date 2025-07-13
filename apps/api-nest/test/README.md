# 🧪 Testing Infrastructure

Comprehensive Jest testing setup for the NestJS API with Fastify adapter.

## 📋 Overview

Our testing infrastructure provides:

- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: Tests for module interactions
- **E2E Tests**: End-to-end API testing with real database
- **Mocks & Utilities**: Comprehensive mocking system
- **Coverage Reports**: Detailed code coverage analysis
- **CI/CD Ready**: Optimized for continuous integration

## 🚀 Quick Start

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e

# Run all tests (unit + e2e)
pnpm test:all
```

## 📁 Directory Structure

```
test/
├── README.md                    # This file
├── setup.ts                     # Unit test setup
├── setup-e2e.ts                # E2E test setup
├── jest-e2e.json               # E2E Jest configuration
├── utils/
│   ├── test-helpers.ts          # Common test utilities
│   └── test-module.factory.ts   # Module factory for tests
└── mocks/
    ├── prisma.mock.ts           # Prisma service mocks
    ├── redis.mock.ts            # Redis service mocks
    ├── config.mock.ts           # Configuration mocks
    └── metrics.mock.ts          # Metrics service mocks
```

## 🎯 Testing Commands

### Unit Tests
```bash
pnpm test:unit              # Run unit tests only
pnpm test:unit:watch        # Watch mode for unit tests
pnpm test:unit:cov          # Unit tests with coverage
```

### E2E Tests
```bash
pnpm test:e2e              # Run E2E tests
pnpm test:e2e:watch        # Watch mode for E2E tests
pnpm test:e2e:cov          # E2E tests with coverage
pnpm test:e2e:debug        # Debug E2E tests
```

### Coverage & Reports
```bash
pnpm test:cov              # Run tests with coverage
pnpm test:cov:html         # Generate HTML coverage report
pnpm test:all:cov          # Full coverage (unit + e2e)
```

### CI/CD
```bash
pnpm test:ci               # Optimized for CI (unit tests)
pnpm test:e2e:ci           # Optimized for CI (e2e tests)
```

### Database Management
```bash
pnpm test:db:setup         # Setup test database
pnpm test:db:clean         # Clean test database
```

### Utilities
```bash
pnpm test:clear            # Clear Jest cache
pnpm test:debug            # Debug unit tests
```

## 🏗️ Test Architecture

### 1. Unit Tests (`.spec.ts`)

Fast, isolated tests that mock all dependencies:

```typescript
import { TestModuleFactory } from '../../../test/utils/test-module.factory';
import { mockPrismaService } from '../../../test/mocks/prisma.mock';

describe('UserService', () => {
  let service: UserService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module = await TestModuleFactory.createServiceTestModule(
      UserService,
      [PrismaService, RedisService]
    );

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create user', async () => {
    prisma.user.create.mockResolvedValue(mockUser);
    
    const result = await service.createUser(userData);
    
    expect(result).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({ data: userData });
  });
});
```

### 2. E2E Tests (`.e2e-spec.ts`)

Integration tests with real database:

```typescript
import { TestHelpers } from './utils/test-helpers';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    app = await TestHelpers.createTestApp({ imports: [AppModule] });
  });

  it('/api/v1/auth/login (POST)', () => {
    return app
      .inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'test@example.com', password: 'password' },
      })
      .then((response) => {
        TestHelpers.assertSuccessResponse(response);
        expect(response.headers['set-cookie']).toBeDefined();
      });
  });
});
```

### 3. Mock System

Comprehensive mocking for all external dependencies:

```typescript
// Automatic mocking with TestModuleFactory
const module = await TestModuleFactory.createServiceTestModule(MyService);

// Manual mocking with specific overrides
const module = await TestModuleFactory.createTestModule({
  providers: [MyService],
  useMocks: {
    prisma: true,
    redis: false, // Use real Redis for this test
    config: true,
  },
});
```

## 📊 Coverage Requirements

Our coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Files excluded from coverage:
- DTOs, interfaces, types, enums
- Main entry point
- Test files themselves

## 🛠️ Testing Utilities

### TestHelpers

Common utilities for all tests:

```typescript
// Create test users
const user = TestHelpers.createTestUser();
const admin = TestHelpers.createPlatformAdminUser();

// Generate JWT tokens
const token = TestHelpers.generateTestToken(jwtService, user);

// Create auth headers
const headers = TestHelpers.createAuthHeaders(token);

// Assert API responses
TestHelpers.assertSuccessResponse(response, expectedData);
TestHelpers.assertErrorResponse(response, 400, 'VALIDATION_ERROR');

// Wait for async conditions
await TestHelpers.waitFor(() => someCondition);
```

### TestModuleFactory

Factory for creating test modules:

```typescript
// Service tests
const module = await TestModuleFactory.createServiceTestModule(UserService);

// Controller tests
const module = await TestModuleFactory.createControllerTestModule(UserController);

// Guard tests
const module = await TestModuleFactory.createGuardTestModule(PermissionGuard);

// Integration tests
const module = await TestModuleFactory.createIntegrationTestModule(UserModule);
```

### Mock Factories

Generate consistent test data:

```typescript
import { MockDataFactory } from '../mocks/prisma.mock';

const user = MockDataFactory.createUser({ email: 'custom@example.com' });
const tenant = MockDataFactory.createTenant({ name: 'Custom Tenant' });
const role = MockDataFactory.createRole({ name: 'Custom Role' });
```

## 🔧 Configuration

### Jest Configuration

**Unit Tests** (`jest.config.js`):
- 70% coverage threshold
- Mocked environment
- Fast execution
- Module path mapping

**E2E Tests** (`test/jest-e2e.json`):
- Real test database
- Single worker (sequential)
- Extended timeout (30s)
- Database setup/teardown

### Environment Variables

Tests use dedicated test environment:
```bash
NODE_ENV=test
DATABASE_URL=postgresql://itellico:itellico123@localhost:5433/itellico_test
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=test-secret-key-for-jwt-testing
```

## 🎯 Best Practices

### 1. Test Organization

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw error with invalid email', () => {});
    it('should handle database errors', () => {});
  });
  
  describe('getUserById', () => {
    it('should return user when found', () => {});
    it('should return null when not found', () => {});
  });
});
```

### 2. Mock Management

```typescript
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any side effects
  resetPrismaMocks();
  resetRedisMocks();
});
```

### 3. Error Testing

```typescript
it('should handle database connection errors', async () => {
  prisma.user.create.mockRejectedValue(new Error('Connection failed'));
  
  await expect(service.createUser(userData)).rejects.toThrow('Connection failed');
});
```

### 4. Async Testing

```typescript
it('should handle async operations', async () => {
  const promise = service.asyncOperation();
  
  // Test intermediate state
  expect(service.isProcessing).toBe(true);
  
  const result = await promise;
  
  // Test final state
  expect(service.isProcessing).toBe(false);
  expect(result).toBeDefined();
});
```

## 🚨 Common Issues

### 1. Open Handles

If tests hang with "Jest did not exit one second after the test run completed":

```bash
# Check for open handles
pnpm test --detectOpenHandles

# Force exit in configuration
forceExit: true
```

### 2. Database Connection

Ensure test database is running:

```bash
# Check database status
docker-compose -p mono-test ps

# Restart test services
docker-compose -p mono-test restart
```

### 3. Memory Leaks

For large test suites:

```bash
# Clear cache between runs
pnpm test:clear

# Run with limited workers
pnpm test --maxWorkers=2
```

## 📈 Performance Tips

1. **Use `beforeAll` for expensive setup**
2. **Mock external dependencies**
3. **Run tests in parallel (unit tests)**
4. **Use `maxWorkers=1` for E2E tests**
5. **Clear mocks in `afterEach`**
6. **Use test-specific database for E2E**

## 🔍 Debugging Tests

```bash
# Debug unit tests
pnpm test:debug

# Debug E2E tests
pnpm test:e2e:debug

# Run specific test file
pnpm test user.service.spec.ts

# Run specific test case
pnpm test --testNamePattern="should create user"
```

## 📝 Writing New Tests

1. **Choose test type**: Unit vs E2E
2. **Use appropriate factory**: `TestModuleFactory`
3. **Follow naming conventions**: `*.spec.ts` or `*.e2e-spec.ts`
4. **Mock external dependencies**
5. **Test both success and error cases**
6. **Maintain good coverage**

---

For more examples, see the test files in `src/` directories. Each module includes comprehensive test examples demonstrating best practices.