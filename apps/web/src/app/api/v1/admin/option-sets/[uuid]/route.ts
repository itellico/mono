import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid option set ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : null;

    logger.info('[API:option-sets] Fetching option set by ID', { id, tenantId });

    const optionSet = await OptionSetsService.getOptionSetById(id, tenantId);

    if (!optionSet) {
      return NextResponse.json({
        success: false,
        error: 'Option set not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: optionSet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets] Error fetching option set by ID', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch option set',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid option set ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const body = await request.json();
    const { slug, label, tenantId } = body;

    logger.info('[API:option-sets] Updating option set', { id, slug, label, tenantId });

    const optionSet = await OptionSetsService.updateOptionSet(id, {
      slug,
      label
    }, tenantId);

    return NextResponse.json({
      success: true,
      data: optionSet,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets] Error updating option set', { error });

    const errorMessage = error instanceof Error ? error.message : 'Failed to update option set';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid option set ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : null;

    logger.info('[API:option-sets] Deleting option set', { id, tenantId });

    await OptionSetsService.deleteOptionSet(id, tenantId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets] Error deleting option set', { error });

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete option set';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 