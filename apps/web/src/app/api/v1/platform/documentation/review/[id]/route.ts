import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get from Redis cache first (platform-level caching)
    const cacheKey = `platform:documentation:change:${params.id}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: JSON.parse(cachedData),
        cached: true
      });
    }

    // Fallback to database if not in cache
    const changeRequest = await prisma.documentationChange.findUnique({
      where: { id: params.id }
    });

    if (!changeRequest) {
      return NextResponse.json({
        success: false,
        error: 'CHANGE_NOT_FOUND',
        message: 'Documentation change request not found'
      }, { status: 404 });
    }

    // Cache the result for future requests
    await redis.setex(cacheKey, 3600, JSON.stringify(changeRequest));

    return NextResponse.json({
      success: true,
      data: changeRequest,
      cached: false
    });

  } catch (error) {
    console.error('Documentation review fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch documentation change request'
    }, { status: 500 });
  }
}

export const GET_PROTECTED = withAdminAuth(GET);