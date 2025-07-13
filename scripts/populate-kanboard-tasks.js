#!/usr/bin/env node

/**
 * Populate Kanboard with all tasks from the Mono project
 * 
 * This script creates tasks for:
 * - All API endpoints (190+)
 * - All frontend components from clickdummy
 * - Database migrations
 * - Testing tasks
 * - Documentation tasks
 * - Infrastructure tasks
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.kanboard' });

const KANBOARD_API_TOKEN = process.env.KANBOARD_API_TOKEN;
const KANBOARD_API_ENDPOINT = process.env.KANBOARD_API_ENDPOINT || 'http://localhost:4041/jsonrpc.php';

// Base URLs for links
const DOCS_BASE = 'http://localhost:3005';
const CLICKDUMMY_BASE = 'http://localhost:4040';
const API_DOCS_BASE = 'http://localhost:3001/docs';

class KanboardTaskPopulator {
  constructor() {
    this.taskCount = 0;
    this.errors = [];
  }

  async callAPI(method, params = {}) {
    try {
      const response = await axios.post(KANBOARD_API_ENDPOINT, {
        jsonrpc: '2.0',
        method: method,
        id: Date.now(),
        params: {
          api_key: KANBOARD_API_TOKEN,
          ...params
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      console.error(`API Error (${method}):`, error.message);
      throw error;
    }
  }

  async createTask({
    title,
    description = '',
    tags = [],
    priority = 1,
    color_id = 'blue',
    column_id = 1
  }) {
    try {
      const taskId = await this.callAPI('createTask', {
        project_id: 1,
        title,
        description,
        tags: tags.join(','),
        priority,
        color_id,
        column_id
      });
      
      this.taskCount++;
      console.log(`✅ Created: ${title} (ID: ${taskId})`);
      return taskId;
    } catch (error) {
      this.errors.push({ title, error: error.message });
      console.error(`❌ Failed: ${title} - ${error.message}`);
      return null;
    }
  }

  /**
   * Create all API endpoint tasks
   */
  async createAPITasks() {
    console.log('\n📡 Creating API Endpoint Tasks...\n');

    const apiEndpoints = [
      // Authentication & Public APIs
      { method: 'POST', path: '/api/v1/auth/login', tier: 'public', resource: 'auth', desc: 'User login with email/password' },
      { method: 'POST', path: '/api/v1/auth/logout', tier: 'public', resource: 'auth', desc: 'Logout and clear session' },
      { method: 'POST', path: '/api/v1/auth/register', tier: 'public', resource: 'auth', desc: 'New user registration' },
      { method: 'POST', path: '/api/v1/auth/forgot-password', tier: 'public', resource: 'auth', desc: 'Password reset request' },
      { method: 'POST', path: '/api/v1/auth/reset-password', tier: 'public', resource: 'auth', desc: 'Reset password with token' },
      { method: 'POST', path: '/api/v1/auth/verify-email', tier: 'public', resource: 'auth', desc: 'Verify email address' },
      { method: 'POST', path: '/api/v1/auth/refresh', tier: 'public', resource: 'auth', desc: 'Refresh JWT token' },
      
      // User Tier APIs
      { method: 'GET', path: '/api/v1/user/profile', tier: 'user', resource: 'profile', desc: 'Get user profile' },
      { method: 'PUT', path: '/api/v1/user/profile', tier: 'user', resource: 'profile', desc: 'Update user profile' },
      { method: 'POST', path: '/api/v1/user/profile/avatar', tier: 'user', resource: 'profile', desc: 'Upload avatar image' },
      { method: 'GET', path: '/api/v1/user/settings', tier: 'user', resource: 'settings', desc: 'Get user settings' },
      { method: 'PUT', path: '/api/v1/user/settings', tier: 'user', resource: 'settings', desc: 'Update user settings' },
      { method: 'POST', path: '/api/v1/user/settings/password', tier: 'user', resource: 'settings', desc: 'Change password' },
      { method: 'POST', path: '/api/v1/user/settings/mfa/enable', tier: 'user', resource: 'settings', desc: 'Enable MFA' },
      { method: 'POST', path: '/api/v1/user/settings/mfa/disable', tier: 'user', resource: 'settings', desc: 'Disable MFA' },
      
      // Portfolio APIs
      { method: 'GET', path: '/api/v1/user/portfolio', tier: 'user', resource: 'portfolio', desc: 'Get user portfolio' },
      { method: 'POST', path: '/api/v1/user/portfolio/items', tier: 'user', resource: 'portfolio', desc: 'Add portfolio item' },
      { method: 'PUT', path: '/api/v1/user/portfolio/items/:id', tier: 'user', resource: 'portfolio', desc: 'Update portfolio item' },
      { method: 'DELETE', path: '/api/v1/user/portfolio/items/:id', tier: 'user', resource: 'portfolio', desc: 'Delete portfolio item' },
      
      // Job/Gig APIs
      { method: 'GET', path: '/api/v1/user/jobs', tier: 'user', resource: 'jobs', desc: 'Browse available jobs' },
      { method: 'GET', path: '/api/v1/user/jobs/:id', tier: 'user', resource: 'jobs', desc: 'Get job details' },
      { method: 'POST', path: '/api/v1/user/jobs/:id/apply', tier: 'user', resource: 'jobs', desc: 'Apply for job' },
      { method: 'GET', path: '/api/v1/user/applications', tier: 'user', resource: 'jobs', desc: 'Get my applications' },
      
      // Messaging APIs
      { method: 'GET', path: '/api/v1/user/messages', tier: 'user', resource: 'messages', desc: 'Get conversations' },
      { method: 'GET', path: '/api/v1/user/messages/:id', tier: 'user', resource: 'messages', desc: 'Get conversation messages' },
      { method: 'POST', path: '/api/v1/user/messages', tier: 'user', resource: 'messages', desc: 'Send new message' },
      { method: 'POST', path: '/api/v1/user/messages/:id/read', tier: 'user', resource: 'messages', desc: 'Mark as read' },
      
      // Wallet/Payment APIs
      { method: 'GET', path: '/api/v1/user/wallet', tier: 'user', resource: 'wallet', desc: 'Get wallet balance' },
      { method: 'GET', path: '/api/v1/user/wallet/transactions', tier: 'user', resource: 'wallet', desc: 'Get transaction history' },
      { method: 'POST', path: '/api/v1/user/wallet/withdraw', tier: 'user', resource: 'wallet', desc: 'Request withdrawal' },
      
      // Account Tier APIs
      { method: 'GET', path: '/api/v1/account/dashboard', tier: 'account', resource: 'dashboard', desc: 'Get account dashboard data' },
      { method: 'GET', path: '/api/v1/account/team', tier: 'account', resource: 'team', desc: 'Get team members' },
      { method: 'POST', path: '/api/v1/account/team/invite', tier: 'account', resource: 'team', desc: 'Invite team member' },
      { method: 'PUT', path: '/api/v1/account/team/:id/role', tier: 'account', resource: 'team', desc: 'Update member role' },
      { method: 'DELETE', path: '/api/v1/account/team/:id', tier: 'account', resource: 'team', desc: 'Remove team member' },
      
      // Tenant Tier APIs
      { method: 'GET', path: '/api/v1/tenant/dashboard', tier: 'tenant', resource: 'dashboard', desc: 'Get tenant dashboard' },
      { method: 'GET', path: '/api/v1/tenant/accounts', tier: 'tenant', resource: 'accounts', desc: 'List all accounts' },
      { method: 'POST', path: '/api/v1/tenant/accounts', tier: 'tenant', resource: 'accounts', desc: 'Create new account' },
      { method: 'GET', path: '/api/v1/tenant/plans', tier: 'tenant', resource: 'plans', desc: 'Get subscription plans' },
      { method: 'POST', path: '/api/v1/tenant/plans', tier: 'tenant', resource: 'plans', desc: 'Create subscription plan' },
      
      // Platform Tier APIs
      { method: 'GET', path: '/api/v1/platform/tenants', tier: 'platform', resource: 'tenants', desc: 'List all tenants' },
      { method: 'POST', path: '/api/v1/platform/tenants', tier: 'platform', resource: 'tenants', desc: 'Create new tenant' },
      { method: 'GET', path: '/api/v1/platform/analytics', tier: 'platform', resource: 'analytics', desc: 'Platform analytics' },
      { method: 'GET', path: '/api/v1/platform/features', tier: 'platform', resource: 'features', desc: 'Feature management' },
      { method: 'POST', path: '/api/v1/platform/features', tier: 'platform', resource: 'features', desc: 'Create new feature' }
    ];

    for (const endpoint of apiEndpoints) {
      const title = `[API] ${endpoint.method} ${endpoint.path}`;
      const tags = ['api', 'backend', `tier:${endpoint.tier}`, endpoint.resource];
      
      const docLink = `${DOCS_BASE}/architecture/api-design#${endpoint.tier}-tier`;
      const apiDocLink = `${API_DOCS_BASE}#/${endpoint.tier}-${endpoint.resource}`;
      
      // Map to clickdummy pages
      let clickdummyLink = null;
      if (endpoint.resource === 'auth') {
        clickdummyLink = `${CLICKDUMMY_BASE}/public/auth/login.php`;
      } else if (endpoint.tier !== 'public') {
        clickdummyLink = `${CLICKDUMMY_BASE}/${endpoint.tier}/${endpoint.resource}.php`;
      }
      
      const description = `${endpoint.desc}

## Implementation Details
- Method: ${endpoint.method}
- Path: ${endpoint.path}
- Tier: ${endpoint.tier}
- Resource: ${endpoint.resource}

## Links
- 📚 Documentation: ${docLink}
- 📖 API Docs: ${apiDocLink}
${clickdummyLink ? `- 🎯 Clickdummy: ${clickdummyLink}` : '- ⚠️ Missing clickdummy mockup'}

## Acceptance Criteria
- [ ] Implement endpoint logic
- [ ] Add request/response validation
- [ ] Write unit tests
- [ ] Update API documentation
- [ ] Test with Postman/Insomnia`;

      await this.createTask({
        title,
        description,
        tags,
        priority: endpoint.tier === 'platform' ? 3 : 2,
        color_id: 'green'
      });
    }
  }

  /**
   * Create frontend component tasks
   */
  async createFrontendTasks() {
    console.log('\n🎨 Creating Frontend Component Tasks...\n');

    const frontendComponents = [
      // Public Pages
      { name: 'Landing Page', tier: 'public', page: 'index.php', desc: 'Public homepage with hero, features, testimonials' },
      { name: 'Login Form', tier: 'public', page: 'auth/login.php', desc: 'User authentication form with social login options' },
      { name: 'Registration Form', tier: 'public', page: 'auth/register.php', desc: 'Multi-step registration with role selection' },
      { name: 'Job Marketplace', tier: 'public', page: 'jobs/listings.php', desc: 'Browse and filter job listings' },
      { name: 'Profile Search', tier: 'public', page: 'profiles/search.php', desc: 'Search and filter public profiles' },
      
      // User Dashboard Components
      { name: 'User Dashboard', tier: 'user', page: 'dashboard.php', desc: 'Personal dashboard with stats and quick actions' },
      { name: 'Profile Editor', tier: 'user', page: 'profile.php', desc: 'Edit profile information and preferences' },
      { name: 'Portfolio Showcase', tier: 'user', page: 'portfolio/showcase.php', desc: 'Manage and display portfolio items' },
      { name: 'Message Inbox', tier: 'user', page: 'messages/inbox.php', desc: 'Conversation list and messaging interface' },
      { name: 'Wallet Dashboard', tier: 'user', page: 'wallet.php', desc: 'Balance, transactions, and withdrawal' },
      { name: 'Job Applications', tier: 'user', page: 'jobs/applications.php', desc: 'Track job application status' },
      { name: 'Settings Panel', tier: 'user', page: 'settings.php', desc: 'Account, privacy, and notification settings' },
      { name: 'Analytics Dashboard', tier: 'user', page: 'analytics/overview.php', desc: 'Personal performance metrics' },
      
      // Account Management Components
      { name: 'Account Dashboard', tier: 'account', page: 'dashboard.php', desc: 'Team overview and management' },
      { name: 'Team Management', tier: 'account', page: 'team/members.php', desc: 'Invite and manage team members' },
      { name: 'Project Manager', tier: 'account', page: 'projects/list.php', desc: 'Create and manage projects' },
      { name: 'Account Analytics', tier: 'account', page: 'analytics/performance.php', desc: 'Team performance metrics' },
      
      // Tenant Admin Components
      { name: 'Tenant Dashboard', tier: 'tenant', page: 'dashboard.php', desc: 'Marketplace overview and stats' },
      { name: 'Account Manager', tier: 'tenant', page: 'accounts/list.php', desc: 'Manage marketplace accounts' },
      { name: 'Plan Builder', tier: 'tenant', page: 'plans/list.php', desc: 'Create subscription plans' },
      { name: 'Content Moderation', tier: 'tenant', page: 'content/moderation.php', desc: 'Review and moderate content' },
      { name: 'Tenant Analytics', tier: 'tenant', page: 'analytics/overview.php', desc: 'Marketplace analytics' },
      
      // Platform Admin Components
      { name: 'Platform Dashboard', tier: 'platform', page: 'dashboard.php', desc: 'System-wide overview' },
      { name: 'Tenant Manager', tier: 'platform', page: 'tenants/list.php', desc: 'Manage all tenants' },
      { name: 'Feature Manager', tier: 'platform', page: 'features/list.php', desc: 'Control platform features' },
      { name: 'System Analytics', tier: 'platform', page: 'analytics/system.php', desc: 'Platform-wide analytics' }
    ];

    for (const component of frontendComponents) {
      const title = `[UI] ${component.name}`;
      const tags = ['frontend', `tier:${component.tier}`, 'component'];
      
      const clickdummyLink = `${CLICKDUMMY_BASE}/${component.tier}/${component.page}`;
      const docLink = `${DOCS_BASE}/${component.tier}/${component.page.replace('.php', '')}`;
      
      const description = `${component.desc}

## Component Details
- Type: React component with TypeScript
- Tier: ${component.tier}
- Clickdummy Page: ${component.page}

## Links
- 🎯 Clickdummy: ${clickdummyLink}
- 📚 Documentation: ${docLink}

## Technical Requirements
- Use existing UI components from packages/ui
- Implement with TanStack Query for data fetching
- Use Zustand for local state if needed
- Follow existing patterns in apps/web/src/components

## Acceptance Criteria
- [ ] Component matches clickdummy design
- [ ] Responsive on all screen sizes
- [ ] Accessibility compliant (WCAG 2.1)
- [ ] Unit tests with React Testing Library
- [ ] Storybook story created`;

      await this.createTask({
        title,
        description,
        tags,
        priority: 2,
        color_id: 'purple'
      });
    }
  }

  /**
   * Create database and migration tasks
   */
  async createDatabaseTasks() {
    console.log('\n🗄️ Creating Database Tasks...\n');

    const databaseTasks = [
      { name: 'User table schema update', desc: 'Add MFA fields to users table' },
      { name: 'Create wallet_transactions table', desc: 'Track all financial transactions' },
      { name: 'Create payment_methods table', desc: 'Store Stripe payment methods' },
      { name: 'Create analytics_events table', desc: 'Store user behavior events' },
      { name: 'Add indexes for performance', desc: 'Optimize slow queries with proper indexes' },
      { name: 'Create audit_logs table', desc: 'Comprehensive audit trail' },
      { name: 'Create notification_preferences table', desc: 'User notification settings' },
      { name: 'Update portfolio_items table', desc: 'Add analytics fields' }
    ];

    for (const task of databaseTasks) {
      const title = `[DB] ${task.name}`;
      const tags = ['database', 'backend', 'migration'];
      
      const description = `${task.desc}

## Migration Details
- Use Prisma migrate
- Follow existing schema patterns
- Include seed data if applicable

## Links
- 📚 Documentation: ${DOCS_BASE}/architecture/data-models
- 📖 Prisma Schema: /apps/api/prisma/schema.prisma

## Acceptance Criteria
- [ ] Create migration file
- [ ] Update Prisma schema
- [ ] Test migration up and down
- [ ] Update seed data if needed
- [ ] Document schema changes`;

      await this.createTask({
        title,
        description,
        tags,
        priority: 2,
        color_id: 'orange'
      });
    }
  }

  /**
   * Create testing tasks
   */
  async createTestingTasks() {
    console.log('\n🧪 Creating Testing Tasks...\n');

    const testingTasks = [
      { name: 'Auth API endpoints unit tests', type: 'unit', component: 'auth' },
      { name: 'User profile component tests', type: 'unit', component: 'profile' },
      { name: 'Payment flow E2E tests', type: 'e2e', component: 'payment' },
      { name: 'Registration flow E2E tests', type: 'e2e', component: 'auth' },
      { name: 'Job application E2E tests', type: 'e2e', component: 'jobs' },
      { name: 'Message system integration tests', type: 'integration', component: 'messaging' },
      { name: 'Analytics API integration tests', type: 'integration', component: 'analytics' },
      { name: 'Performance test suite', type: 'performance', component: 'system' }
    ];

    for (const test of testingTasks) {
      const title = `[TEST] ${test.name}`;
      const tags = ['test', test.type, test.component];
      
      const description = `Implement ${test.type} tests for ${test.component}

## Test Requirements
- Test Type: ${test.type}
- Component: ${test.component}
- Coverage Target: 80%+

## Links
- 📚 Testing Guide: ${DOCS_BASE}/development/testing/methodology
- 📖 Test Examples: ${DOCS_BASE}/development/testing/types-and-coverage

## Tools
${test.type === 'unit' ? '- Vitest\n- React Testing Library' : ''}
${test.type === 'e2e' ? '- Playwright\n- Test data fixtures' : ''}
${test.type === 'integration' ? '- Supertest\n- Test database' : ''}
${test.type === 'performance' ? '- k6\n- Grafana dashboards' : ''}

## Acceptance Criteria
- [ ] All test cases implemented
- [ ] Tests are passing in CI
- [ ] Coverage meets target
- [ ] Documentation updated`;

      await this.createTask({
        title,
        description,
        tags,
        priority: 1,
        color_id: 'yellow'
      });
    }
  }

  /**
   * Create documentation tasks
   */
  async createDocumentationTasks() {
    console.log('\n📚 Creating Documentation Tasks...\n');

    const docTasks = [
      { name: 'API endpoint documentation', path: '/architecture/api-design' },
      { name: 'MFA implementation guide', path: '/architecture/security/mfa' },
      { name: 'Payment system guide', path: '/platform/payment-system' },
      { name: 'Component library docs', path: '/development/components' },
      { name: 'Deployment guide', path: '/development/deployment' },
      { name: 'Testing best practices', path: '/development/testing/best-practices' },
      { name: 'Performance optimization guide', path: '/architecture/performance' },
      { name: 'Security best practices', path: '/architecture/security' }
    ];

    for (const doc of docTasks) {
      const title = `[DOCS] ${doc.name}`;
      const tags = ['docs', 'documentation'];
      
      const description = `Create/update documentation for ${doc.name}

## Documentation Path
- Path: ${doc.path}
- URL: ${DOCS_BASE}${doc.path}

## Content Requirements
- Clear explanations with examples
- Code snippets where applicable
- Diagrams for complex concepts
- Links to related documentation

## Acceptance Criteria
- [ ] Content is accurate and complete
- [ ] Examples are tested and working
- [ ] Reviewed by technical lead
- [ ] Added to documentation index`;

      await this.createTask({
        title,
        description,
        tags,
        priority: 0,
        color_id: 'grey'
      });
    }
  }

  /**
   * Create infrastructure and DevOps tasks
   */
  async createInfraTasks() {
    console.log('\n🔧 Creating Infrastructure Tasks...\n');

    const infraTasks = [
      { name: 'Setup GitHub Actions for testing', desc: 'CI pipeline for automated testing' },
      { name: 'Configure production deployment', desc: 'Setup Kubernetes deployment' },
      { name: 'Implement Redis caching layer', desc: 'Configure Redis for performance' },
      { name: 'Setup monitoring with Grafana', desc: 'Create dashboards for all services' },
      { name: 'Configure CDN for assets', desc: 'CloudFlare setup for static assets' },
      { name: 'Implement backup strategy', desc: 'Automated database backups' },
      { name: 'Setup error tracking with Sentry', desc: 'Error monitoring and alerting' },
      { name: 'Configure rate limiting', desc: 'API rate limiting with Redis' }
    ];

    for (const task of infraTasks) {
      const title = `[INFRA] ${task.name}`;
      const tags = ['infra', 'devops'];
      
      const description = `${task.desc}

## Infrastructure Requirements
- Environment: Production
- Priority: High for system stability

## Links
- 📚 Documentation: ${DOCS_BASE}/development/deployment
- 📖 DevOps Guide: ${DOCS_BASE}/development/tools

## Acceptance Criteria
- [ ] Configuration tested in staging
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Rollback plan documented`;

      await this.createTask({
        title,
        description,
        tags,
        priority: 2,
        color_id: 'brown'
      });
    }
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🚀 Starting Kanboard Task Population...\n');
    console.log(`API Endpoint: ${KANBOARD_API_ENDPOINT}`);
    console.log(`Documentation Base: ${DOCS_BASE}`);
    console.log(`Clickdummy Base: ${CLICKDUMMY_BASE}\n`);

    try {
      // Check connection
      const projects = await this.callAPI('getAllProjects');
      console.log(`✅ Connected to Kanboard. Found ${projects.length} projects.\n`);

      // Create all tasks
      await this.createAPITasks();
      await this.createFrontendTasks();
      await this.createDatabaseTasks();
      await this.createTestingTasks();
      await this.createDocumentationTasks();
      await this.createInfraTasks();

      // Summary
      console.log('\n📊 Task Creation Summary:');
      console.log(`✅ Total tasks created: ${this.taskCount}`);
      console.log(`❌ Errors encountered: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\nFailed tasks:');
        this.errors.forEach(e => console.log(`- ${e.title}: ${e.error}`));
      }

    } catch (error) {
      console.error('Fatal error:', error.message);
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const populator = new KanboardTaskPopulator();
  populator.run().catch(console.error);
}

module.exports = KanboardTaskPopulator;