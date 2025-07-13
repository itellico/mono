import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getProfile(userId: string) {
    return {
      success: true,
      data: {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        tier: 'user',
      },
    };
  }

  updateProfile(userId: string, updateData: any) {
    return {
      success: true,
      data: {
        id: userId,
        ...updateData,
        updated_at: new Date().toISOString(),
      },
    };
  }

  getSettings(userId: string) {
    return {
      success: true,
      data: {
        user_id: userId,
        notifications: true,
        theme: 'light',
        language: 'en',
      },
    };
  }
}