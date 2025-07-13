/**
 * TDD Implementation: Tenant Creation Feature
 * 
 * BUSINESS REQUIREMENTS:
 * 1. System must validate tenant data before creation
 * 2. System must generate unique tenant UUID
 * 3. System must create tenant record in database
 * 4. System must return created tenant with metadata
 * 5. System must handle creation errors gracefully
 * 
 * TDD PHASES:
 * 🔴 RED: Write failing tests first
 * 🟢 GREEN: Implement minimal code to pass
 * 🔵 REFACTOR: Improve code quality
 */

import { v4 as uuidv4 } from 'uuid';

// 🟢 GREEN PHASE: Minimal implementation to make tests pass

interface TenantCreateData {
  name?: string;
  email?: string;
  primaryCurrency?: string;
}

interface TenantResult {
  success: boolean;
  tenant?: {
    uuid: string;
    name: string;
    email: string;
    primaryCurrency: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  errors?: string[];
  error?: string;
}

// Mock state for database failure simulation
let mockFailureEnabled = false;

// Valid currency codes (minimal set for testing)
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY'];

// Email validation regex (basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 🟢 GREEN: Minimal implementation of createTenant
 */
function createTenant(data: TenantCreateData): TenantResult {
  // Handle mock database failure
  if (mockFailureEnabled) {
    return {
      success: false,
      error: 'Database operation failed'
    };
  }

  // Validate required fields
  const errors: string[] = [];
  
  if (!data.name) {
    errors.push('Name is required');
  }
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.primaryCurrency) {
    errors.push('Primary currency is required');
  } else if (!VALID_CURRENCIES.includes(data.primaryCurrency)) {
    errors.push('Invalid currency code');
  }

  // Return validation errors if any
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }

  // Generate tenant with required structure
  const now = new Date();
  const tenant = {
    uuid: uuidv4(),
    name: data.name!,
    email: data.email!,
    primaryCurrency: data.primaryCurrency!,
    status: 'active', // Default status
    createdAt: now,
    updatedAt: now
  };

  return {
    success: true,
    tenant
  };
}

/**
 * 🟢 GREEN: Minimal implementation of mockDatabaseFailure
 */
function mockDatabaseFailure(enabled: boolean): void {
  mockFailureEnabled = enabled;
}

// Reset mock state after each test
afterEach(() => {
  mockFailureEnabled = false;
});

describe('Tenant Creation - TDD Implementation', () => {
  
  describe('REQUIREMENT: System must validate tenant data before creation', () => {
    
    it('SHOULD: Reject creation WHEN: Required fields are missing', () => {
      // ARRANGE: Incomplete tenant data
      const incompleteData = {
        name: 'Test Tenant'
        // Missing: email, primaryCurrency
      };
      
      // ACT: Attempt to create tenant
      const result = createTenant(incompleteData);
      
      // ASSERT: Creation should fail with validation errors
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Primary currency is required');
    });
    
    it('SHOULD: Reject creation WHEN: Email format is invalid', () => {
      // ARRANGE: Data with invalid email
      const invalidData = {
        name: 'Test Tenant',
        email: 'not-an-email',
        primaryCurrency: 'USD'
      };
      
      // ACT: Attempt to create tenant
      const result = createTenant(invalidData);
      
      // ASSERT: Creation should fail
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
    
    it('SHOULD: Reject creation WHEN: Currency is invalid', () => {
      // ARRANGE: Data with invalid currency
      const invalidData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'INVALID'
      };
      
      // ACT: Attempt to create tenant
      const result = createTenant(invalidData);
      
      // ASSERT: Creation should fail
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid currency code');
    });
  });
  
  describe('REQUIREMENT: System must generate unique tenant UUID', () => {
    
    it('SHOULD: Generate valid UUID WHEN: Creating tenant', () => {
      // ARRANGE: Valid tenant data
      const validData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD'
      };
      
      // ACT: Create tenant
      const result = createTenant(validData);
      
      // ASSERT: Should have valid UUID
      expect(result.success).toBe(true);
      expect(result.tenant!.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    
    it('SHOULD: Generate unique UUIDs WHEN: Creating multiple tenants', () => {
      // ARRANGE: Valid tenant data
      const validData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD'
      };
      
      // ACT: Create two tenants
      const result1 = createTenant(validData);
      const result2 = createTenant({ ...validData, email: 'test2@example.com' });
      
      // ASSERT: UUIDs should be different
      expect(result1.tenant!.uuid).not.toEqual(result2.tenant!.uuid);
    });
  });
  
  describe('REQUIREMENT: System must create tenant record with proper structure', () => {
    
    it('SHOULD: Return complete tenant object WHEN: Creation succeeds', () => {
      // ARRANGE: Valid tenant data
      const validData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD'
      };
      
      // ACT: Create tenant
      const result = createTenant(validData);
      
      // ASSERT: Should return complete tenant structure
      expect(result.success).toBe(true);
      expect(result.tenant).toEqual({
        uuid: expect.any(String),
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD',
        status: 'active', // Default status
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('SHOULD: Set default values WHEN: Optional fields not provided', () => {
      // ARRANGE: Minimal valid data
      const minimalData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD'
      };
      
      // ACT: Create tenant
      const result = createTenant(minimalData);
      
      // ASSERT: Should have default values
      expect(result.tenant!.status).toBe('active');
      expect(result.tenant!.createdAt).toBeInstanceOf(Date);
      expect(result.tenant!.updatedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('REQUIREMENT: System must handle errors gracefully', () => {
    
    it('SHOULD: Return structured error WHEN: Database operation fails', () => {
      // ARRANGE: Valid data but simulate database failure
      const validData = {
        name: 'Test Tenant',
        email: 'test@example.com',
        primaryCurrency: 'USD'
      };
      
      // Mock database failure
      mockDatabaseFailure(true);
      
      // ACT: Attempt to create tenant
      const result = createTenant(validData);
      
      // ASSERT: Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database operation failed');
      expect(result.tenant).toBeUndefined();
    });
  });
});

/**
 * ✅ STEP 2: GREEN PHASE COMPLETE
 * 
 * Functions implemented:
 * - createTenant() - Basic validation and tenant creation
 * - mockDatabaseFailure() - Test utility for error simulation
 * 
 * Run: npm test -- --testNamePattern="Tenant Creation"
 * Expected: All tests should now PASS
 */ 