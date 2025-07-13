/**
 * AI Image Analysis API Endpoint
 * POST /api/v1/ai/analyze-image - Analyze portfolio images with AI
 */

/**
 * @openapi
 * /api/v1/ai/analyze-image:
 *   get:
 *     tags:
 *       - AI
 *     summary: AI Image Analysis
     tags:
       - AI Features
 *     description: AI Image Analysis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { contentTaggingService } from '@/lib/ai/content-tagging';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import * as schema from '@/lib/schemas';
import { users } from '@/lib/schemas/users';

import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageId, imageIds, options = {} } = body;

    // Validate tenant access - get tenantId from user's account
    const userId = parseInt(session.user.id);
    const userWithAccount = await prisma.user.findFirst({
      where: { id: userId },
      include: { account: true }
    });

    if (!userWithAccount?.account) {
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404 }
      );
    }

    const userTenantId = (userWithAccount.account as any)?.tenantId;
    if (!userTenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant access required' },
        { status: 403 }
      );
    }

    // Ensure tenantId is a number for database queries
    const tenantIdNumber = parseInt(userTenantId);

    // Handle single image analysis
    if (imageId) {
      return await analyzeSingleImage(imageId, tenantIdNumber, userId, options);
    }

    // Handle batch image analysis
    if (imageIds && Array.isArray(imageIds)) {
      return await analyzeBatchImages(imageIds, tenantIdNumber, userId, options);
    }

    return NextResponse.json(
      { success: false, error: 'imageId or imageIds required' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error in AI image analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeSingleImage(
  imageId: string,
  tenantId: number,
  userId: number,
  options: any
) {
  try {
    // Verify image exists and user has access
    const image = await prisma.mediaAsset.findFirst({
      where: {
        id: parseInt(imageId),
        tenantId: tenantId,
        userId: userId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found or access denied' },
        { status: 404 }
      );
    }

    logger.info(`Starting AI analysis for image ${imageId}`, {
      userId,
      tenantId,
      imageUrl: image.url,
    });

    // Perform AI analysis
    const result = await contentTaggingService.analyzeAndTagImage(
      imageId,
      image.url,
      tenantId.toString(),
      {
        autoApply: options.autoApply || false,
        confidenceThreshold: options.confidenceThreshold || 0.7,
      }
    );

    // Return analysis results
    return NextResponse.json({
      success: true,
      data: {
        imageId,
        analysis: {
          detectedObjects: result.analysis.detectedObjects,
          colorPalette: result.analysis.colorPalette,
          composition: result.analysis.composition,
          lighting: result.analysis.lighting,
          mood: result.analysis.mood,
          quality: result.analysis.quality,
        },
        tagging: {
          suggestedTags: result.suggestedTags,
          appliedTags: result.appliedTags,
          autoApplied: options.autoApply || false,
        },
        optimization: {
          qualityScore: result.analysis.quality.overall,
          suggestions: generateImageOptimizationSuggestions(result.analysis),
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error(`Error analyzing single image ${imageId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

async function analyzeBatchImages(
  imageIds: string[],
  tenantId: number,
  userId: number,
  options: any
) {
  try {
    // Limit batch size
    if (imageIds.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Batch size limited to 20 images' },
        { status: 400 }
      );
    }

    // Verify all images exist and user has access
    const images = await prisma.mediaAsset.findMany({
      where: {
        tenantId: tenantId,
        userId: userId,
      },
    });

    const userImageIds = new Set(images.map(img => img.id));
    const invalidIds = imageIds.filter(id => !userImageIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some images not found or access denied',
          invalidIds,
        },
        { status: 404 }
      );
    }

    logger.info(`Starting batch AI analysis for ${imageIds.length} images`, {
      userId,
      tenantId,
      imageIds,
    });

    // Perform batch analysis
    const results = await contentTaggingService.batchAnalyzeImages(
      imageIds,
      tenantId.toString(),
      {
        autoApply: options.autoApply || false,
        maxConcurrent: options.maxConcurrent || 3,
      }
    );

    // Format results
    const analysisResults = Array.from(results.entries()).map(([imageId, result]) => ({
      imageId,
      analysis: {
        detectedObjects: result.analysis.detectedObjects,
        colorPalette: result.analysis.colorPalette,
        composition: result.analysis.composition,
        lighting: result.analysis.lighting,
        mood: result.analysis.mood,
        quality: result.analysis.quality,
      },
      tagging: {
        suggestedTags: result.analysis.suggestedTags,
        appliedTags: result.appliedTags,
      },
      optimization: {
        qualityScore: result.analysis.quality.overall,
        suggestions: generateImageOptimizationSuggestions(result.analysis),
      },
    }));

    // Calculate batch statistics
    const stats = {
      totalImages: imageIds.length,
      analyzedImages: analysisResults.length,
      averageQuality: analysisResults.reduce((sum, r) => sum + r.optimization.qualityScore, 0) / analysisResults.length,
      totalSuggestedTags: analysisResults.reduce((sum, r) => sum + r.tagging.suggestedTags.length, 0),
      totalAppliedTags: analysisResults.reduce((sum, r) => sum + r.tagging.appliedTags.length, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        results: analysisResults,
        statistics: stats,
        batchOptions: {
          autoApplied: options.autoApply || false,
          maxConcurrent: options.maxConcurrent || 3,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error(`Error in batch image analysis:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze images' },
      { status: 500 }
    );
  }
}

function generateImageOptimizationSuggestions(analysis: any): Array<{
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}> {
  const suggestions = [];

  // Quality-based suggestions
  if (analysis.quality.sharpness < 0.7) {
    suggestions.push({
      type: 'technical',
      priority: 'high' as const,
      title: 'Improve Image Sharpness',
      description: 'This image could benefit from better focus or post-processing to enhance sharpness and clarity.',
    });
  }

  if (analysis.quality.exposure < 0.6) {
    suggestions.push({
      type: 'technical',
      priority: 'medium' as const,
      title: 'Adjust Exposure',
      description: 'Consider adjusting the exposure to improve the overall brightness and contrast of the image.',
    });
  }

  // Composition suggestions
  if (analysis.composition.focusArea === 'center' && analysis.quality.composition < 0.8) {
    suggestions.push({
      type: 'composition',
      priority: 'medium' as const,
      title: 'Try Rule of Thirds',
      description: 'Consider positioning the subject off-center to create a more dynamic and engaging composition.',
    });
  }

  // Lighting suggestions
  if (analysis.lighting.quality === 'hard' && analysis.mood.primary !== 'dramatic') {
    suggestions.push({
      type: 'lighting',
      priority: 'medium' as const,
      title: 'Soften Lighting',
      description: 'Softer lighting could enhance the mood and create more flattering portraits.',
    });
  }

  // Style suggestions
  if (analysis.quality.overall > 0.9) {
    suggestions.push({
      type: 'portfolio',
      priority: 'low' as const,
      title: 'Feature This Image',
      description: 'This high-quality image would work well as a featured portfolio piece or profile photo.',
    });
  }

  return suggestions;
}

// GET endpoint for analysis history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (imageId) {
      // Return analysis history for specific image
      return NextResponse.json({
        success: true,
        data: {
          imageId,
          analyses: [], // Would fetch from analysis history table
        },
      });
    }

    // Return recent analyses for user
    return NextResponse.json({
      success: true,
      data: {
        recentAnalyses: [], // Would fetch user's recent analyses
        summary: {
          totalAnalyzed: 0,
          averageQuality: 0,
          topTags: [],
        },
      },
    });

  } catch (error) {
    logger.error('Error fetching analysis history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 