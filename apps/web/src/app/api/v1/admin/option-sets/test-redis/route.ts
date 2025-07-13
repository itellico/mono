import { NextRequest, NextResponse } from 'next/server';
import { OptionSetCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tenantId, optionSetId, data } = body;

    logger.info('[API:test-redis] Testing Redis cache operations', { action, tenantId, optionSetId });

    switch (action) {
      case 'set':
        const cacheKey = OptionSetCache.getCacheKey(
          tenantId?.toString() || null, 
          optionSetId?.toString()
        );
        await OptionSetCache.set(cacheKey, data || { test: 'data', timestamp: new Date().toISOString() });

        return NextResponse.json({
          success: true,
          message: 'Data cached successfully',
          cacheKey,
          timestamp: new Date().toISOString()
        });

      case 'get':
        const getCacheKey = OptionSetCache.getCacheKey(
          tenantId?.toString() || null, 
          optionSetId?.toString()
        );
        const cached = await OptionSetCache.get(getCacheKey);

        return NextResponse.json({
          success: true,
          data: cached,
          cacheKey: getCacheKey,
          found: cached !== null,
          timestamp: new Date().toISOString()
        });

      case 'invalidate':
        await OptionSetCache.invalidateOptionSet(
          tenantId?.toString() || null, 
          optionSetId?.toString()
        );

        return NextResponse.json({
          success: true,
          message: 'Cache invalidated successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: set, get, or invalidate',
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('[API:test-redis] Redis test error', { error });

    return NextResponse.json({
      success: false,
      error: 'Redis operation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 