/**
 * @openapi
 * /api/v1/admin/change-password:
 *   post:
 *     tags:
 *       - Admin
 *       - Authentication
 *     summary: Change User Password (Admin)
 *     description: Admin endpoint to change a user's password with proper validation and security
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user whose password to change
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 8 characters)
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: Invalid request or validation failed
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getTenantContext } from '@/lib/tenant-context';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context for multi-tenant isolation
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Invalid tenant context' }, { status: 403 });
    }

    const adminUserId = parseInt(session.user.id);
    const body = await request.json();
    const { userId, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!userId || !newPassword) {
      return NextResponse.json({ 
        error: 'User ID and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: 'Password confirmation does not match' 
      }, { status: 400 });
    }

    logger.info('Admin password change request', { 
      adminUserId, 
      targetUserId: userId,
      tenantId: tenantContext.id
    });

    // Check if admin has permission to change passwords
    const adminRoleResults = await prisma.adminRole.findMany({
      where: {
        userId: adminUserId,
        tenantId: tenantContext.id,
        isActive: true,
        canManageUsers: true,
      },
    });

    if (adminRoleResults.length === 0) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to change user passwords' 
      }, { status: 403 });
    }

    // Find the target user's account with tenant isolation
    const targetAccount = await prisma.account.findFirst({
      where: {
        id: userId,
        tenantId: tenantContext.id,
      },
    });
    if (!targetAccount) {
      return NextResponse.json({ 
        error: 'User not found or access denied' 
      }, { status: 404 });
    }

    if (!targetAccount.isActive) {
      return NextResponse.json({ 
        error: 'Cannot change password for inactive account' 
      }, { status: 400 });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the account password using Prisma
    const updatedAccount = await prisma.account.update({
      where: {
        id: userId,
        tenantId: tenantContext.id,
      },
      data: {
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      },
    });

    logger.info('Password changed successfully by admin', { 
      adminUserId,
      targetUserId: userId,
      targetEmail: updatedAccount.email,
      tenantId: tenantContext.id
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        userId: updatedAccount.id,
        updatedAt: updatedAccount.updatedAt
      }
    });

  } catch (error) {
    logger.error('Admin password change failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to change password',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 