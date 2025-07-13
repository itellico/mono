import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        user_preferences: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Use user preferences or defaults
    const preferences = user.user_preferences;

    return {
      success: true,
      data: {
        theme: preferences?.theme_preference || 'SYSTEM',
        language: preferences?.language_locale || 'en-US',
        timezone: preferences?.timezone || 'UTC',
        currency: preferences?.currency_code || 'USD',
        dateFormat: preferences?.date_format || 'YYYY_MM_DD',
        timeFormat: preferences?.time_format || 'TWENTY_FOUR_H',
        notifications: {
          email: preferences?.email_notifications ?? true,
          sms: preferences?.sms_notifications ?? false,
        },
      },
    };
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Upsert user preferences (create if doesn't exist, update if exists)
    const updatedPreferences = await this.prisma.user_preferences.upsert({
      where: { user_id: parseInt(userId) },
      create: {
        user_id: parseInt(userId),
        ...(preferences.theme && { theme_preference: preferences.theme }),
        ...(preferences.language && { language_locale: preferences.language }),
        ...(preferences.timezone && { timezone: preferences.timezone }),
        ...(preferences.currency && { currency_code: preferences.currency }),
        ...(preferences.dateFormat && { date_format: preferences.dateFormat }),
        ...(preferences.timeFormat && { time_format: preferences.timeFormat }),
        ...(preferences.notifications?.email !== undefined && { email_notifications: preferences.notifications.email }),
        ...(preferences.notifications?.sms !== undefined && { sms_notifications: preferences.notifications.sms }),
      },
      update: {
        ...(preferences.theme && { theme_preference: preferences.theme }),
        ...(preferences.language && { language_locale: preferences.language }),
        ...(preferences.timezone && { timezone: preferences.timezone }),
        ...(preferences.currency && { currency_code: preferences.currency }),
        ...(preferences.dateFormat && { date_format: preferences.dateFormat }),
        ...(preferences.timeFormat && { time_format: preferences.timeFormat }),
        ...(preferences.notifications?.email !== undefined && { email_notifications: preferences.notifications.email }),
        ...(preferences.notifications?.sms !== undefined && { sms_notifications: preferences.notifications.sms }),
      },
    });

    // Clear user cache
    await this.redis.del(`user:${userId}`);

    return {
      success: true,
      data: {
        message: 'Preferences updated successfully',
      },
    };
  }

  async toggle2FA(userId: string, twoFactorData: any) {
    // TODO: Implement 2FA logic with authenticator app
    // This is a placeholder implementation
    
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // TODO: Implement 2FA status update when schema supports it
    // await this.prisma.account.update({
    //   where: { id: user.account_id },
    //   data: {
    //     two_factor_enabled: twoFactorData.enable,
    //   },
    // });

    return {
      success: true,
      data: {
        message: twoFactorData.enable 
          ? 'Two-factor authentication enabled'
          : 'Two-factor authentication disabled',
      },
    };
  }

  async deleteAccount(userId: string, deleteData: {
    password: string;
    reason?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        account: {
          select: {
            password_hash: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(deleteData.password, user.account.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    // Soft delete - set is_active to false
    await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        is_active: false,
        // TODO: Add deleted_at and deletion_reason fields to schema if needed
      },
    });

    // Clear all user sessions and cache
    await this.redis.del(`session:${userId}`);
    await this.redis.del(`user:${userId}`);
    await this.redis.delPattern(`permissions:${userId}*`);

    return {
      success: true,
      data: {
        message: 'Account has been deactivated. You can contact support within 30 days to restore it.',
      },
    };
  }
}