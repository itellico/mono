import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async validateUser(email: string, password: string) {
    // Find user through account since email is in Account model
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!account || !account.is_active) {
      return null;
    }

    // Get the primary user for this account
    const user = account.users[0];
    if (!user || !user.is_active) {
      return null;
    }

    // Check password against account's password_hash
    const isPasswordValid = await bcrypt.compare(password, account.password_hash || '');
    if (!isPasswordValid) {
      return null;
    }

    // Determine user tier based on roles
    const tier = this.determineUserTier(user.userRoles || []);
    
    // Get role codes (not names) for frontend compatibility
    const roles = user.userRoles?.map(ur => ur.role.code) || [];

    return {
      id: user.id.toString(),
      email: account.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      tier,
      tenant_id: account.tenant_id.toString(),
      account_id: user.account_id.toString(),
      roles,
    };
  }

  async signIn(signInDto: { email: string; password: string }) {
    // Validate user credentials
    const user = await this.validateUser(signInDto.email, signInDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate access and refresh tokens
    const tokens = await this.generateTokens(user);
    
    // Store refresh token in database with expiry
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Cache user session
    await this.redis.set(
      `session:${user.id}`,
      {
        user_id: user.id,
        email: user.email,
        tier: user.tier,
        tenantId: user.tenant_id,
        accountId: user.account_id,
        lastActive: new Date().toISOString(),
      },
      60 * 60 * 24 * 7, // 7 days
    );

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        tenant_id: user.tenant_id,
        account_id: user.account_id,
        roles: user.roles || [],
        permissions: [], // TODO: Get from permission service
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async getUserWithRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        user_preferences: true, // Include user preferences
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.userRoles?.map(ur => ur.role.code) || [];

    return {
      id: user.id.toString(),
      uuid: user.uuid,
      email: user.account.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      tier: this.determineUserTier(user.userRoles || []),
      tenant_id: user.account.tenant_id?.toString(),
      account_id: user.account_id.toString(),
      roles,
      permissions: [], // TODO: Get from permission service
      preferences: user.user_preferences ? {
        timezone: user.user_preferences.timezone,
        locale: user.user_preferences.language_locale,
        theme: user.user_preferences.theme_preference,
        dateFormat: user.user_preferences.date_format,
      } : null,
    };
  }

  async signOut(userId: string, refreshToken?: string) {
    // Clear session from Redis
    await this.redis.del(`session:${userId}`);
    
    // Invalidate refresh token in database
    if (refreshToken) {
      await this.invalidateRefreshToken(refreshToken);
    }

    return {
      success: true,
      message: 'Successfully signed out',
    };
  }

  async refresh(refreshToken: string) {
    // Validate refresh token
    const tokenData = await this.validateRefreshToken(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: tokenData.userId },
      include: {
        account: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.is_active || !user.account?.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens (refresh token rotation)
    const tokens = await this.generateTokens({
      id: user.id.toString(),
      email: user.account.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      tier: this.determineUserTier(user.userRoles || []),
      tenant_id: user.account.tenant_id?.toString(),
      account_id: user.account_id.toString(),
      roles: user.userRoles?.map(ur => ur.role.code) || [],
    });

    // Invalidate old refresh token and store new one
    await this.invalidateRefreshToken(refreshToken);
    await this.storeRefreshToken(user.id.toString(), tokens.refreshToken);

    return {
      success: true,
      data: {
        id: user.id.toString(),
        email: user.account.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        tier: this.determineUserTier(user.userRoles || []),
        tenant_id: user.account.tenant_id?.toString(),
        account_id: user.account_id.toString(),
        roles: user.userRoles?.map(ur => ur.role.code) || [],
        permissions: [], // TODO: Get from permission service
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  /**
   * Generate access and refresh tokens for a user
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
      tenantId: user.tenant_id,
      accountId: user.account_id,
    };

    // Short-lived access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Long-lived refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database with expiry
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

    // Store in Redis with automatic expiry
    await this.redis.set(
      `refresh_token:${refreshToken}`,
      {
        userId: parseInt(userId),
        createdAt: new Date().toISOString(),
      },
      60 * 60 * 24 * 7 // 7 days in seconds
    );
  }

  /**
   * Validate refresh token
   */
  private async validateRefreshToken(refreshToken: string): Promise<{ userId: number } | null> {
    try {
      // Verify JWT signature and expiry
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        return null;
      }

      // Check if token exists in Redis (not revoked)
      const tokenData = await this.redis.get(`refresh_token:${refreshToken}`);
      if (!tokenData) {
        return null;
      }

      return { userId: parseInt(payload.sub) };
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidate refresh token
   */
  private async invalidateRefreshToken(refreshToken: string): Promise<void> {
    await this.redis.del(`refresh_token:${refreshToken}`);
  }

  private determineUserTier(userRoles: any[]): string {
    // Tier hierarchy: platform > tenant > account > user > public
    const roleTiers = userRoles.map(ur => {
      const roleName = ur.role.name.toLowerCase();
      if (roleName.includes('platform') || roleName.includes('super')) return 'platform';
      if (roleName.includes('tenant')) return 'tenant';
      if (roleName.includes('account')) return 'account';
      return 'user';
    });

    // Return highest tier
    if (roleTiers.includes('platform')) return 'platform';
    if (roleTiers.includes('tenant')) return 'tenant';
    if (roleTiers.includes('account')) return 'account';
    return 'user';
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with account
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { account: true },
    });

    if (!user || !user.account) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.account.password_hash || '');
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password in database
    await this.prisma.account.update({
      where: { id: user.account.id },
      data: { password_hash: hashedNewPassword },
    });

    // Invalidate all existing sessions for security
    await this.redis.del(`session:${userId}`);
  }
}
