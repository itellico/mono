import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class AccountContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract account ID from various sources
    let accountId: string;

    // 1. From route params (e.g., /api/v2/account/:accountId/...)
    if (request.params?.accountId) {
      accountId = request.params.accountId;
    }
    // 2. From query params
    else if (request.query?.accountId) {
      accountId = request.query.accountId;
    }
    // 3. From request body
    else if (request.body?.accountId) {
      accountId = request.body.accountId;
    }
    // 4. From user's default account
    else if (user.accountId) {
      accountId = user.accountId;
    }

    // Verify user has access to this account
    if (accountId) {
      if (user.tier === 'platform' || user.tier === 'tenant') {
        // Platform and tenant admins can access any account
        // Optionally verify account belongs to tenant
        if (user.tier === 'tenant' && user.tenantId) {
          const account = await this.prisma.account.findFirst({
            where: {
              id: parseInt(accountId),
              tenant_id: parseInt(user.tenantId),
            },
          });
          if (!account) {
            throw new ForbiddenException('Account not found in your tenant');
          }
        }
      } else {
        // Regular users can only access their own account
        if (user.accountId !== accountId) {
          throw new ForbiddenException('Access denied to this account');
        }
      }
    }

    // Attach account context to request
    request.account = {
      id: accountId,
      user_id: user.id,
      tenant_id: user.tenantId,
      tier: user.tier,
    };

    return true;
  }
}