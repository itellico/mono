import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { DocumentationRenderer } from '@/lib/services/documentation-renderer';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { feedback } = await request.json();
    
    // Get the change request
    const changeRequest = await prisma.documentationChange.findUnique({
      where: { id: params.id }
    });

    if (!changeRequest) {
      return NextResponse.json({
        success: false,
        error: 'CHANGE_NOT_FOUND',
        message: 'Documentation change request not found'
      }, { status: 404 });
    }

    if (changeRequest.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'This change request has already been reviewed'
      }, { status: 400 });
    }

    // Apply the changes to the YAML files
    const changes = changeRequest.changes as any[];
    const appliedFiles: string[] = [];
    
    try {
      for (const change of changes) {
        const filePath = path.join(process.cwd(), change.file);
        
        if (change.action === 'create' || change.action === 'update') {
          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          // Write the new content
          await fs.writeFile(filePath, change.after);
          appliedFiles.push(filePath);
        } else if (change.action === 'delete') {
          // Delete the file if it exists
          try {
            await fs.unlink(filePath);
            appliedFiles.push(filePath);
          } catch (error) {
            // File might not exist, continue
          }
        }
      }

      // Regenerate HTML documentation
      const renderer = new DocumentationRenderer();
      await renderer.renderAllDocumentation();

      // Update the MCP server index (trigger rebuild)
      // This could be enhanced to send a signal to the MCP server to reload
      
      // Update the change request status
      const updatedChangeRequest = await prisma.documentationChange.update({
        where: { id: params.id },
        data: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: 'admin', // Could be extracted from auth context
          feedback: feedback || 'Approved'
        }
      });

      // Invalidate Redis cache for this change request
      const cacheKey = `platform:documentation:change:${params.id}`;
      await redis.del(cacheKey);
      
      // Invalidate platform-level documentation cache
      await redis.del('platform:documentation:index');
      await redis.del('platform:documentation:mcp:*'); // Invalidate MCP server cache

      // Trigger N8N webhook for notification
      if (process.env.N8N_DOCS_WEBHOOK_URL) {
        try {
          await fetch(process.env.N8N_DOCS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'documentation_approved',
              changeId: params.id,
              title: changeRequest.title,
              filesUpdated: appliedFiles.length,
              feedback: feedback || 'Approved',
              timestamp: new Date().toISOString()
            })
          });
        } catch (webhookError) {
          console.error('Failed to trigger N8N webhook:', webhookError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Documentation changes approved and applied successfully',
          filesUpdated: appliedFiles.length,
          appliedFiles: appliedFiles.map(f => path.relative(process.cwd(), f))
        }
      });

    } catch (fileError) {
      console.error('Error applying file changes:', fileError);
      
      // Rollback any changes that were applied
      // This is a simplified rollback - in production you might want more sophisticated versioning
      
      return NextResponse.json({
        success: false,
        error: 'FILE_OPERATION_ERROR',
        message: 'Failed to apply documentation changes'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Documentation approval error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to approve documentation changes'
    }, { status: 500 });
  }
}

export const POST_PROTECTED = withAdminAuth(POST);