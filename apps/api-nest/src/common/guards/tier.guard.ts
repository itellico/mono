import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIER_KEY } from '../decorators/tier.decorator';

@Injectable()
export class TierGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<string>(TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Tier hierarchy: platform > tenant > account > user > public
    const tierHierarchy = ['public', 'user', 'account', 'tenant', 'platform'];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    if (userTierIndex === -1) {
      throw new ForbiddenException('Invalid user tier');
    }

    if (userTierIndex < requiredTierIndex) {
      throw new ForbiddenException(
        `Access denied. Required tier: ${requiredTier}, your tier: ${user.tier}`,
      );
    }

    return true;
  }
}