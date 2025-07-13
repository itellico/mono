import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { z } from 'zod';

const ProposeDocumentationSchema = z.object({
  type: z.enum(['implementation', 'update', 'new']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  proposedBy: z.string().default('claude'),
  changes: z.array(z.object({
    file: z.string(),
    action: z.enum(['update', 'create', 'delete']),
    before: z.string().optional(),
    after: z.string(),
    diff: z.string().optional()
  })),
  metadata: z.object({
    feature: z.string().optional(),
    filesChanged: z.array(z.string()).optional(),
    patternsUsed: z.array(z.string()).optional(),
    testingNotes: z.string().optional(),
    learnings: z.string().optional(),
    gotchas: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ProposeDocumentationSchema.parse(body);

    // Create documentation change request
    const changeRequest = await prisma.documentationChange.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        proposedBy: data.proposedBy,
        status: 'pending',
        changes: data.changes,
        metadata: data.metadata || {},
        createdAt: new Date()
      }
    });

    // Cache the change request in Redis for fast access
    const cacheKey = `platform:documentation:change:${changeRequest.id}`;
    await redis.setex(cacheKey, 3600, JSON.stringify(changeRequest)); // 1 hour TTL

    // Trigger N8N webhook for Mattermost notification
    if (process.env.N8N_DOCS_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_DOCS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'documentation_change',
            changeId: changeRequest.id,
            title: data.title,
            description: data.description,
            proposedBy: data.proposedBy,
            filesCount: data.changes.length,
            reviewUrl: `${process.env.NEXTAUTH_URL}/admin/docs/review/${changeRequest.id}`,
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Failed to trigger N8N webhook:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        changeId: changeRequest.id,
        status: 'pending',
        reviewUrl: `/admin/docs/review/${changeRequest.id}`,
        message: 'Documentation change request created successfully'
      }
    });

  } catch (error) {
    console.error('Documentation proposal error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request format',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create documentation change request'
    }, { status: 500 });
  }
}

// Only allow authenticated admin users to propose documentation changes
export const POST_PROTECTED = withAdminAuth(POST);