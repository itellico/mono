import { NextResponse, NextRequest } from 'next/server';
import { getBundles, createBundle } from '@/lib/services/bundle.service';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/api-middleware';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { auth } from '@/lib/auth';

async function _GET(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    const bundles = await getBundles();
    logger.info('Bundles fetched successfully', { userId: userContext.userId });
    return NextResponse.json({ success: true, data: bundles });
  } catch (error) {
    logger.error('Error fetching bundles:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, message: 'Failed to fetch bundles' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    const { bundle, featureIds } = await request.json();
    const newBundle = await createBundle(bundle, featureIds);

    logger.info('Bundle created successfully', { bundleId: newBundle.id, userId: userContext.userId });
    return NextResponse.json({ success: true, data: newBundle }, { status: 201 });
  } catch (error) {
    logger.error('Error creating bundle:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, message: 'Failed to create bundle' }, { status: 500 });
  }
}

export const { GET, POST } = withMiddleware({
  GET,
  POST,
}, {
  requireAuth: true,
  permissions: {
    GET: { action: 'bundles.read.global', resource: 'admin' },
    POST: { action: 'bundles.create.global', resource: 'admin' },
  },
  audit: {
    logRequests: true,
    logResponses: true,
  },
});