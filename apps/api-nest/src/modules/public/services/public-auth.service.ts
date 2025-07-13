import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { AuthService } from '@modules/auth/auth.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PublicAuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private authService: AuthService,
  ) {}

  async register(registerDto: {
    email: string;
    password: string;
    name: string;
    tenantId?: string;
  }) {
    // Check if account already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAccount) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.authService.hashPassword(registerDto.password);

    // Create account first
    const account = await this.prisma.account.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        tenant_id: parseInt(registerDto.tenantId || '1'),
        is_active: false, // Require email verification
      },
    });

    // Split name into first and last name
    const nameParts = registerDto.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate username from email
    const username = registerDto.email.split('@')[0] + '_' + Date.now();

    // Create user linked to account
    const user = await this.prisma.user.create({
      data: {
        account_id: account.id,
        first_name: firstName,
        last_name: lastName,
        username,
        user_hash: randomBytes(16).toString('hex'),
        is_active: false,
        account_role_id: 1, // Default role ID - should be fetched from roles table
      },
    });

    // Assign default user role
    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'user' },
    });

    if (defaultRole) {
      await this.prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: defaultRole.id,
        },
      });
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    await this.redis.set(
      `email-verification:${verificationToken}`,
      user.id,
      60 * 60 * 24, // 24 hours
    );

    // TODO: Send verification email

    return {
      success: true,
      data: {
        message: 'Registration successful. Please check your email to verify your account.',
        user_id: user.id,
      },
    };
  }

  async forgotPassword(email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        users: true,
      },
    });

    if (!account || !account.users[0]) {
      // Don't reveal if user exists
      return {
        success: true,
        data: {
          message: 'If an account exists with this email, a password reset link will be sent.',
        },
      };
    }

    const user = account.users[0];

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    await this.redis.set(
      `password-reset:${resetToken}`,
      user.id,
      60 * 60, // 1 hour
    );

    // TODO: Send password reset email

    return {
      success: true,
      data: {
        message: 'If an account exists with this email, a password reset link will be sent.',
      },
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Get user ID from token
    const userId = await this.redis.get(`password-reset:${token}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.authService.hashPassword(newPassword);

    // Get user to find their account
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId as string) },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new UnauthorizedException('User not found');
    }

    // Update account password
    await this.prisma.account.update({
      where: { id: user.account.id },
      data: { password_hash: hashedPassword },
    });

    // Delete reset token
    await this.redis.del(`password-reset:${token}`);

    return {
      success: true,
      data: {
        message: 'Password reset successful. You can now sign in with your new password.',
      },
    };
  }

  async verifyEmail(token: string) {
    // Get user ID from token
    const userId = await this.redis.get(`email-verification:${token}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    // Get user to find their account
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId as string) },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new UnauthorizedException('User not found');
    }

    // Activate both user and account
    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_active: true },
    });

    await this.prisma.account.update({
      where: { id: user.account.id },
      data: { 
        is_active: true,
        email_verified: true,
      },
    });

    // Delete verification token
    await this.redis.del(`email-verification:${token}`);

    return {
      success: true,
      data: {
        message: 'Email verified successfully. You can now sign in to your account.',
      },
    };
  }
}