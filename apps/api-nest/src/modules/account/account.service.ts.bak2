import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountService {
  getMembers(account_id: string) {
    return {
      success: true,
      data: {
        items: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'member',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      },
    };
  }

  addMember(account_id: string, memberData: any) {
    return {
      success: true,
      data: {
        id: 'new-member-id',
        account_id,
        ...memberData,
        created_at: new Date().toISOString(),
      },
    };
  }

  getSettings(account_id: string) {
    return {
      success: true,
      data: {
        account_id,
        name: 'Test Account',
        tier: 'account',
        features: ['basic', 'analytics'],
      },
    };
  }

  updateSettings(account_id: string, settings: any) {
    return {
      success: true,
      data: {
        account_id,
        ...settings,
        updated_at: new Date().toISOString(),
      },
    };
  }
}