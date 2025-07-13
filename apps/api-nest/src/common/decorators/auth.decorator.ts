import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TierGuard } from '../guards/tier.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { TenantContextGuard } from '../guards/tenant-context.guard';
import { AccountContextGuard } from '../guards/account-context.guard';
import { RequireTier } from './tier.decorator';
import { RequirePermissions } from './permission.decorator';
import { UserTier } from '../types/tier.types';

interface AuthOptions {
  tier?: UserTier;
  permissions?: string[];
  requireTenant?: boolean;
  requireAccount?: boolean;
}

export function Auth(options: AuthOptions = {}) {
  const decorators = [UseGuards(JwtAuthGuard)];

  if (options.tier) {
    decorators.push(UseGuards(TierGuard), RequireTier(options.tier));
  }

  if (options.permissions && options.permissions.length > 0) {
    decorators.push(UseGuards(PermissionGuard), RequirePermissions(...options.permissions));
  }

  if (options.requireTenant) {
    decorators.push(UseGuards(TenantContextGuard));
  }

  if (options.requireAccount) {
    decorators.push(UseGuards(AccountContextGuard));
  }

  return applyDecorators(...decorators);
}