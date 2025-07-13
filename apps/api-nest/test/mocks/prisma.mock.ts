/**
 * Prisma Service Mock
 * Provides mock implementation for Prisma operations in unit tests
 */

export const mockPrismaService = {
  // User operations
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Tenant operations
  tenant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Account operations
  account: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Role operations
  role: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // Permission operations
  permission: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },

  // UserRole operations
  userRole: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  // RolePermission operations
  rolePermission: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  // Transaction methods
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),

  // Connection methods
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

/**
 * Factory for creating mock data
 */
export class MockDataFactory {
  static createUser(overrides: any = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '$2b$10$test.hash',
      isActive: true,
      currentTenantId: '1',
      currentAccountId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createTenant(overrides: any = {}) {
    return {
      id: '1',
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      settings: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createAccount(overrides: any = {}) {
    return {
      id: '1',
      name: 'Test Account',
      tenantId: '1',
      settings: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createRole(overrides: any = {}) {
    return {
      id: '1',
      name: 'Test Role',
      description: 'Test role description',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createPermission(overrides: any = {}) {
    return {
      id: '1',
      name: 'test.permission',
      description: 'Test permission',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createUserRole(overrides: any = {}) {
    return {
      id: '1',
      userId: '1',
      roleId: '1',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createRolePermission(overrides: any = {}) {
    return {
      id: '1',
      roleId: '1',
      permissionId: '1',
      createdAt: new Date(),
      ...overrides,
    };
  }
}

/**
 * Reset all mocks
 */
export function resetPrismaMocks() {
  Object.keys(mockPrismaService).forEach(key => {
    if (typeof mockPrismaService[key] === 'object' && mockPrismaService[key] !== null) {
      Object.keys(mockPrismaService[key]).forEach(method => {
        if (jest.isMockFunction(mockPrismaService[key][method])) {
          mockPrismaService[key][method].mockReset();
        }
      });
    } else if (jest.isMockFunction(mockPrismaService[key])) {
      mockPrismaService[key].mockReset();
    }
  });
}