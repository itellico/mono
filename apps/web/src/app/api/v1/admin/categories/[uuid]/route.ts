import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { categoriesService } from '@/lib/services/categories-service';
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
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/categories/${params.uuid}`, 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await categoriesService.getById(params.uuid);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error(`Failed to fetch category ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
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
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/categories/${params.uuid}`, 'PUT');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedCategory = await categoriesService.update(params.uuid, body);

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error) {
    logger.error(`Failed to update category ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/categories/${params.uuid}`, 'DELETE');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await categoriesService.delete(params.uuid);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error(`Failed to delete category ${params.uuid}`, { error });
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}