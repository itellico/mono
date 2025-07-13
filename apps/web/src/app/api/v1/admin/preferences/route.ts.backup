/**
 * @openapi
 * /api/v1/admin/preferences:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Admin Preferences v1
 *     description: Get admin user preferences including profile, timezone, language, and notification settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: number
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     profilePictureUrl:
 *                       type: string
 *                     themePreference:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     language:
 *                       type: string
 *                     dateFormat:
 *                       type: string
 *                     timeFormat:
 *                       type: string
 *                     numberFormat:
 *                       type: string
 *                     emailNotifications:
 *                       type: boolean
 *                     smsNotifications:
 *                       type: boolean
 *                 timestamp:
 *                   type: string
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update Admin Preferences v1
 *     description: Update admin user preferences including profile, timezone, language, and notification settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePictureUrl:
 *                 type: string
 *               themePreference:
 *                 type: string
 *                 enum: [light, dark, system]
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *               dateFormat:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *               numberFormat:
 *                 type: string
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Preferences updated successfully
 *       '400':
 *         description: Invalid preferences data
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accounts, users } from '@/lib/schemas';
import { eq } from 'drizzle-orm';
import { createApiLogger } from '@/lib/platform/logging';
import { createApiResponse } from '@/lib/api-utils';

import { 
  getCountryInfo, 
  validateUserPreferences 
} from '@/lib/optimal-locale-manager';

// GET /api/v1/admin/preferences
export async function GET(request: NextRequest) {
  const log = createApiLogger('GET /api/v1/admin/preferences');
  let session = null;

  try {
    session = await auth();

    log.debug('Session check', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      userEmail: (session?.user as any)?.email,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    });

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin permissions using enhanced permission system
    // Get user roles from database since session only contains authentication data
    const sessionUserId = parseInt((session.user as any).id);
    const userWithRoles = await db.query.users.findFirst({
      where: eq(users.id, sessionUserId),
      columns: {
        id: true,
        tenantId: true
      },
      with: {
        roles: {
          with: {
            role: {
              columns: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!userWithRoles) {
      log.warn('User not found in database', { userId: (session.user as any).id });
      return createApiResponse(
        false,
        undefined,
        'User not found',
        undefined,
        404
      );
    }

    // Super admin always has access
    const isSuperAdmin = userWithRoles.roles?.some(ur => ur.role?.name === 'super_admin');
    if (!isSuperAdmin) {
      // Check if user has any admin role
      const adminRoles = ['super_admin', 'tenant_admin', 'content_moderator', 'model_approver', 'support_agent', 'analytics_viewer'];
      const hasAdminRole = userWithRoles.roles?.some(ur => adminRoles.includes(ur.role?.name || ''));
      
      if (!hasAdminRole) {
        log.warn('User without admin permissions accessing admin preferences', { 
          userId: (session.user as any).id,
          email: (session.user as any).email,
          userRoles: userWithRoles.roles?.map(ur => ur.role?.name)
        });
        return createApiResponse(
          false,
          undefined,
          'Admin access required',
          undefined,
          403
        );
      }
    }

    log.info('[API:GET /api/v1/admin/preferences] Admin preferences retrieved', {
      userId: (session.user as any).id,
      isSuperAdmin
    });

    const userId = parseInt((session.user as any).id);
    log.debug('Fetching admin preferences', { userId });

    // Get user with account information
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        accountId: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true
      },
      with: {
        account: {
          columns: {
            email: true,
            phone: true,
            timezone: true,
            countryCode: true,
            languageLocale: true,
            currencyCode: true,
            themePreference: true,
            dateFormat: true,
            timeFormat: true,
            numberFormat: true,
            emailNotifications: true,
            smsNotifications: true
          }
        }
      }
    });

    if (!user || !user.account) {
      return createApiResponse(
        false,
        undefined,
        'User not found',
        undefined,
        404
      );
    }

    // Format the response data
    const preferences = {
      userId: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.account.email || '',
      phone: user.account.phone || '',
      profilePictureUrl: user.profilePhotoUrl || '',
      themePreference: user.account.themePreference || 'light',
      timezone: user.account.timezone || 'UTC',
      language: user.account.languageLocale || 'en-US',
      dateFormat: user.account.dateFormat || 'YYYY-MM-DD',
      timeFormat: user.account.timeFormat || '24h',
      numberFormat: user.account.numberFormat || '1,234.56',
      emailNotifications: user.account.emailNotifications ?? true,
      smsNotifications: user.account.smsNotifications ?? false
    };

    log.info('Admin preferences retrieved', { 
      userId,
      timezone: preferences.timezone,
      language: preferences.language
    });

    return createApiResponse(
      true,
      preferences,
      undefined,
      'Preferences retrieved successfully',
      200
    );

  } catch (error) {
    log.error('Error fetching admin preferences', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id || 'unknown'
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
}

// PUT /api/v1/admin/preferences
export async function PUT(request: NextRequest) {
  const log = createApiLogger('PUT /api/v1/admin/preferences');
  let session = null;

  try {
    session = await auth();

    log.debug('PUT Session check', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin permissions using enhanced permission system
    const userContext = await extractUserContext(request);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/preferences', 'PUT');
    
    if (!hasAccess.allowed) {
      log.warn('User without admin permissions updating admin preferences', { 
        userId: session.user.id,
        email: session.user.email,
        reason: hasAccess.reason
      });
      return createApiResponse(
        false,
        undefined,
        hasAccess.reason || 'Admin access required',
        undefined,
        403
      );
    }

    log.info('[API:PUT /api/v1/admin/preferences] Updating admin preferences', {
      userId: session.user.id,
      hasAccess: hasAccess.allowed
    });

    const body = await request.json();
    log.debug('Processing preferences update', {
      userId: session.user.id,
      timezone: body.timezone,
      language: body.language,
      fieldsPresent: Object.keys(body)
    });

    const { 
      firstName,
      lastName,
      phone,
      profilePictureUrl,
      themePreference,
      timezone,
      language,
      dateFormat,
      timeFormat,
      numberFormat,
      emailNotifications,
      smsNotifications
    } = body;

    // First get the user to find their account_id
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
      columns: {
        accountId: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return createApiResponse(
        false,
        undefined,
        'User not found',
        undefined,
        404
      );
    }

    // Map frontend fields to database fields
    const languageLocale = language || 'en-US';

    // Auto-derive countryCode from language if not provided
    let countryCode = null;
    if (languageLocale && languageLocale.includes('-')) {
      const [, region] = languageLocale.split('-');
      countryCode = region;
    }

    // Auto-detect currency from country if available
    let currencyCode = null;
    if (countryCode) {
      const countryInfo = getCountryInfo(countryCode);
      currencyCode = countryInfo?.currency || null;
    }

    log.info('Updating admin preferences', {
      userId: session.user.id,
      accountId: user.accountId,
      firstName,
      lastName,
      themePreference,
      timezone,
      languageLocale,
      countryCode,
      currencyCode
    });

    // Validate preferences with packages
    const validation = validateUserPreferences({
      timezone,
      countryCode,
      languageLocale
    });

    if (!validation.isValid) {
      return createApiResponse(
        false,
        undefined,
        'Invalid preferences',
        undefined,
        400
      );
    }

    // Update account data
    const accountUpdateData: any = {
      timezone: timezone || null,
      countryCode: countryCode || null,
      languageLocale: languageLocale || null,
      currencyCode: currencyCode || null,
      themePreference: themePreference || 'light',
      dateFormat: dateFormat || 'YYYY-MM-DD',
      timeFormat: timeFormat || '24h',
      numberFormat: numberFormat || '1,234.56',
      emailNotifications: emailNotifications ?? true,
      smsNotifications: smsNotifications ?? false,
      phone: phone || null,
      updatedAt: new Date()
    };

    log.debug('Updating account record', {
      accountId: user.accountId,
      updateFields: Object.keys(accountUpdateData)
    });

    let updatedAccount;
    try {
      updatedAccount = await db
        .update(accounts)
        .set(accountUpdateData)
        .where(eq(accounts.id, user.accountId))
        .returning();

      log.debug('Account update successful', {
        accountId: user.accountId,
        updatedFields: Object.keys(accountUpdateData)
      });
    } catch (dbError) {
      log.error('Account update failed', { 
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        accountId: user.accountId,
        userId: session.user.id
      });

      return createApiResponse(
        false,
        undefined,
        'Database update failed',
        undefined,
        500
      );
    }

    if (updatedAccount.length === 0) {
      return createApiResponse(
        false,
        undefined,
        'Account not found',
        undefined,
        404
      );
    }

    // Update the users table with firstName, lastName, and profilePictureUrl if provided
    let updatedUser = null;
    if (firstName || lastName || profilePictureUrl) {
      const userUpdateData: any = {
        updatedAt: new Date()
      };

      if (firstName) userUpdateData.firstName = firstName;
      if (lastName) userUpdateData.lastName = lastName;
      if (profilePictureUrl) userUpdateData.profilePhotoUrl = profilePictureUrl;

      try {
        const userUpdateResult = await db
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, parseInt(session.user.id)))
          .returning();

        updatedUser = userUpdateResult[0];
        log.debug('User update successful', {
          userId: session.user.id,
          updatedFields: Object.keys(userUpdateData)
        });
      } catch (dbError) {
        log.error('User update failed', { 
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          userId: session.user.id
        });

        return createApiResponse(
          false,
          undefined,
          'User update failed',
          undefined,
          500
        );
      }
    }

    // Return the updated preferences
    const updatedPreferences = {
      userId: parseInt(session.user.id),
      firstName: updatedUser?.firstName || user.firstName || firstName || '',
      lastName: updatedUser?.lastName || user.lastName || lastName || '',
      email: updatedAccount[0].email || '',
      phone: updatedAccount[0].phone || '',
      profilePictureUrl: updatedUser?.profilePhotoUrl || profilePictureUrl || '',
      themePreference: updatedAccount[0].themePreference || 'light',
      timezone: updatedAccount[0].timezone || 'UTC',
      language: updatedAccount[0].languageLocale || 'en-US',
      dateFormat: updatedAccount[0].dateFormat || 'YYYY-MM-DD',
      timeFormat: updatedAccount[0].timeFormat || '24h',
      numberFormat: updatedAccount[0].numberFormat || '1,234.56',
      emailNotifications: updatedAccount[0].emailNotifications ?? true,
      smsNotifications: updatedAccount[0].smsNotifications ?? false
    };

    log.info('Admin preferences updated successfully', {
      userId: session.user.id,
      timezone: updatedPreferences.timezone,
      language: updatedPreferences.language
    });

    return createApiResponse(
      true,
      updatedPreferences,
      undefined,
      'Preferences updated successfully',
      200
    );

  } catch (error) {
    log.error('Error updating admin preferences', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id || 'unknown'
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 