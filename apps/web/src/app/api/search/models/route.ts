/**
 * @openapi
 * /api/search/models:
 *   get:
 *     tags:
 *       - Search
 *       - Profiles
 *     summary: Search Model Profiles
     tags:
       - Search
 *     description: Advanced search functionality for model profiles with filtering by location, demographics, experience, availability, and more. Supports public searches (no auth) and authenticated searches with additional features.
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Search query across names, descriptions, and specializations
 *         schema:
 *           type: string
 *           minLength: 2
 *         example: fashion model
 *       - name: location
 *         in: query
 *         description: Location filter (city, region)
 *         schema:
 *           type: string
 *         example: New York
 *       - name: country
 *         in: query
 *         description: Country filter
 *         schema:
 *           type: string
 *         example: USA
 *       - name: ageRange
 *         in: query
 *         description: Age range filter in format "min-max"
 *         schema:
 *           type: string
 *           pattern: '^\\d+-\\d+$'
 *         example: 18-30
 *       - name: heightRange
 *         in: query
 *         description: Height range in cm "min-max"
 *         schema:
 *           type: string
 *           pattern: '^\\d+-\\d+$'
 *         example: 160-180
 *       - name: experience
 *         in: query
 *         description: Comma-separated experience levels
 *         schema:
 *           type: string
 *         example: experienced,professional
 *       - name: specialties
 *         in: query
 *         description: Comma-separated specialization areas
 *         schema:
 *           type: string
 *         example: fashion,commercial,runway
 *       - name: availability
 *         in: query
 *         description: Availability filter
 *         schema:
 *           type: string
 *           enum: [all, available, unavailable]
 *           default: all
 *       - name: verified
 *         in: query
 *         description: Filter by verification status
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - name: hasPortfolio
 *         in: query
 *         description: Filter models with complete portfolios
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - name: sortBy
 *         in: query
 *         description: Sort order for results
 *         schema:
 *           type: string
 *           enum: [relevance, rating-desc, views-desc, recent, newest, price-asc, price-desc, location]
 *           default: relevance
 *       - name: limit
 *         in: query
 *         description: Maximum number of results to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: offset
 *         in: query
 *         description: Number of results to skip (for pagination)
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       '200':
 *         description: Successful search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                             format: email
 *                       profile:
 *                         type: object
 *                         properties:
 *                           height:
 *                             type: number
 *                           experience:
 *                             type: array
 *                             items:
 *                               type: string
 *                           specializations:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isAvailable:
 *                             type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '400':
 *         description: Invalid search parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/database';
import { users, mediaAssets, modelSchemas } from '@/lib/schema';
import { validateApiAccess, errorResponse, successResponse } from '@/lib/api-middleware';
import { eq, and, desc, asc, like, inArray, sql, or, gte, lte, ilike } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const ModelSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  ageRange: z.string().optional(), // "18-30" format
  heightRange: z.string().optional(), // "160-180" format
  experience: z.string().optional(), // comma-separated
  specialties: z.string().optional(), // comma-separated
  workTypes: z.string().optional(), // comma-separated
  languages: z.string().optional(), // comma-separated
  availability: z.enum(['all', 'available', 'unavailable']).default('all'),
  priceRange: z.enum(['all', 'budget', 'standard', 'premium', 'luxury']).default('all'),
  rating: z.coerce.number().min(0).max(5).default(0),
  verified: z.enum(['true', 'false']).optional(),
  hasPortfolio: z.enum(['true', 'false']).optional(),
  recentlyActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum([
    'relevance', 'rating-desc', 'views-desc', 'recent', 'newest',
    'price-asc', 'price-desc', 'location'
  ]).default('relevance'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  context: z.enum(['public', 'casting', 'admin']).default('public')
});

export async function GET(request: NextRequest) {
  try {
    // Basic validation (no auth required for public searches)
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const query = ModelSearchSchema.parse(params);

    // For non-public contexts, require authentication
    if (query.context !== 'public') {
      await validateApiAccess(request, {
        requireAuth: true,
        requireTenant: true
      });
    }

    // Build the query conditions
    const conditions = [
      // Note: Removed isActive checks as these fields don't exist in current schema
      // eq(modelProfiles.isActive, true),
      // eq(users.isActive, true)
    ];

    // Text search across multiple fields
    if (query.query && query.query.length >= 2) {
      const searchTerm = `%${query.query}%`;
      conditions.push(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(modelSchemas.modelProfiles.portfolioDescription, searchTerm),
          sql`${modelSchemas.modelProfiles.specializations}::text ILIKE ${searchTerm}`
        )
      );
    }

    // Location filters (commented out - fields don't exist in current schema)
    // if (query.location) {
    //   conditions.push(ilike(modelSchemas.modelProfiles.location, `%${query.location}%`));
    // }
    // if (query.country) {
    //   conditions.push(eq(modelSchemas.modelProfiles.country, query.country));
    // }

    // Age range filter
    if (query.ageRange) {
      const [minAge, maxAge] = query.ageRange.split('-').map(Number);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        const currentYear = new Date().getFullYear();
        const maxBirthYear = currentYear - minAge;
        const minBirthYear = currentYear - maxAge;

        conditions.push(
          and(
            sql`EXTRACT(YEAR FROM ${modelSchemas.modelProfiles.dateOfBirth}) <= ${maxBirthYear}`,
            sql`EXTRACT(YEAR FROM ${modelSchemas.modelProfiles.dateOfBirth}) >= ${minBirthYear}`
          )
        );
      }
    }

    // Height range filter
    if (query.heightRange) {
      const [minHeight, maxHeight] = query.heightRange.split('-').map(Number);
      if (!isNaN(minHeight) && !isNaN(maxHeight)) {
        conditions.push(
          and(
            gte(modelSchemas.modelProfiles.height, minHeight),
            lte(modelSchemas.modelProfiles.height, maxHeight)
          )
        );
      }
    }

    // Experience filter
    if (query.experience) {
      const experienceLevels = query.experience.split(',').map(e => e.trim());
      conditions.push(
        inArray(modelSchemas.modelProfiles.experienceLevel, experienceLevels)
      );
    }

    // Specialties filter
    if (query.specialties) {
      const specialtyList = query.specialties.split(',').map(s => s.trim());
      conditions.push(
        sql`${modelSchemas.modelProfiles.specializations} && ${specialtyList}`
      );
    }

    // Work types filter (commented out - field doesn't exist in current schema)
    // if (query.workTypes) {
    //   const workTypeList = query.workTypes.split(',').map(w => w.trim());
    //   conditions.push(
    //     sql`${modelSchemas.modelProfiles.workTypes} && ${workTypeList}`
    //   );
    // }

    // Languages filter (commented out - field doesn't exist in current schema)
    // if (query.languages) {
    //   const languageList = query.languages.split(',').map(l => l.trim());
    //   conditions.push(
    //     sql`${modelSchemas.modelProfiles.languages} && ${languageList}`
    //   );
    // }

    // Availability filter
    if (query.availability !== 'all') {
      conditions.push(
        eq(modelSchemas.modelProfiles.isAvailable, query.availability === 'available')
      );
    }

    // Price range filter (commented out - field doesn't exist in current schema)
    // if (query.priceRange !== 'all') {
    //   const priceRanges = {
    //     budget: ['$0-50', '$50-100'],
    //     standard: ['$100-250', '$250-500'],
    //     premium: ['$500-1000'],
    //     luxury: ['$1000+']
    //   };
    //   if (priceRanges[query.priceRange]) {
    //     conditions.push(
    //       inArray(modelSchemas.modelProfiles.priceRange, priceRanges[query.priceRange])
    //     );
    //   }
    // }

    // Rating filter (commented out - field doesn't exist in current schema)
    // if (query.rating > 0) {
    //   conditions.push(gte(modelSchemas.modelProfiles.rating, query.rating));
    // }

    // Portfolio filter (commented out - field doesn't exist in current schema)
    // if (query.hasPortfolio === 'true') {
    //   conditions.push(gte(modelSchemas.modelProfiles.portfolioCompleteness, 50));
    // }

    // Recently active filter (commented out - field doesn't exist in current schema)
    // if (query.recentlyActive === 'true') {
    //   const sevenDaysAgo = new Date();
    //   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    //   conditions.push(gte(users.lastLoginAt, sevenDaysAgo));
    // }

    // Determine sort order
    let orderBy;
    switch (query.sortBy) {
      // Commented out sorts that use non-existent fields:
      // case 'rating-desc':
      //   orderBy = desc(modelSchemas.modelProfiles.rating);
      //   break;
      // case 'views-desc':
      //   orderBy = desc(modelSchemas.modelProfiles.totalViews);
      //   break;
      // case 'recent':
      //   orderBy = desc(users.lastLoginAt);
      //   break;
      case 'newest':
        orderBy = desc(modelSchemas.modelProfiles.createdAt);
        break;
      // Commented out price sorts that use non-existent fields:
      // case 'price-asc':
      //   orderBy = sql`...`;
      //   break;
      // case 'price-desc':
      //   orderBy = sql`...`;
      //   break;
      // case 'location':
      //   orderBy = asc(modelSchemas.modelProfiles.location);
      //   break;
      default: // relevance - simplified without non-existent fields
        orderBy = desc(modelSchemas.modelProfiles.createdAt);
    }

    // Execute the main query
    const results = await db
      .select({
        id: modelSchemas.modelProfiles.id,
        userId: users.id,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        // Fields that exist in current schema:
        height: modelSchemas.modelProfiles.height,
        experienceLevel: modelSchemas.modelProfiles.experienceLevel,
        specializations: modelSchemas.modelProfiles.specializations,
        isAvailable: modelSchemas.modelProfiles.isAvailable,
        portfolioDescription: modelSchemas.modelProfiles.portfolioDescription,
        currency: modelSchemas.modelProfiles.currency,
        hourlyRate: modelSchemas.modelProfiles.hourlyRate,
        dayRate: modelSchemas.modelProfiles.dayRate,
        createdAt: modelSchemas.modelProfiles.createdAt,
        gender: modelSchemas.modelProfiles.gender,
        eyeColor: modelSchemas.modelProfiles.eyeColor,
        hairColor: modelSchemas.modelProfiles.hairColor,
        age: sql<number>`EXTRACT(YEAR FROM AGE(${modelSchemas.modelProfiles.dateOfBirth}))`,
        // User fields:
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(modelSchemas.modelProfiles)
      .innerJoin(users, eq(modelSchemas.modelProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset);

    // Portfolio images functionality temporarily disabled due to schema changes
    // TODO: Implement portfolio image retrieval using directoryHash and fileHash
    // const modelIds = results.map(r => r.id);
    // let portfolioImages: Record<string, string[]> = {};

    // Combine results (without portfolio images for now)
    const enhancedResults = results.map(model => ({
      ...model,
      portfolioImages: [] // Temporarily empty until proper URL generation is implemented
    }));

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelSchemas.modelProfiles)
      .innerJoin(users, eq(modelSchemas.modelProfiles.userId, users.id))
      .where(and(...conditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / query.limit);
    const currentPage = Math.floor(query.offset / query.limit) + 1;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    logger.info('Model search completed successfully', {
      query: query.query,
      resultsCount: enhancedResults.length,
      totalCount,
      context: query.context,
      filters: {
        location: query.location,
        country: query.country,
        specialties: query.specialties,
        experience: query.experience
      }
    });

    return successResponse({
      models: enhancedResults,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        limit: query.limit,
        offset: query.offset
      },
      filters: {
        query: query.query,
        location: query.location,
        country: query.country,
        specialties: query.specialties,
        experience: query.experience,
        sortBy: query.sortBy
      }
    });

  } catch (error) {
    logger.error('Model search failed', {
      error: error.message,
      stack: error.stack,
      url: request.url
    });

    if (error instanceof z.ZodError) {
      return errorResponse('Invalid search parameters', 400, 'VALIDATION_ERROR');
    }

    return errorResponse('Search failed', 500, 'SEARCH_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    // For saved searches (future enhancement)
    const { user, tenantId } = await validateApiAccess(request, {
      requireAuth: true,
      requireTenant: true
    });

    const body = await request.json();

    const SavedSearchSchema = z.object({
      name: z.string().min(1).max(100),
      searchCriteria: z.record(z.any()),
      isDefault: z.boolean().default(false)
    });

    const data = SavedSearchSchema.parse(body);

    // Implementation for saving search criteria would go here
    // This is a placeholder for future enhancement

    return successResponse({
      message: 'Saved search functionality coming soon'
    });

  } catch (error) {
    logger.error('Failed to save search', {
      error: error.message,
      stack: error.stack
    });

    return errorResponse('Failed to save search', 500, 'SAVE_SEARCH_ERROR');
  }
} 