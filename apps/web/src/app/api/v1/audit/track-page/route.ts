import { NextRequest, NextResponse } from 'next/server';
// Note: This endpoint doesn't require authentication as it's used for anonymous tracking
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for page tracking data
const PageTrackingSchema = z.object({
  tenantId: z.number(),
  userId: z.number(),
  action: z.enum(['page_view', 'page_exit']),
  component: z.string(),
  metadata: z.object({
    pathname: z.string(),
    timeOnPreviousPage: z.number().nullable().optional(),
    timeOnPage: z.number().optional(),
    previousPage: z.string().nullable().optional(),
    timestamp: z.number(),
    userAgent: z.string().optional(),
    referrer: z.string().nullable().optional(),
    screenResolution: z.string().optional(),
    viewportSize: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  })
});

/**
 * POST /api/v1/audit/track-page
 * 
 * High-performance page tracking endpoint that queues tracking data
 * to Redis for background processing to avoid blocking user navigation.
 * 
 * @param request - HTTP request with page tracking data
 * @returns Response indicating success/failure
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate data structure
    const validationResult = PageTrackingSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid page tracking data received', {
        errors: validationResult.error.errors,
        body
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid tracking data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const trackingData = validationResult.data;

    // Get Redis client for queueing
    const redis = await getRedisClient();
    const queueKey = `temp:audit:page_tracking:queue`;

    // Prepare queue entry with timestamp for processing order
    const queueEntry = {
      ...trackingData,
      queuedAt: Date.now(),
      userIp: request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown'
    };

    // Add to Redis queue (non-blocking operation)
    await redis.lpush(queueKey, JSON.stringify(queueEntry));

    // Also set a TTL marker for queue processing
    const processingKey = `temp:audit:page_tracking:last_processed`;
    const lastProcessed = await redis.get(processingKey);
    
    if (!lastProcessed || (Date.now() - parseInt(lastProcessed)) > 10000) {
      // Trigger background processing if not done recently
      await redis.set(processingKey, Date.now().toString(), 'EX', 60);
      
      // Background processing will be handled by a separate worker
      // For now, we just log that processing is needed
      logger.debug('Page tracking queue requires processing', {
        queueKey,
        action: trackingData.action,
        pathname: trackingData.metadata.pathname
      });
    }

    // Return success immediately (fire-and-forget pattern)
    return NextResponse.json({ 
      success: true,
      queued: true,
      message: 'Page tracking data queued successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Page tracking endpoint error', {
      error: errorMessage,
      url: request.url,
      method: request.method
    });

    // Return success even on errors to avoid breaking user experience
    // Errors are logged for monitoring but don't impact navigation
    return NextResponse.json({ 
      success: true,
      error: 'Tracking failed but request completed',
      message: 'Navigation not impacted'
    });
  }
}

/**
 * GET /api/v1/audit/track-page
 * 
 * Health check endpoint for page tracking service
 */
export async function GET() {
  try {
    const redis = await getRedisClient();
    const queueKey = `temp:audit:page_tracking:queue`;
    const queueLength = await redis.llen(queueKey);

    return NextResponse.json({
      status: 'healthy',
      queueLength,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Page tracking health check failed', { error });
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 