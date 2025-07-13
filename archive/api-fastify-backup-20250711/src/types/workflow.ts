// React Flow node and edge types for workflow definitions
export interface ReactFlowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, any>;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

// Workflow definition structure
export interface WorkflowDefinition {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

// Workflow settings
export interface WorkflowSettings {
  isActive: boolean;
  triggerType: 'manual' | 'event' | 'schedule' | 'webhook';
  triggers?: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  timeout?: number; // seconds
  retryPolicy?: {
    maximumAttempts: number;
    backoffCoefficient: number;
    maximumInterval: string;
  };
}

// Workflow permissions
export interface WorkflowPermissions {
  execute: string[];
  view: string[];
  edit: string[];
}

// Node types supported by the workflow engine
export type WorkflowNodeType = 
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'api-call'
  | 'email'
  | 'notification'
  | 'wait'
  | 'parallel'
  | 'merge'
  | 'form'
  | 'approval'
  | 'webhook';

// Node data interfaces for different node types
export interface StartNodeData {
  label: string;
  description?: string;
}

export interface EndNodeData {
  label: string;
  output?: Record<string, any>;
}

export interface TaskNodeData {
  label: string;
  task: string;
  description?: string;
  config?: Record<string, any>;
}

export interface DecisionNodeData {
  label: string;
  condition: string;
  trueNode: string;
  falseNode: string;
  rules?: Record<string, any>;
}

export interface ApiCallNodeData {
  label: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: Record<string, any>;
  responseMapping?: Record<string, string>;
}

export interface EmailNodeData {
  label: string;
  templateId?: number;
  templateSlug?: string;
  to?: Array<{ email: string; name?: string }>;
  userId?: number;
  subject?: string;
  variables?: Record<string, any>;
}

export interface NotificationNodeData {
  label: string;
  type: string;
  userId?: number;
  title?: string;
  message?: string;
  channels?: Array<'email' | 'push' | 'sms' | 'in_app'>;
  data?: Record<string, any>;
}

export interface WaitNodeData {
  label: string;
  duration: string; // e.g., "5 minutes", "1 hour", "2 days"
  reason?: string;
}

// Workflow execution context
export interface WorkflowExecutionContext {
  tenantId: number;
  executionId: string;
  workflowId: number;
  executedById: number;
  input?: Record<string, any>;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

// Workflow execution status
export type WorkflowExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'terminated';

// Workflow execution result
export interface WorkflowExecutionResult {
  success: boolean;
  output?: Record<string, any>;
  nodeOutputs?: Record<string, any>;
  iterations?: number;
  error?: string;
  executionId: string;
}

// Marketplace workflow templates
export interface MarketplaceWorkflowTemplate {
  name: string;
  slug: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  settings: WorkflowSettings;
  permissions: WorkflowPermissions;
  variables?: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'select';
    required?: boolean;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
  }>;
}

// Pre-built workflow templates for marketplace
export const MARKETPLACE_WORKFLOW_TEMPLATES: MarketplaceWorkflowTemplate[] = [
  {
    name: 'Job Application Review',
    slug: 'job-application-review',
    description: 'Automated review process for job applications',
    category: 'jobs',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Application Received' },
        },
        {
          id: 'screening',
          type: 'task',
          position: { x: 100, y: 200 },
          data: { 
            label: 'Initial Screening',
            task: 'initial_screening',
            description: 'Automated screening of application requirements',
          },
        },
        {
          id: 'decision',
          type: 'decision',
          position: { x: 100, y: 300 },
          data: {
            label: 'Screening Passed?',
            condition: 'screening.passed === true',
            trueNode: 'notify-manager',
            falseNode: 'reject',
          },
        },
        {
          id: 'notify-manager',
          type: 'notification',
          position: { x: 50, y: 400 },
          data: {
            label: 'Notify Hiring Manager',
            type: 'job_application_received',
          },
        },
        {
          id: 'reject',
          type: 'email',
          position: { x: 150, y: 400 },
          data: {
            label: 'Send Rejection Email',
            templateSlug: 'application-rejected',
          },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 100, y: 500 },
          data: { label: 'Process Complete' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'screening' },
        { id: 'e2', source: 'screening', target: 'decision' },
        { id: 'e3', source: 'decision', target: 'notify-manager' },
        { id: 'e4', source: 'decision', target: 'reject' },
        { id: 'e5', source: 'notify-manager', target: 'end' },
        { id: 'e6', source: 'reject', target: 'end' },
      ],
    },
    settings: {
      isActive: true,
      triggerType: 'event',
      triggers: [
        {
          type: 'job_application_created',
          config: { autoStart: true },
        },
      ],
    },
    permissions: {
      execute: ['jobs:manage', 'workflows:execute'],
      view: ['jobs:read', 'workflows:read'],
      edit: ['jobs:manage', 'workflows:update'],
    },
  },
  
  {
    name: 'User Onboarding',
    slug: 'user-onboarding',
    description: 'Welcome new users with a series of helpful emails',
    category: 'users',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'User Registered' },
        },
        {
          id: 'welcome-email',
          type: 'email',
          position: { x: 100, y: 200 },
          data: {
            label: 'Send Welcome Email',
            templateSlug: 'welcome',
          },
        },
        {
          id: 'wait-1-day',
          type: 'wait',
          position: { x: 100, y: 300 },
          data: {
            label: 'Wait 1 Day',
            duration: '1 day',
            reason: 'Allow user to explore platform',
          },
        },
        {
          id: 'onboarding-tips',
          type: 'email',
          position: { x: 100, y: 400 },
          data: {
            label: 'Send Onboarding Tips',
            templateSlug: 'onboarding-tips',
          },
        },
        {
          id: 'wait-7-days',
          type: 'wait',
          position: { x: 100, y: 500 },
          data: {
            label: 'Wait 7 Days',
            duration: '6 days',
            reason: 'Give user time to use platform',
          },
        },
        {
          id: 'feature-intro',
          type: 'email',
          position: { x: 100, y: 600 },
          data: {
            label: 'Feature Introduction',
            templateSlug: 'feature-introduction',
          },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 100, y: 700 },
          data: { label: 'Onboarding Complete' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'welcome-email' },
        { id: 'e2', source: 'welcome-email', target: 'wait-1-day' },
        { id: 'e3', source: 'wait-1-day', target: 'onboarding-tips' },
        { id: 'e4', source: 'onboarding-tips', target: 'wait-7-days' },
        { id: 'e5', source: 'wait-7-days', target: 'feature-intro' },
        { id: 'e6', source: 'feature-intro', target: 'end' },
      ],
    },
    settings: {
      isActive: true,
      triggerType: 'event',
      triggers: [
        {
          type: 'user_created',
          config: { autoStart: true },
        },
      ],
    },
    permissions: {
      execute: ['users:manage', 'workflows:execute'],
      view: ['users:read', 'workflows:read'],
      edit: ['users:manage', 'workflows:update'],
    },
  },

  {
    name: 'Gig Delivery Process',
    slug: 'gig-delivery-process',
    description: 'Manage gig booking confirmation and delivery timeline',
    category: 'gigs',
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Gig Booked' },
        },
        {
          id: 'confirm-booking',
          type: 'task',
          position: { x: 100, y: 200 },
          data: {
            label: 'Confirm Booking',
            task: 'confirm_gig_booking',
          },
        },
        {
          id: 'notify-talent',
          type: 'notification',
          position: { x: 100, y: 300 },
          data: {
            label: 'Notify Talent',
            type: 'gig_booking_received',
          },
        },
        {
          id: 'wait-delivery',
          type: 'wait',
          position: { x: 100, y: 400 },
          data: {
            label: 'Wait for Delivery Deadline',
            duration: '7 days',
            reason: 'Standard delivery timeframe',
          },
        },
        {
          id: 'delivery-reminder',
          type: 'notification',
          position: { x: 100, y: 500 },
          data: {
            label: 'Delivery Reminder',
            type: 'gig_delivery_reminder',
          },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 100, y: 600 },
          data: { label: 'Process Complete' },
        },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'confirm-booking' },
        { id: 'e2', source: 'confirm-booking', target: 'notify-talent' },
        { id: 'e3', source: 'notify-talent', target: 'wait-delivery' },
        { id: 'e4', source: 'wait-delivery', target: 'delivery-reminder' },
        { id: 'e5', source: 'delivery-reminder', target: 'end' },
      ],
    },
    settings: {
      isActive: true,
      triggerType: 'event',
      triggers: [
        {
          type: 'gig_booking_created',
          config: { autoStart: true },
        },
      ],
    },
    permissions: {
      execute: ['gigs:manage', 'workflows:execute'],
      view: ['gigs:read', 'workflows:read'],
      edit: ['gigs:manage', 'workflows:update'],
    },
  },
];