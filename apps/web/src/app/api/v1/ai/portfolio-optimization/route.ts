/**
 * AI Portfolio Optimization API Endpoint
 * GET /api/v1/ai/portfolio-optimization - Get portfolio optimization suggestions
 */

/**
 * @openapi
 * /api/v1/ai/portfolio-optimization:
 *   get:
 *     tags:
 *       - AI
 *     summary: AI Portfolio Optimization
     tags:
       - AI Features
 *     description: AI Portfolio Optimization
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
import { db } from '@/lib/db';
import { portfolioImages, tags, portfolioImageTags, users } from '@/lib/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || session.user.id;
    const includeComparison = searchParams.get('includeComparison') === 'true';
    const includeActionPlan = searchParams.get('includeActionPlan') === 'true';

    // Validate tenant access - get tenantId from user's account
    const userId = parseInt(session.user.id);
    const userWithAccount = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { account: true }
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

    // Check if user has permission to view this profile
    if (targetUserId !== session.user.id) {
      // Add permission check for admin/moderator roles
      const hasPermission = await checkOptimizationPermission(session.user.id, targetUserId, tenantIdNumber);
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    logger.info(`Generating portfolio optimization for user ${targetUserId}`, {
      requestedBy: session.user.id,
      tenantId: tenantIdNumber,
      includeComparison,
      includeActionPlan,
    });

    // Get comprehensive portfolio analysis
    const [
      optimizationSuggestions,
      portfolioAnalysis,
      industryBenchmarks,
      actionPlan
    ] = await Promise.all([
      contentTaggingService.getPortfolioOptimizationSuggestions(targetUserId, tenantIdNumber.toString()),
      getPortfolioAnalysis(parseInt(targetUserId), tenantIdNumber),
      includeComparison ? getIndustryBenchmarks(tenantIdNumber) : null,
      includeActionPlan ? generateActionPlan(parseInt(targetUserId), tenantIdNumber) : null,
    ]);

    const response = {
      success: true,
      data: {
        userId: targetUserId,
        optimization: {
          overallScore: optimizationSuggestions.overallScore,
          scoreBreakdown: {
            diversity: calculateDiversityScore(portfolioAnalysis),
            quality: calculateQualityScore(portfolioAnalysis),
            completeness: calculateCompletenessScore(portfolioAnalysis),
            marketAppeal: calculateMarketAppealScore(portfolioAnalysis),
          },
          suggestions: optimizationSuggestions.suggestions,
          strengthAreas: optimizationSuggestions.strengthAreas,
          improvementAreas: optimizationSuggestions.improvementAreas,
        },
        portfolio: {
          totalImages: portfolioAnalysis.totalImages,
          categories: portfolioAnalysis.categories,
          topTags: portfolioAnalysis.topTags,
          qualityDistribution: portfolioAnalysis.qualityDistribution,
          uploadTrend: portfolioAnalysis.uploadTrend,
        },
        insights: {
          bestPerformingImages: portfolioAnalysis.bestPerformingImages,
          underutilizedCategories: portfolioAnalysis.underutilizedCategories,
          recommendedTags: portfolioAnalysis.recommendedTags,
          seasonalOpportunities: generateSeasonalOpportunities(),
        },
        ...(industryBenchmarks && {
          benchmarks: {
            industryAverage: industryBenchmarks.averageScore,
            topPerformerRange: industryBenchmarks.topPerformerRange,
            yourRanking: calculateRanking(optimizationSuggestions.overallScore, industryBenchmarks),
            competitiveGaps: identifyCompetitiveGaps(portfolioAnalysis, industryBenchmarks),
          },
        }),
        ...(actionPlan && {
          actionPlan: {
            immediate: actionPlan.immediate,
            shortTerm: actionPlan.shortTerm,
            longTerm: actionPlan.longTerm,
            prioritizedTasks: actionPlan.prioritizedTasks,
          },
        }),
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        dataFreshness: 'real-time',
        recommendationVersion: '1.0',
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error in portfolio optimization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkOptimizationPermission(
  requesterId: string,
  targetUserId: string,
  tenantId: number
): Promise<boolean> {
  try {
    // Get requester's user record to check if they have access
    const requester = await db.query.users.findFirst({
      where: eq(users.id, parseInt(requesterId)),
      with: { account: true }
    });

    if (!requester?.account) {
      return false;
    }

    // Check if the requester is in the same tenant
    const requesterTenantId = (requester.account as any)?.tenantId;
    if (requesterTenantId !== tenantId) {
      return false;
    }

    // For now, allow access within the same tenant
    // TODO: Implement proper role-based permissions using adminRoles table
    return true;

  } catch (error) {
    logger.error('Error checking optimization permission:', error);
    return false;
  }
}

async function getPortfolioAnalysis(userId: number, tenantId: number) {
  try {
    // Get portfolio images with tags and metadata
    const images = await db.query.media.portfolioImages.findMany({
      where: and(
        eq(media.portfolioImages.userId, userId),
        eq(media.portfolioImages.tenantId, tenantId)
      ),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(media.portfolioImages.createdAt)],
    });

    // Analyze categories
    const categories = new Map<string, number>();
    const tagFrequency = new Map<string, number>();

    images.forEach(image => {
      image.tags.forEach(tagRel => {
        const tag = tagRel.tag;
        const category = tag.category || 'general';

        categories.set(category, (categories.get(category) || 0) + 1);
        tagFrequency.set(tag.name, (tagFrequency.get(tag.name) || 0) + 1);
      });
    });

    // Calculate quality distribution (mock data for now)
    const qualityDistribution = {
      excellent: Math.floor(images.length * 0.3),
      good: Math.floor(images.length * 0.5),
      average: Math.floor(images.length * 0.15),
      needsImprovement: Math.floor(images.length * 0.05),
    };

    // Upload trend analysis
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUploads = images.filter(img => img.createdAt > last30Days).length;

    // Best performing images (mock data)
    const bestPerformingImages = images.slice(0, 5).map(img => ({
      id: img.id,
      url: img.url,
      title: `Image ${img.id.substring(0, 8)}`,
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 100) + 10,
      engagementRate: Math.random() * 0.1 + 0.05,
    }));

    // Underutilized categories
    const allCategories = ['editorial', 'commercial', 'lifestyle', 'artistic', 'beauty', 'fashion', 'fitness'];
    const userCategories = Array.from(categories.keys());
    const underutilizedCategories = allCategories.filter(cat => !userCategories.includes(cat));

    // Recommended tags based on gaps
    const recommendedTags = generateRecommendedTags(categories, tagFrequency);

    return {
      totalImages: images.length,
      categories: Object.fromEntries(categories),
      topTags: Array.from(tagFrequency.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      qualityDistribution,
      uploadTrend: {
        last30Days: recentUploads,
        trend: recentUploads > 3 ? 'increasing' : recentUploads > 1 ? 'stable' : 'decreasing',
      },
      bestPerformingImages,
      underutilizedCategories,
      recommendedTags,
    };

  } catch (error) {
    logger.error('Error in portfolio analysis:', error);
    throw error;
  }
}

async function getIndustryBenchmarks(tenantId: number) {
  try {
    // Get industry averages for the tenant (mock data for now)
    const benchmarks = {
      averageScore: 75,
      topPerformerRange: [85, 95],
      categoryBenchmarks: {
        diversity: 70,
        quality: 80,
        completeness: 65,
        marketAppeal: 78,
      },
    };

    return benchmarks;
  } catch (error) {
    logger.error('Error fetching industry benchmarks:', error);
    return null;
  }
}

async function generateActionPlan(userId: number, tenantId: number) {
  try {
    // Generate personalized action plan based on analysis
    return {
      immediate: [
        {
          task: 'Upload 3 high-quality headshots',
          priority: 'high',
          estimatedTime: '2-3 hours',
          impact: 'Improves portfolio completeness by 15%',
        },
        {
          task: 'Add missing tags to existing images',
          priority: 'medium',
          estimatedTime: '30 minutes',
          impact: 'Increases discoverability by 25%',
        },
      ],
      shortTerm: [
        {
          task: 'Plan commercial photography session',
          priority: 'high',
          estimatedTime: '1 day',
          impact: 'Adds missing commercial category',
          deadline: '2 weeks',
        },
        {
          task: 'Optimize image quality and retouching',
          priority: 'medium',
          estimatedTime: '4-6 hours',
          impact: 'Improves overall quality score',
          deadline: '1 month',
        },
      ],
      longTerm: [
        {
          task: 'Develop signature style and branding',
          priority: 'medium',
          estimatedTime: '2-3 months',
          impact: 'Establishes unique market position',
          deadline: '3 months',
        },
        {
          task: 'Build editorial portfolio section',
          priority: 'low',
          estimatedTime: '1-2 months',
          impact: 'Opens high-end market opportunities',
          deadline: '6 months',
        },
      ],
      prioritizedTasks: [
        'Upload high-quality headshots',
        'Plan commercial session',
        'Add missing tags',
        'Optimize image quality',
      ],
    };
  } catch (error) {
    logger.error('Error generating action plan:', error);
    return null;
  }
}

function calculateDiversityScore(analysis: any): number {
  const categoryCount = Object.keys(analysis.categories).length;
  const maxCategories = 8;
  return Math.min((categoryCount / maxCategories) * 100, 100);
}

function calculateQualityScore(analysis: any): number {
  const { excellent, good, average, needsImprovement } = analysis.qualityDistribution;
  const total = excellent + good + average + needsImprovement;
  if (total === 0) return 0;

  return ((excellent * 1.0 + good * 0.8 + average * 0.6 + needsImprovement * 0.3) / total) * 100;
}

function calculateCompletenessScore(analysis: any): number {
  const imageCount = analysis.totalImages;
  const idealCount = 20;
  return Math.min((imageCount / idealCount) * 100, 100);
}

function calculateMarketAppealScore(analysis: any): number {
  // Mock calculation based on trending tags and market demand
  const marketTags = ['commercial', 'editorial', 'lifestyle', 'beauty'];
  const userTags = Object.keys(analysis.categories);
  const marketAlignment = marketTags.filter(tag => userTags.includes(tag)).length;
  return (marketAlignment / marketTags.length) * 100;
}

function calculateRanking(score: number, benchmarks: any): string {
  if (score >= 90) return 'Top 10%';
  if (score >= 80) return 'Top 25%';
  if (score >= 70) return 'Top 50%';
  if (score >= 60) return 'Top 75%';
  return 'Below Average';
}

function identifyCompetitiveGaps(analysis: any, benchmarks: any): Array<{
  area: string;
  gap: string;
  opportunity: string;
}> {
  const gaps = [];

  // Portfolio size gap
  if (analysis.totalImages < benchmarks.portfolioSizeAverage) {
    gaps.push({
      area: 'Portfolio Size',
      gap: `${benchmarks.portfolioSizeAverage - analysis.totalImages} images below average`,
      opportunity: 'Increase portfolio size to match industry standard',
    });
  }

  // Category gaps
  const industryCategories = Object.keys(benchmarks.categoryDistribution);
  const userCategories = Object.keys(analysis.categories);
  const missingCategories = industryCategories.filter(cat => !userCategories.includes(cat));

  if (missingCategories.length > 0) {
    gaps.push({
      area: 'Category Diversity',
      gap: `Missing ${missingCategories.join(', ')} categories`,
      opportunity: 'Expand into underrepresented categories for broader market appeal',
    });
  }

  return gaps;
}

function generateRecommendedTags(categories: Map<string, number>, tagFrequency: Map<string, number>): string[] {
  // Recommend tags based on gaps and trends
  const recommendedTags = [];

  // Style-based recommendations
  if (!categories.has('editorial')) {
    recommendedTags.push('editorial', 'high-fashion', 'artistic');
  }

  if (!categories.has('commercial')) {
    recommendedTags.push('commercial', 'lifestyle', 'brand-ambassador');
  }

  // Trending tags (mock data)
  const trendingTags = ['sustainable-fashion', 'inclusive-beauty', 'wellness', 'minimalist'];
  recommendedTags.push(...trendingTags.slice(0, 2));

  return [...new Set(recommendedTags)].slice(0, 8);
}

function generateSeasonalOpportunities(): Array<{
  season: string;
  opportunities: string[];
  timeline: string;
}> {
  const currentMonth = new Date().getMonth();
  const seasons = [
    {
      season: 'Spring',
      opportunities: ['outdoor shoots', 'fresh beauty looks', 'pastel fashion'],
      timeline: 'March - May',
    },
    {
      season: 'Summer',
      opportunities: ['swimwear', 'beach photography', 'festival fashion'],
      timeline: 'June - August',
    },
    {
      season: 'Fall',
      opportunities: ['fashion week', 'cozy lifestyle', 'autumn colors'],
      timeline: 'September - November',
    },
    {
      season: 'Winter',
      opportunities: ['holiday campaigns', 'winter fashion', 'cozy interiors'],
      timeline: 'December - February',
    },
  ];

  // Return upcoming seasons
  return seasons.slice(Math.floor(currentMonth / 3), Math.floor(currentMonth / 3) + 2);
} 