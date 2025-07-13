import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { feedback } = await request.json();
    
    if (!feedback || feedback.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FEEDBACK_REQUIRED',
        message: 'Feedback is required when rejecting documentation changes'
      }, { status: 400 });
    }

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

    // Update the change request status
    await prisma.documentationChange.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin', // Could be extracted from auth context
        feedback: feedback
      }
    });

    // Trigger N8N webhook for notification
    if (process.env.N8N_DOCS_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_DOCS_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'documentation_rejected',
            changeId: params.id,
            title: changeRequest.title,
            feedback: feedback,
            proposedBy: changeRequest.proposedBy,
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
        message: 'Documentation changes rejected with feedback',
        feedback: feedback
      }
    });

  } catch (error) {
    console.error('Documentation rejection error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to reject documentation changes'
    }, { status: 500 });
  }
}

export const POST_PROTECTED = withAdminAuth(POST);