import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/lib/services/email-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['welcome', 'verification', 'password_reset', 'notification', 'marketing', 'workflow', 'custom']),
  language: z.string().min(2).max(10).default('en'),
  subject: z.string().min(1).max(255),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.array(z.object({
    key: z.string(),
    name: z.string(),
    description: z.string().optional(),
    dataType: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
    isRequired: z.boolean(),
    defaultValue: z.any().optional(),
    validationRules: z.record(z.any()).optional(),
    formatters: z.array(z.string()).optional(),
    groupName: z.string().optional(),
    displayOrder: z.number().optional(),
  })).optional(),
  defaultVariables: z.record(z.any()).optional(),
  workflowTriggers: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  testData: z.record(z.any()).optional(),
});

const querySchema = z.object({
  type: z.string().optional(),
  language: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
});

// GET /api/v1/email-templates - List email templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, use hardcoded tenant ID (following existing pattern)
    const tenantId = 1;

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      type: searchParams.get('type'),
      language: searchParams.get('language'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    });

    // Get templates with filtering
    const templates = await emailService.getTemplatesByTenant(
      tenantId,
      query.type as any,
      query.language,
      query.limit,
      query.offset
    );

    // Apply additional filters
    let filteredTemplates = templates;

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.key.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (query.status !== 'all') {
      filteredTemplates = filteredTemplates.filter(template =>
        query.status === 'active' ? template.isActive : !template.isActive
      );
    }

    // Get template statistics
    const stats = {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      inactiveTemplates: templates.filter(t => !t.isActive).length,
      languagesSupported: [...new Set(templates.map(t => t.language))].length,
      typeBreakdown: templates.reduce((acc, template) => {
        acc[template.type] = (acc[template.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    logger.info('Email templates retrieved', {
      tenantId,
      userId: session.user.id,
      totalTemplates: filteredTemplates.length,
      filters: query
    });

    return NextResponse.json({
      templates: filteredTemplates,
      stats,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: filteredTemplates.length,
        hasMore: filteredTemplates.length === query.limit
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve email templates', {
      error: error.message,
      stack: error.stack
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/email-templates - Create new email template
export async function POST(request: NextRequest) {
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, use hardcoded tenant ID (following existing pattern)
    const tenantId = 1;

    const body = await request.json();
    const templateData = createTemplateSchema.parse(body);

    // Check if template key already exists for this tenant and language
    try {
      await emailService.getTemplate(tenantId, templateData.key, templateData.language);
      return NextResponse.json(
        { error: `Template with key '${templateData.key}' already exists for language '${templateData.language}'` },
        { status: 409 }
      );
    } catch (error) {
      // Template doesn't exist, which is what we want
    }

    // Create the template
    const templateId = await emailService.createTemplate({
      tenantId,
      key: templateData.key,
      name: templateData.name,
      description: templateData.description,
      type: templateData.type,
      language: templateData.language,
      subject: templateData.subject,
      htmlContent: templateData.htmlContent,
      textContent: templateData.textContent,
      variables: templateData.variables as any,
      defaultVariables: templateData.defaultVariables,
      workflowTriggers: templateData.workflowTriggers,
      isActive: templateData.isActive,
      isDefault: templateData.isDefault,
      testData: templateData.testData,
    });

    logger.info('Email template created', {
      templateId,
      tenantId,
      userId: session.user.id,
      templateKey: templateData.key,
      templateType: templateData.type,
      language: templateData.language
    });

    return NextResponse.json(
      { 
        templateId, 
        message: 'Email template created successfully',
        template: {
          id: templateId,
          ...templateData,
          tenantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('Failed to create email template', {
      error: error.message,
      stack: error.stack,
      tenantId: 1,
      userId: session?.user?.id
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 