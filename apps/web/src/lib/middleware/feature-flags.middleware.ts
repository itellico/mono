/**
 * Feature Flags & A/B Testing Middleware
 * 
 * DYNAMIC FEATURE CONTROL:
 * - Runtime feature toggles
 * - A/B test variant assignment
 * - User-based feature rollouts
 * - Performance impact monitoring
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  userGroups?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ABTest {
  name: string;
  variants: string[];
  traffic: Record<string, number>; // variant -> percentage
  active: boolean;
}

export class FeatureFlagManager {
  private static flags = new Map<string, FeatureFlag>();
  private static tests = new Map<string, ABTest>();
  private static userVariants = new Map<string, Record<string, string>>();

  static initializeFlags(flags: FeatureFlag[]): void {
    flags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
    console.log(`🚩 Initialized ${flags.length} feature flags`);
  }

  static initializeTests(tests: ABTest[]): void {
    tests.forEach(test => {
      this.tests.set(test.name, test);
    });
    console.log(`🧪 Initialized ${tests.length} A/B tests`);
  }

  static isFeatureEnabled(
    flagName: string, 
    userId?: string, 
    userGroup?: string
  ): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    // Check if flag is globally disabled
    if (!flag.enabled) return false;

    // Check date constraints
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check user group restrictions
    if (flag.userGroups && userGroup && !flag.userGroups.includes(userGroup)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && userId) {
      const hash = this.hashUserId(userId, flagName);
      return hash < flag.rolloutPercentage;
    }

    return flag.rolloutPercentage === 100;
  }

  static getABTestVariant(testName: string, userId: string): string | null {
    const test = this.tests.get(testName);
    if (!test || !test.active) return null;

    // Check if user already has a variant assigned
    const userTests = this.userVariants.get(userId) || {};
    if (userTests[testName]) {
      return userTests[testName];
    }

    // Assign new variant based on traffic distribution
    const hash = this.hashUserId(userId, testName);
    let cumulative = 0;

    for (const [variant, percentage] of Object.entries(test.traffic)) {
      cumulative += percentage;
      if (hash < cumulative) {
        // Store assignment
        userTests[testName] = variant;
        this.userVariants.set(userId, userTests);
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  private static hashUserId(userId: string, context: string): number {
    // Simple hash function for consistent user assignment
    const str = `${userId}:${context}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  static updateFlag(flagName: string, updates: Partial<FeatureFlag>): void {
    const existing = this.flags.get(flagName);
    if (existing) {
      this.flags.set(flagName, { ...existing, ...updates });
      console.log(`🚩 Updated feature flag: ${flagName}`);
    }
  }

  static getActiveFlags(): Record<string, FeatureFlag> {
    const result: Record<string, FeatureFlag> = {};
    for (const [name, flag] of this.flags.entries()) {
      if (flag.enabled) {
        result[name] = flag;
      }
    }
    return result;
  }

  static getActiveTests(): Record<string, ABTest> {
    const result: Record<string, ABTest> = {};
    for (const [name, test] of this.tests.entries()) {
      if (test.active) {
        result[name] = test;
      }
    }
    return result;
  }
}

// Initialize with default flags
FeatureFlagManager.initializeFlags([
  {
    name: 'new_dashboard',
    enabled: true,
    rolloutPercentage: 50, // 50% rollout
  },
  {
    name: 'advanced_analytics',
    enabled: true,
    rolloutPercentage: 100,
    userGroups: ['admin', 'premium']
  },
  {
    name: 'beta_features',
    enabled: true,
    rolloutPercentage: 10,
    userGroups: ['beta_testers']
  }
]);

// Initialize with default A/B tests
FeatureFlagManager.initializeTests([
  {
    name: 'checkout_flow',
    variants: ['original', 'simplified', 'enhanced'],
    traffic: { original: 34, simplified: 33, enhanced: 33 },
    active: true
  }
]); 