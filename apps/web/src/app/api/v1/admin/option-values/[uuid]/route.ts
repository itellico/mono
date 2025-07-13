import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

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
        error: 'Invalid option value ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const body = await request.json();
    const { label, value, order, isDefault, canonicalRegion, regionalMappings, metadata } = body;

    logger.info('[API:option-values] Updating option value', { id, label, value, order, isDefault, canonicalRegion, regionalMappings });

    const optionValue = await OptionSetsService.updateOptionValue(id, {
      label,
      value,
      order,
      isDefault,
      canonicalRegion,
      regionalMappings,
      metadata
    });

    return NextResponse.json({
      success: true,
      data: optionValue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-values] Error updating option value', { error });

    const errorMessage = error instanceof Error ? error.message : 'Failed to update option value';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

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
        error: 'Invalid option value ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logger.info('[API:option-values] Deleting option value', { id });

    await OptionSetsService.deleteOptionValue(id);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-values] Error deleting option value', { error });

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete option value';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 