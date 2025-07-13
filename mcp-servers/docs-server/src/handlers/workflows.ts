/**
 * Development workflow handler
 */

import { BaseHandler } from './base.js';

interface WorkflowArgs {
  task: string;
  context?: string;
}

export class WorkflowHandler extends BaseHandler {
  private workflows: Map<string, any> = new Map();

  constructor() {
    super();
    this.loadWorkflows();
  }

  /**
   * Load development workflows
   */
  private loadWorkflows(): void {
    this.workflows.set('new-feature', {
      title: 'New Feature Implementation Workflow',
      description: 'Step-by-step process for implementing new features',
      steps: [
        {
          step: 1,
          title: 'Research & Planning',
          description: 'Read relevant documentation and understand requirements',
          actions: [
            'Search documentation using MCP search_documentation tool',
            'Review architecture patterns with get_architecture_info',
            'Check project status with get_project_status',
            'Understand the full context and implications',
          ],
        },
        {
          step: 2,
          title: 'Confirm Understanding',
          description: 'Present findings and get user approval',
          actions: [
            'Explain what you discovered in the docs',
            'Outline your understanding of requirements',
            'Ask: "Did I understand this correctly?"',
            'WAIT FOR USER CONFIRMATION before proceeding',
          ],
        },
        {
          step: 3,
          title: 'Implementation',
          description: 'Implement following established patterns',
          actions: [
            'Follow 4-tier API architecture for routes',
            'Use proper code patterns from get_code_patterns',
            'Follow naming conventions and standards',
            'Implement with proper error handling',
          ],
        },
        {
          step: 4,
          title: 'Testing & Validation',
          description: 'Test implementation thoroughly',
          actions: [
            'Run existing tests to ensure nothing breaks',
            'Test new functionality manually',
            'Run lint and typecheck commands',
            'Verify all requirements are met',
          ],
        },
        {
          step: 5,
          title: 'Documentation & Commit',
          description: 'Document and commit tested changes',
          actions: [
            'Update relevant documentation if needed',
            'Create descriptive commit message',
            'Push to remote repository for backup',
            'Propose documentation updates via API if applicable',
          ],
        },
      ],
      notes: [
        'NEVER implement without research and confirmation',
        'Follow established patterns and conventions',
        'Test thoroughly before committing',
        'Document your changes appropriately',
      ],
    });

    this.workflows.set('api-route', {
      title: 'API Route Implementation',
      description: 'Creating new API routes following 4-tier architecture',
      steps: [
        {
          step: 1,
          title: 'Determine Route Tier',
          description: 'Choose appropriate tier based on functionality',
          actions: [
            'public: No authentication (health, login)',
            'user: Individual user operations (profile, settings)',
            'account: Account management (team, billing)',
            'tenant: Tenant administration (permissions, users)',
            'platform: System-wide (all tenants, operations)',
          ],
        },
        {
          step: 2,
          title: 'Create Route File',
          description: 'Create route file in correct location',
          actions: [
            'File: /apps/api/src/routes/v1/{tier}/{resource}/index.ts',
            'Use FastifyPluginAsync pattern',
            'Import required types and schemas',
            'Set up proper error handling',
          ],
        },
        {
          step: 3,
          title: 'Implement Route Handler',
          description: 'Follow standard route pattern',
          actions: [
            'Add authentication preHandler if needed',
            'Add permission check: fastify.requirePermission("{tier}.{resource}.{action}")',
            'Use proper schema with tags: ["{tier}.{resource}"]',
            'Return standard response format: { success: boolean, data: any }',
          ],
        },
        {
          step: 4,
          title: 'Register Route',
          description: 'Register route in main application',
          actions: [
            'Import route in apps/api/src/app.ts',
            'Register with proper prefix: /api/v1/{tier}/{resource}',
            'Test route accessibility',
            'Check Swagger documentation',
          ],
        },
      ],
    });

    this.workflows.set('component', {
      title: 'React Component Creation',
      description: 'Creating new React components following best practices',
      steps: [
        {
          step: 1,
          title: 'Choose Component Type',
          description: 'Determine component category and location',
          actions: [
            'UI components: src/components/ui/',
            'Admin components: src/components/admin/',
            'Reusable business: src/components/reusable/',
            'Page-specific: src/components/{page}/',
          ],
        },
        {
          step: 2,
          title: 'Follow Performance Patterns',
          description: 'Implement with proper optimization',
          actions: [
            'Use TypeScript for all props',
            'Add proper dependency arrays to useEffect',
            'Use React.memo for expensive components',
            'Use useMemo/useCallback appropriately',
            'Split contexts by update frequency',
          ],
        },
        {
          step: 3,
          title: 'Implement Component',
          description: 'Create component following conventions',
          actions: [
            'Export as named export (not default)',
            'Use Tailwind for styling',
            'Add proper TypeScript interfaces',
            'Handle loading and error states',
            'Add accessibility attributes',
          ],
        },
      ],
    });

    this.workflows.set('bug-fix', {
      title: 'Bug Fix Workflow',
      description: 'Systematic approach to fixing bugs',
      steps: [
        {
          step: 1,
          title: 'Reproduce Bug',
          description: 'Understand and reproduce the issue',
          actions: [
            'Gather detailed reproduction steps',
            'Identify affected components/routes',
            'Check console logs for errors',
            'Determine root cause',
          ],
        },
        {
          step: 2,
          title: 'Research Solution',
          description: 'Find appropriate fix approach',
          actions: [
            'Search documentation for related patterns',
            'Check existing similar implementations',
            'Understand architecture constraints',
            'Plan minimal impact solution',
          ],
        },
        {
          step: 3,
          title: 'Implement Fix',
          description: 'Apply fix following best practices',
          actions: [
            'Make minimal necessary changes',
            'Follow existing code patterns',
            'Add error handling if missing',
            'Test fix thoroughly',
          ],
        },
        {
          step: 4,
          title: 'Validate Fix',
          description: 'Ensure fix works and doesn\'t break anything',
          actions: [
            'Test original reproduction steps',
            'Run full test suite',
            'Check for regression issues',
            'Verify performance impact',
          ],
        },
      ],
    });

    this.workflows.set('testing', {
      title: 'Testing Workflow',
      description: 'Comprehensive testing approach',
      steps: [
        {
          step: 1,
          title: 'Determine Test Strategy',
          description: 'Choose appropriate testing approach',
          actions: [
            'Unit tests: Individual functions/components',
            'Integration tests: API endpoints',
            'E2E tests: User workflows',
            'Performance tests: Load and stress',
          ],
        },
        {
          step: 2,
          title: 'Run Existing Tests',
          description: 'Ensure current tests pass',
          actions: [
            'Check README or search codebase for test commands',
            'Run: pnpm test (or equivalent)',
            'Fix any failing tests first',
            'Understand test patterns used',
          ],
        },
        {
          step: 3,
          title: 'Add New Tests',
          description: 'Create tests for new functionality',
          actions: [
            'Follow existing test patterns',
            'Test happy path and edge cases',
            'Mock external dependencies',
            'Ensure good test coverage',
          ],
        },
      ],
    });
  }

  /**
   * Get development workflow
   */
  async getWorkflow(args: WorkflowArgs) {
    const { task, context } = args;

    try {
      const workflow = this.workflows.get(task.toLowerCase());
      
      if (!workflow) {
        const availableTasks = Array.from(this.workflows.keys()).join(', ');
        return this.formatResponse(`Workflow "${task}" not found. Available workflows: ${availableTasks}`);
      }

      let response = this.formatWorkflow(workflow, context);
      
      return this.formatResponse(response);

    } catch (error) {
      return this.formatResponse(`Error retrieving workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format workflow for display
   */
  private formatWorkflow(workflow: any, context?: string): string {
    let response = `# ${workflow.title}\n\n`;
    
    if (workflow.description) {
      response += `${workflow.description}\n\n`;
    }

    if (context) {
      response += `**Context:** ${context}\n\n`;
    }

    if (workflow.steps) {
      response += `## Steps\n\n`;
      
      for (const step of workflow.steps) {
        response += `### ${step.step}. ${step.title}\n\n`;
        
        if (step.description) {
          response += `${step.description}\n\n`;
        }

        if (step.actions && step.actions.length > 0) {
          response += `**Actions:**\n`;
          for (const action of step.actions) {
            response += `- ${action}\n`;
          }
          response += `\n`;
        }
      }
    }

    if (workflow.notes && workflow.notes.length > 0) {
      response += `## Important Notes\n\n`;
      for (const note of workflow.notes) {
        response += `⚠️ ${note}\n\n`;
      }
    }

    return response;
  }

  /**
   * List all available workflows
   */
  async listWorkflows() {
    const workflows = Array.from(this.workflows.entries());
    
    let response = `# Available Development Workflows\n\n`;
    
    for (const [key, workflow] of workflows) {
      response += `## ${key}\n`;
      response += `**${workflow.title}**\n`;
      response += `${workflow.description}\n\n`;
    }

    return this.formatResponse(response);
  }
}