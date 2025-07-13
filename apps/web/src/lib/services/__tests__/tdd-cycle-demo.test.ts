/**
 * REAL TDD Cycle Demonstration
 * 
 * This will show the actual Red → Green → Refactor cycle
 * 
 * STEP 1: RED - Write failing tests first
 * STEP 2: GREEN - Implement minimal code to make tests pass  
 * STEP 3: REFACTOR - Improve code quality
 */

// 🟢 STEP 2: Implement the function to make tests pass
interface Tenant {
  status: string;
  activeUserCount: number;
}

interface TransitionResult {
  allowed: boolean;
  reason: string;
}

function canTransitionStatus(tenant: Tenant, newStatus: string): TransitionResult {
  // Minimal implementation to make tests pass
  if (tenant.status === 'active' && newStatus === 'inactive') {
    if (tenant.activeUserCount > 0) {
      return {
        allowed: false,
        reason: 'Cannot deactivate tenant with active users'
      };
    }
  }
  
  // Allow all other transitions
  return {
    allowed: true,
    reason: ''
  };
}

describe('REAL TDD Cycle: Tenant Status Management', () => {
  
  describe('REQUIREMENT: System must validate tenant status transitions', () => {
    
    it('SHOULD: Allow active → inactive transition WHEN: Tenant has no active users', () => {
      // ARRANGE: Active tenant with no users
      const tenant = { status: 'active', activeUserCount: 0 };
      
      // ACT: Attempt status transition
      const result = canTransitionStatus(tenant, 'inactive');
      
      // ASSERT: Transition should be allowed
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('');
    });
    
    it('SHOULD: Reject active → inactive transition WHEN: Tenant has active users', () => {
      // ARRANGE: Active tenant with users
      const tenant = { status: 'active', activeUserCount: 5 };
      
      // ACT: Attempt status transition
      const result = canTransitionStatus(tenant, 'inactive');
      
      // ASSERT: Transition should be rejected
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot deactivate tenant with active users');
    });
    
    it('SHOULD: Allow inactive → active transition WHEN: Always permitted', () => {
      // ARRANGE: Inactive tenant
      const tenant = { status: 'inactive', activeUserCount: 0 };
      
      // ACT: Attempt status transition
      const result = canTransitionStatus(tenant, 'active');
      
      // ASSERT: Transition should be allowed
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('');
    });
  });
});

/**
 * 🚨 INTENTIONALLY NO IMPLEMENTATION YET!
 * 
 * This is proper TDD:
 * 1. Write the test first
 * 2. Run it (should fail)
 * 3. Then implement the code
 * 
 * The function `canTransitionStatus` doesn't exist yet.
 * The test will fail with "canTransitionStatus is not defined"
 */ 