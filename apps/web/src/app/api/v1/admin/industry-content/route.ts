import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import IndustryContentService from '@/lib/services/industry-content.service';

/**
 * GET /api/v1/admin/industry-content
 * 
 * Get available industries or industry-specific content
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/industry-content', 'GET');
    
    if (!hasAccess.allowed) {
      logger.warn('Industry content access denied', {
        userId: session.user.id,
        reason: hasAccess.reason
      });
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const industry = url.searchParams.get('industry');
    const tenantId = parseInt(url.searchParams.get('tenantId') || '0');

    // Get available industries
    if (action === 'industries' || !action) {
      const industries = IndustryContentService.getAvailableIndustries();
      
      return NextResponse.json({
        success: true,
        data: {
          industries,
          count: industries.length
        }
      });
    }

    // Get industry configuration
    if (action === 'config' && industry) {
      const config = IndustryContentService.getIndustryConfig(industry);
      
      if (!config) {
        return NextResponse.json(
          { error: `Industry '${industry}' not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          industry,
          config
        }
      });
    }

    // Get industry-relevant tags
    if (action === 'tags' && industry && tenantId) {
      const includeGlobal = url.searchParams.get('includeGlobal') !== 'false';
      const tagType = url.searchParams.get('type') || undefined;
      
      const tags = await IndustryContentService.getIndustryRelevantTags(
        tenantId,
        industry,
        {
          includeGlobalTags: includeGlobal,
          tagType
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          industry,
          tenantId,
          tags,
          count: tags.length
        }
      });
    }

    // Get industry-relevant categories
    if (action === 'categories' && industry && tenantId) {
      const includeGlobal = url.searchParams.get('includeGlobal') !== 'false';
      const includeSubcategories = url.searchParams.get('includeSubcategories') !== 'false';
      
      const categories = await IndustryContentService.getIndustryRelevantCategories(
        tenantId,
        industry,
        {
          includeGlobalCategories: includeGlobal,
          includeSubcategories
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          industry,
          tenantId,
          categories,
          count: categories.length
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Failed to get industry content', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/industry-content
 * 
 * Setup or seed industry-specific content
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/industry-content', 'POST');
    
    if (!hasAccess.allowed) {
      logger.warn('Industry content setup access denied', {
        userId: session.user.id,
        reason: hasAccess.reason
      });
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, tenantId, industry, options = {} } = body;

    if (!action || !tenantId || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields: action, tenantId, industry' },
        { status: 400 }
      );
    }

    logger.info('Industry content setup requested', {
      action,
      tenantId,
      industry,
      userId: session.user.id,
      options
    });

    // Setup complete industry content (categories + tags)
    if (action === 'setup') {
      const results = await IndustryContentService.setupIndustryContent(
        tenantId,
        industry,
        options
      );

      logger.info('Industry content setup completed', {
        tenantId,
        industry,
        results,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          industry,
          results
        }
      });
    }

    // Seed only categories
    if (action === 'seed-categories') {
      const results = await IndustryContentService.seedIndustryCategories(
        tenantId,
        industry,
        options
      );

      logger.info('Industry categories seeded', {
        tenantId,
        industry,
        results,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          industry,
          type: 'categories',
          results
        }
      });
    }

    // Seed only tags
    if (action === 'seed-tags') {
      const results = await IndustryContentService.seedIndustryTags(
        tenantId,
        industry,
        options
      );

      logger.info('Industry tags seeded', {
        tenantId,
        industry,
        results,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          industry,
          type: 'tags',
          results
        }
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Failed to setup industry content', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}