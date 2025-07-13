import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // Explicitly set root to current directory to avoid parent configs
  root: __dirname,
  
  // Disable config file discovery
  configFile: false,
  
  test: {
    // Test environment
    environment: 'node',
    
    // Test directories
    include: [
      'tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      'test-results'
    ],

    // Global test configuration
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,

    // Setup files
    setupFiles: ['./tests/setup.ts'],
    globalSetup: './tests/global-setup.ts',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Test reporters for CI/CD
    reporters: process.env.CI 
      ? ['default', 'junit', 'html'] 
      : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml',
      html: './test-results/index.html'
    },

    // Test isolation - critical for database tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },

    // Retry configuration for CI
    retry: process.env.CI ? 2 : 0,

    // Test sequence - important for database tests
    sequence: {
      shuffle: false,
      concurrent: false
    },

    // Watch mode configuration
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/test-results/**']
  },

  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  },

  // Environment variables for testing
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});