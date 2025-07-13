import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const adminRole = (session.user as any).adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    // For now, we'll use a simple approach since we don't have getTranslationById
    // This would need to be implemented in the service
    return NextResponse.json(
      { error: 'Get single translation not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    logger.error('Error fetching translation', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const adminRole = (session.user as any).adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const translation = await translationsService.updateTranslation(id, body);

    if (!translation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: translation
    });
  } catch (error) {
    logger.error('Error updating translation', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const adminRole = (session.user as any).adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    const deleted = await translationsService.deleteTranslation(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting translation', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 