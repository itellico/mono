import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { tagsService } from '@/lib/services/tags-service';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/tags/${params.uuid}`, 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tag = await tagsService.getById(params.uuid);
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    logger.error(`Failed to fetch tag ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/tags/${params.uuid}`, 'PUT');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedTag = await tagsService.update(params.uuid, body);

    return NextResponse.json({ success: true, data: updatedTag });
  } catch (error) {
    logger.error(`Failed to update tag ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/tags/${params.uuid}`, 'DELETE');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await tagsService.delete(params.uuid);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error(`Failed to delete tag ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}