import { NextRequest, NextResponse } from 'next/server';
import { OptionSetsService } from '@/lib/services/option-sets.service';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/api-middleware';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { auth } from '@/lib/auth';

async function _GET(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tenantId = userContext.tenantId; // Use tenantId from user context

    logger.info('[API:option-sets] Fetching option sets', { search, categoryId, limit, offset, tenantId });

    const optionSets = await OptionSetsService.getOptionSets({
      search,
      categoryId,
      limit,
      offset,
      tenantId
    });

    return NextResponse.json({
      success: true,
      data: optionSets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:option-sets] Error fetching option sets', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch option sets',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    const body = await request.json();
    const { slug, label } = body;

    if (!slug || !label) {
      return NextResponse.json({
        success: false,
        error: 'Slug and label are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logger.info('[API:option-sets] Creating option set', { slug, label, tenantId: userContext.tenantId });

    const optionSet = await OptionSetsService.createOptionSet({
      slug,
      label,
      tenantId: userContext.tenantId || null // Pass tenantId from context
    });

    return NextResponse.json({
      success: true,
      data: optionSet,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    logger.error('[API:option-sets] Error creating option set', { error: error instanceof Error ? error.message : String(error) });

    const errorMessage = error instanceof Error ? error.message : 'Failed to create option set';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}

export const { GET, POST } = withMiddleware({
  GET: _GET,
  POST: _POST,
}, {
  requireAuth: true,
  permissions: {
    GET: { action: 'option_sets.read.tenant', resource: 'admin' },
    POST: { action: 'option_sets.create.tenant', resource: 'admin' },
  },
  audit: {
    logRequests: true,
    logResponses: true,
  },
}); 