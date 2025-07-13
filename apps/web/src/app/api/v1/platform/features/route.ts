import { NextRequest, NextResponse } from 'next/server';

const mockFeatures = [
  {
    id: 'basic-auth',
    name: 'Basic Authentication',
    description: 'Email and password authentication',
    category: 'core',
    tier: 'platform',
    limits: {
      max_login_attempts: 5,
      session_timeout_minutes: 60,
    },
  },
  {
    id: 'basic-storage',
    name: 'Basic Storage',
    description: 'File storage with size limits',
    category: 'core',
    tier: 'tenant',
    limits: {
      max_storage_gb: 10,
      max_file_size_mb: 100,
    },
  },
  {
    id: 'basic-api',
    name: 'API Access',
    description: 'REST API access with rate limiting',
    category: 'core',
    tier: 'tenant',
    limits: {
      requests_per_minute: 60,
      concurrent_connections: 10,
    },
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed analytics and reporting',
    category: 'advanced',
    tier: 'tenant',
    limits: {
      data_retention_days: 90,
      custom_reports: 10,
    },
  },
  {
    id: 'ai-features',
    name: 'AI Features',
    description: 'AI-powered content generation and analysis',
    category: 'advanced',
    tier: 'account',
    limits: {
      ai_requests_per_month: 1000,
      model_selection: false,
    },
  },
  {
    id: 'sso-integration',
    name: 'SSO Integration',
    description: 'Single Sign-On with SAML/OAuth',
    category: 'security',
    tier: 'tenant',
    limits: {
      identity_providers: 5,
      custom_domains: true,
    },
  },
  {
    id: '2fa-auth',
    name: 'Two-Factor Authentication',
    description: 'Enhanced security with 2FA',
    category: 'security',
    tier: 'account',
    limits: {
      methods_available: 3,
      backup_codes: 10,
    },
  },
  {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Real-time collaboration features',
    category: 'collaboration',
    tier: 'account',
    limits: {
      team_members: 50,
      shared_workspaces: 10,
    },
  },
  {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    description: 'Automated workflows and integrations',
    category: 'advanced',
    tier: 'tenant',
    limits: {
      active_workflows: 20,
      workflow_runs_per_month: 1000,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: mockFeatures,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch features',
      },
      { status: 500 }
    );
  }
}