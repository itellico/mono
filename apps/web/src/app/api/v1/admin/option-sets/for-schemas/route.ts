import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : null;

    logger.info('[API:option-sets-for-schemas] Fetching option sets for model schemas', { tenantId });

    const optionSets = await OptionSetsService.getOptionSetsForModelSchemas(tenantId);

    return NextResponse.json({
      success: true,
      data: optionSets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets-for-schemas] Error fetching option sets for model schemas', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch option sets for model schemas',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 