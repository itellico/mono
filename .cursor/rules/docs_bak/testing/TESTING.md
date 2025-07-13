# itellico Mono Testing Guide

## 🎯 **Testing Philosophy: "Prove It Works Before You Claim It"**

> **Rule #1**: Never claim something is "fixed" or "working" without tests that prove it.
> **Rule #2**: If you can't test it automatically, test it manually and document the steps.
> **Rule #3**: Tests should catch bugs, not just pass for the sake of passing.

---

## 📋 **Testing Pyramid & Strategy**

### **1. Unit Tests (70%)**
- **Purpose**: Test individual functions and classes in isolation
- **Speed**: Fast (< 100ms per test)
- **Scope**: Single function, method, or class
- **Examples**: Service methods, utility functions, validation logic

### **2. Integration Tests (20%)**
- **Purpose**: Test how multiple units work together
- **Speed**: Medium (100ms - 1s per test)
- **Scope**: API routes, database operations, service interactions
- **Examples**: API endpoints with real database calls

### **3. Component Tests (8%)**
- **Purpose**: Test React components with user interactions
- **Speed**: Medium (100ms - 1s per test)
- **Scope**: Component rendering, props, user events
- **Examples**: Form submissions, conditional rendering

### **4. End-to-End Tests (2%)**
- **Purpose**: Test complete user workflows
- **Speed**: Slow (1s - 30s per test)
- **Scope**: Full application flows
- **Examples**: User registration to profile creation

---

## 🚀 **Quick Start: Testing Setup**

### **1. Install Dependencies**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest
```

### **2. Configuration Files**

**jest.config.js**
```javascript
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

export default createJestConfig(config);
```

**package.json scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## 🧪 **Unit Testing: Services & Functions**

### **Example: Testing TenantsService**

**❌ BAD TEST (Would Not Catch Bugs)**
```typescript
describe('TenantsService', () => {
  it('should exist', () => {
    const service = new TenantsService();
    expect(service).toBeDefined();
  });
});
```

**✅ GOOD TEST (Catches Real Bugs)**
```typescript
describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(() => {
    service = new TenantsService();
    jest.clearAllMocks();
  });

  describe('getAll method', () => {
    it('should exist as a method', () => {
      // This would have caught the missing getAll method immediately
      expect(typeof service.getAll).toBe('function');
    });

    it('should handle currency filter parameter', async () => {
      // This would have caught the missing currency parameter handling
      const mockTenants = [{ id: '1', primaryCurrency: 'USD' }];
      mockPrisma.tenant.findMany.mockResolvedValue(mockTenants);

      await service.getAll({ currency: 'USD,GBP' });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        where: {
          primaryCurrency: { in: ['USD', 'GBP'] }
        },
        // ... other expected parameters
      });
    });

    it('should handle userCountRange filter parameter', async () => {
      // This would have caught the missing userCountRange parameter handling
      await service.getAll({ userCountRange: '1-10,11-50' });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { users: { _count: { gte: 1, lte: 10 } } },
            { users: { _count: { gte: 11, lte: 50 } } }
          ]
        },
        // ... other expected parameters
      });
    });

    it('should return proper pagination structure', async () => {
      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('tenants');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasMore: expect.any(Boolean)
      });
    });
  });
});
```

### **Key Testing Patterns for Services:**

1. **Method Existence**: `expect(typeof service.method).toBe('function')`
2. **Parameter Handling**: Verify all parameters are processed correctly
3. **Return Value Structure**: Test exact shape of returned data
4. **Error Handling**: Test failure scenarios
5. **Database Calls**: Verify correct Prisma queries are made

---

## 🔌 **API Route Testing**

### **Example: Testing GET /api/v1/admin/tenants**

```typescript
describe('GET /api/v1/admin/tenants', () => {
  it('should pass all URL parameters to service', async () => {
    // This test would have caught missing parameter handling
    const url = 'http://localhost/api/v1/admin/tenants?currency=USD&userCountRange=1-10&status=active&search=test';
    const request = new NextRequest(url);
    
    await GET(request);

    expect(mockTenantsService.getAll).toHaveBeenCalledWith({
      search: 'test',
      status: 'active',
      currency: 'USD',
      userCountRange: '1-10',
      page: 1,
      limit: 20
    });
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/v1/admin/tenants');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should handle service errors gracefully', async () => {
    mockTenantsService.getAll.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/v1/admin/tenants');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Failed to retrieve tenants');
  });
});
```

### **API Testing Checklist:**

- [ ] **Parameter Parsing**: All URL params are correctly extracted
- [ ] **Service Calls**: Correct parameters passed to service layer
- [ ] **Authentication**: Proper auth checks and responses
- [ ] **Authorization**: Permission validation works
- [ ] **Error Handling**: Graceful error responses
- [ ] **Response Format**: Consistent API response structure

---

## 🧩 **Component Testing**

### **Example: Testing AdminEditPage**

```typescript
describe('AdminEditPage', () => {
  it('should handle undefined permissions gracefully', () => {
    // This test would have caught the runtime error immediately
    const userContext = {
      userId: 'user-123',
      adminRole: 'admin',
      tenantId: null,
      permissions: undefined // This caused the actual bug
    };

    expect(() => {
      render(
        <AdminEditPage
          title="Test Page"
          tabs={mockTabs}
          userContext={userContext}
          data={{}}
          isLoading={false}
          isSaving={false}
          isDeleting={false}
          errors={[]}
          onSave={jest.fn()}
          onValidate={jest.fn()}
          onFormChange={jest.fn()}
          isDirty={false}
        />
      );
    }).not.toThrow();
  });

  it('should show correct tabs based on permissions', () => {
    const userContext = {
      permissions: ['read:tenants'] // Only read permission
    };

    render(<AdminEditPage {...props} userContext={userContext} />);

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Settings')).not.toBeInTheDocument();
  });
});
```

---

## 📊 **Manual Testing Procedures**

### **Tenant Module Manual Test Checklist**

#### **List Page (`/admin/tenants`)**
- [ ] **Load**: Page loads without errors
- [ ] **Display**: Tenants are displayed in table format
- [ ] **Search**: Text search filters results correctly
- [ ] **Status Filter**: Active/Inactive/All filters work
- [ ] **Currency Filter**: Single and multiple currency filters work
- [ ] **User Count Filter**: Range filters work correctly
- [ ] **Pagination**: Page navigation works
- [ ] **Sorting**: Column sorting functions
- [ ] **Actions**: Edit/Delete buttons are visible and functional

#### **Create Page (`/admin/tenants/new`)**
- [ ] **Load**: Page loads without errors
- [ ] **Form**: All required fields are present
- [ ] **Validation**: Client-side validation works
- [ ] **Submit**: Form submission creates tenant
- [ ] **Redirect**: Successful creation redirects to list
- [ ] **Error Handling**: Server errors are displayed

#### **Edit Page (`/admin/tenants/[uuid]/edit`)**
- [ ] **Load**: Page loads with existing tenant data
- [ ] **Form**: All fields are populated correctly
- [ ] **Update**: Form submission updates tenant
- [ ] **Validation**: Both client and server validation work
- [ ] **Cancel**: Cancel button works without saving
- [ ] **Delete**: Delete functionality works with confirmation

#### **Permissions & Security**
- [ ] **Authentication**: Unauthenticated users are redirected
- [ ] **Authorization**: Non-admin users cannot access
- [ ] **Tenant Isolation**: Users only see appropriate data
- [ ] **Audit Logging**: All actions are properly logged

---

## 🚨 **Bug Prevention Testing Patterns**

### **Common Bug Categories & Tests**

#### **1. Undefined/Null Errors**
```typescript
// Test all possible undefined scenarios
it('should handle undefined props gracefully', () => {
  const scenarios = [
    { userContext: undefined },
    { userContext: { permissions: undefined } },
    { userContext: { permissions: null } },
    { userContext: { permissions: [] } }
  ];

  scenarios.forEach(scenario => {
    expect(() => render(<Component {...scenario} />)).not.toThrow();
  });
});
```

#### **2. Missing API Parameters**
```typescript
// Test that all expected parameters are handled
it('should handle all filter parameters', async () => {
  const allParams = {
    search: 'test',
    status: 'active',
    currency: 'USD,GBP',
    userCountRange: '1-10,11-50',
    page: 2,
    limit: 10
  };

  await apiFunction(allParams);

  // Verify each parameter was processed
  expect(mockImplementation).toHaveBeenCalledWith(
    expect.objectContaining(allParams)
  );
});
```

#### **3. Service Method Existence**
```typescript
// Test that required methods exist
describe('Required Methods', () => {
  const service = new MyService();
  
  const requiredMethods = ['getAll', 'getById', 'create', 'update', 'delete'];
  
  requiredMethods.forEach(method => {
    it(`should have ${method} method`, () => {
      expect(typeof service[method]).toBe('function');
    });
  });
});
```

---

## 📈 **Test Quality Metrics**

### **Coverage Requirements**
- **Services**: 90%+ line coverage
- **API Routes**: 85%+ line coverage  
- **Components**: 80%+ line coverage
- **Utilities**: 95%+ line coverage

### **Example: Good vs Bad Test Names**

**❌ BAD:**
```typescript
it('should work', () => { ... });
it('test user creation', () => { ... });
it('handles error', () => { ... });
```

**✅ GOOD:**
```typescript
it('should return 400 when email is missing from request body', () => { ... });
it('should create user with valid data and return 201 status', () => { ... });
it('should handle database connection failure gracefully', () => { ... });
```

---

## 🚀 **Quick Testing Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only service tests
npm test -- --testPathPatterns=services

# Run only component tests
npm test -- --testPathPatterns=components

# Run tests for specific file
npm test -- TenantService.test.ts

# Run tests in CI mode (no watch, exit after run)
npm run test:ci
```

---

## 🎓 **Testing Best Practices Summary**

### **The Testing Mindset**
1. **Test First**: Write tests before or alongside code
2. **Think Like a User**: Test what users actually do
3. **Edge Cases Matter**: Test undefined, null, empty, and extreme values
4. **Fail Fast**: Tests should catch bugs immediately
5. **Document Behavior**: Tests serve as living documentation

### **What Makes a Good Test**
- **Reliable**: Always gives the same result
- **Fast**: Runs quickly to encourage frequent execution
- **Isolated**: Doesn't depend on other tests or external state
- **Clear**: Easy to understand what's being tested
- **Valuable**: Catches real bugs and prevents regressions

### **Red Flags in Testing**
- Tests that never fail
- Tests that test implementation details instead of behavior
- Tests that require extensive setup to run
- Tests with unclear or missing assertions
- Tests that are flaky (sometimes pass, sometimes fail)

---

## 📚 **Manual Testing Script Template**

```bash
#!/bin/bash
# Manual Testing Script for Tenant Module

echo "🧪 STARTING MANUAL TESTS FOR TENANT MODULE"

echo "📝 1. Testing List Page..."
curl -s "http://localhost:3000/admin/tenants" | grep -q "Tenants" && echo "✅ List page loads" || echo "❌ List page fails"

echo "📝 2. Testing API Endpoints..."
# Test basic list endpoint
curl -s "http://localhost:3000/api/v1/admin/tenants" | jq '.success' | grep -q true && echo "✅ API list works" || echo "❌ API list fails"

# Test currency filter
curl -s "http://localhost:3000/api/v1/admin/tenants?currency=USD" | jq '.success' | grep -q true && echo "✅ Currency filter works" || echo "❌ Currency filter fails"

# Test user count filter
curl -s "http://localhost:3000/api/v1/admin/tenants?userCountRange=1-10" | jq '.success' | grep -q true && echo "✅ User count filter works" || echo "❌ User count filter fails"

echo "🏁 MANUAL TESTS COMPLETE"
```

---

**Remember: Good tests are an investment in code quality and developer confidence. They catch bugs early, prevent regressions, and serve as documentation for how the system should behave.** 