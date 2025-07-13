import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const optionSetId = parseInt(resolvedParams.id);
    if (isNaN(optionSetId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid option set ID',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const body = await request.json();
    const { label, value, order, isDefault, canonicalRegion, regionalMappings, metadata } = body;

    if (!label || !value) {
      return NextResponse.json({
        success: false,
        error: 'Label and value are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logger.info('[API:option-values] Creating option value', { optionSetId, label, value });

    const optionValue = await OptionSetsService.createOptionValue({
      optionSetId,
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
    }, { status: 201 });

  } catch (error) {
    logger.error('[API:option-values] Error creating option value', { error });

    const errorMessage = error instanceof Error ? error.message : 'Failed to create option value';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 