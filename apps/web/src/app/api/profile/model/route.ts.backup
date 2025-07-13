/**
 * @openapi
 * /api/profile/model:
 *   get:
 *     tags:
 *       - Profile
 *       - Model
 *     summary: Get Model Profile
     tags:
       - User Management
 *     description: Retrieve detailed model profile with portfolio statistics and availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Target user ID (optional, defaults to authenticated user)
 *     responses:
 *       '200':
 *         description: Model profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     dateOfBirth:
 *                       type: string
 *                     gender:
 *                       type: string
 *                       enum: [male, female, non_binary, other, prefer_not_to_say]
 *                     height:
 *                       type: number
 *                     weight:
 *                       type: number
 *                     eyeColor:
 *                       type: string
 *                     hairColor:
 *                       type: string
 *                     experienceLevel:
 *                       type: string
 *                     isAvailable:
 *                       type: boolean
 *                     hourlyRate:
 *                       type: number
 *                     dayRate:
 *                       type: number
 *                 portfolioStats:
 *                   type: object
 *                   properties:
 *                     totalImages:
 *                       type: integer
 *                     totalVideos:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Access denied - cross-tenant access not allowed
 *       '404':
 *         description: User or profile not found
 *       '500':
 *         description: Internal server error
 *   patch:
 *     tags:
 *       - Profile
 *       - Model
 *     summary: Update Model Profile
 *     description: Update model profile information including measurements, rates, and availability
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                   gender:
 *                     type: string
 *                     enum: [male, female, non_binary, other, prefer_not_to_say]
 *                   height:
 *                     type: number
 *                   weight:
 *                     type: number
 *                   eyeColor:
 *                     type: string
 *                   hairColor:
 *                     type: string
 *                   bust:
 *                     type: number
 *                   waist:
 *                     type: number
 *                   hips:
 *                     type: number
 *                   shoeSize:
 *                     type: string
 *                   dressSize:
 *                     type: string
 *                   experienceLevel:
 *                     type: string
 *                   portfolioDescription:
 *                     type: string
 *                   specializations:
 *                     type: array
 *                     items:
 *                       type: string
 *                   isAvailable:
 *                     type: boolean
 *                   hourlyRate:
 *                     type: number
 *                   dayRate:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   tiktok:
 *                     type: string
 *                   twitter:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '400':
 *         description: Invalid request data
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  users, 
  mediaAssets,
  accounts,
  modelSchemas
} from '@/lib/schema';
import { eq, and, count, sum, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Validation schemas
const profileUpdateSchema = z.object({
  updates: z.object({
    // Basic info (will be updated in users table)
    firstName: z.string().optional(),
    lastName: z.string().optional(),

    // Model profile specific fields
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'non_binary', 'other', 'prefer_not_to_say']).optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
    eyeColor: z.string().optional(),
    hairColor: z.string().optional(),

    // Measurements
    bust: z.number().optional(),
    waist: z.number().optional(),
    hips: z.number().optional(),
    shoeSize: z.string().optional(),
    dressSize: z.string().optional(),

    // Experience and portfolio
    experienceLevel: z.string().optional(),
    portfolioDescription: z.string().optional(),
    specializations: z.array(z.string()).optional(),

    // Availability
    isAvailable: z.boolean().optional(),
    travelWillingness: z.object({}).optional(),
    availabilityNotes: z.string().optional(),

    // Rates
    hourlyRate: z.number().optional(),
    dayRate: z.number().optional(),
    currency: z.string().optional(),

    // Social media
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional()
  })
});

// GET /api/profile/model - Fetch model profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // Determine which user profile to fetch
    const userIdStr = targetUserId || session?.user?.id;

    if (!userIdStr) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const userId = parseInt(userIdStr);

    // Get tenant context if user is authenticated
    let tenantId = null;
    if (session?.user?.id) {
      const currentUser = await db
        .select({
          id: users.id,
          accountId: users.accountId
        })
        .from(users)
        .where(eq(users.id, parseInt(session.user.id)))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 404 }
        );
      }

      const userAccount = await db
        .select({
          tenantId: accounts.tenantId
        })
        .from(accounts)
        .where(eq(accounts.id, currentUser[0].accountId))
        .limit(1);

      if (userAccount.length > 0) {
        tenantId = userAccount[0].tenantId;
      }
    }

    // Get user
    const user = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        accountId: users.accountId
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If accessing another user's profile, verify same tenant
    if (targetUserId && session?.user?.id !== targetUserId && tenantId) {
      const targetUserAccount = await db
        .select({
          tenantId: accounts.tenantId
        })
        .from(accounts)
        .where(eq(accounts.id, user[0].accountId))
        .limit(1);

      if (targetUserAccount.length === 0 || targetUserAccount[0].tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get model profile
    const profile = await db
      .select()
      .from(modelProfiles)
      .where(eq(modelProfiles.userId, userId))
      .limit(1);

    // Get account for email verification status
    const account = await db
      .select({
        emailVerified: accounts.emailVerified
      })
      .from(accounts)
      .where(eq(accounts.id, user[0].accountId))
      .limit(1);

    // Get portfolio statistics
    const portfolioStats = await db
      .select({
        totalImages: count(),
      })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.userId, userId),
          eq(mediaAssets.mediaType, 'photo')
        )
      );

    const videoStats = await db
      .select({
        totalVideos: count()
      })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.userId, userId),
          eq(mediaAssets.mediaType, 'video')
        )
      );

    const allMediaStats = await db
      .select({
        totalCount: count()
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.userId, userId));

    // Get media type breakdown
    const mediaTypeStats = await db
      .select({
        mediaType: mediaAssets.mediaType,
        count: count()
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.userId, userId))
      .groupBy(mediaAssets.mediaType);

    // Calculate completion percentages
    const profileData = profile[0];
    const basicInfoComplete = !!(
      user[0]?.firstName && 
      user[0]?.lastName && 
      profileData?.portfolioDescription && 
      profileData?.experienceLevel && 
      profileData?.height
    );

    const portfolioComplete = (portfolioStats[0]?.totalImages || 0) >= 5;

    const availabilityComplete = !!(
      (profileData?.hourlyRate || profileData?.dayRate) && 
      profileData?.isAvailable !== null
    );

    const verificationComplete = !!(
      account[0]?.emailVerified
    );

    // Calculate overall completion percentage
    const completionSteps = [
      { weight: 25, complete: basicInfoComplete },
      { weight: 35, complete: portfolioComplete },
      { weight: 20, complete: availabilityComplete },
      { weight: 20, complete: verificationComplete }
    ];

    const completionPercentage = completionSteps.reduce(
      (acc, step) => acc + (step.complete ? step.weight : 0),
      0
    );

    // Prepare response data
    const responseData = {
      id: profileData?.id || 'new',
      userId: user[0].id,
      completionPercentage,
      basicInfoComplete,
      portfolioComplete,
      availabilityComplete,
      verificationComplete,
      profileData: {
        firstName: user[0].firstName || '',
        lastName: user[0].lastName || '',
        dateOfBirth: profileData?.dateOfBirth || '',
        gender: profileData?.gender || '',
        height: profileData?.height || 0,
        weight: profileData?.weight || null,
        eyeColor: profileData?.eyeColor || '',
        hairColor: profileData?.hairColor || '',
        bust: profileData?.bust || null,
        waist: profileData?.waist || null,
        hips: profileData?.hips || null,
        shoeSize: profileData?.shoeSize || '',
        dressSize: profileData?.dressSize || '',
        experienceLevel: profileData?.experienceLevel || '',
        portfolioDescription: profileData?.portfolioDescription || '',
        specializations: profileData?.specializations || [],
        isAvailable: profileData?.isAvailable || false,
        travelWillingness: profileData?.travelWillingness || {},
        availabilityNotes: profileData?.availabilityNotes || '',
        hourlyRate: profileData?.hourlyRate || null,
        dayRate: profileData?.dayRate || null,
        currency: profileData?.currency || 'USD',
        instagram: profileData?.instagram || '',
        tiktok: profileData?.tiktok || '',
        twitter: profileData?.twitter || ''
      },
      portfolioStats: {
        totalImages: portfolioStats[0]?.totalImages || 0,
        totalVideos: videoStats[0]?.totalVideos || 0,
        featuredCount: allMediaStats[0]?.totalCount || 0,
        totalViews: 0,
        totalLikes: 0,
        categories: mediaTypeStats.reduce((acc, cat) => {
          if (cat.mediaType) {
            acc[cat.mediaType] = cat.count;
          }
          return acc;
        }, {} as Record<string, number>)
      },
      availability: {
        isAvailable: profileData?.isAvailable || false,
        travelWillingness: profileData?.travelWillingness || {},
        availabilityNotes: profileData?.availabilityNotes || ''
      },
      verification: {
        emailVerified: !!account[0]?.emailVerified
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    logger.error('Failed to fetch model profile', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/model - Update model profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user and tenant context
    const currentUser = await db
      .select({
        id: users.id,
        accountId: users.accountId
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    const userAccount = await db
      .select({
        tenantId: accounts.tenantId
      })
      .from(accounts)
      .where(eq(accounts.id, currentUser[0].accountId))
      .limit(1);

    if (userAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const tenantId = userAccount[0].tenantId;

    // Parse and validate request body
    const body = await request.json();
    const { updates } = profileUpdateSchema.parse(body);

    // Get existing model profile
    const existingProfile = await db
      .select()
      .from(modelProfiles)
      .where(eq(modelProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create new profile
      const newProfileData = {
        userId: userId,
        dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined,
        gender: updates.gender,
        height: updates.height,
        weight: updates.weight ? updates.weight.toString() : undefined,
        eyeColor: updates.eyeColor,
        hairColor: updates.hairColor,
        bust: updates.bust ? updates.bust.toString() : undefined,
        waist: updates.waist ? updates.waist.toString() : undefined,
        hips: updates.hips ? updates.hips.toString() : undefined,
        shoeSize: updates.shoeSize,
        dressSize: updates.dressSize,
        experienceLevel: updates.experienceLevel,
        portfolioDescription: updates.portfolioDescription,
        specializations: updates.specializations || [],
        isAvailable: updates.isAvailable !== undefined ? updates.isAvailable : true,
        travelWillingness: updates.travelWillingness || {},
        availabilityNotes: updates.availabilityNotes,
        hourlyRate: updates.hourlyRate ? updates.hourlyRate.toString() : undefined,
        dayRate: updates.dayRate ? updates.dayRate.toString() : undefined,
        currency: updates.currency || 'USD',
        instagram: updates.instagram,
        tiktok: updates.tiktok,
        twitter: updates.twitter
      };

      const [newProfile] = await db
        .insert(modelProfiles)
        .values(newProfileData)
        .returning();

      logger.info('Model profile created successfully', {
        userId: userId,
        profileId: newProfile.id,
        tenantId
      });

      return NextResponse.json({
        success: true,
        profile: newProfile
      });
    } else {
      // Update existing profile
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Handle date conversion
      if (updates.dateOfBirth) {
        updateData.dateOfBirth = new Date(updates.dateOfBirth);
      }

      // Handle specializations separately if provided
      if (updates.specializations) {
        updateData.specializations = updates.specializations;
      }

      // Handle travelWillingness separately if provided
      if (updates.travelWillingness) {
        updateData.travelWillingness = updates.travelWillingness;
      }

      await db
        .update(modelProfiles)
        .set(updateData)
        .where(eq(modelProfiles.id, existingProfile[0].id));

      logger.info('Model profile updated successfully', {
        userId: userId,
        profileId: existingProfile[0].id,
        updatedFields: Object.keys(updates)
      });

      // Fetch updated profile data
      const updatedProfile = await db
        .select()
        .from(modelSchemas.modelProfiles)
        .where(eq(modelSchemas.modelProfiles.id, existingProfile[0].id))
        .limit(1);

      return NextResponse.json({
        success: true,
        profile: updatedProfile[0]
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to update model profile', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 