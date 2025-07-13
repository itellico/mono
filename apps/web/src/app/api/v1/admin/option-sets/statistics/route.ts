import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('[API:option-sets-statistics] Fetching statistics');

    // Get comprehensive statistics
    const statistics = await OptionSetsService.getStatistics();

    return NextResponse.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets-statistics] Error fetching statistics', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 