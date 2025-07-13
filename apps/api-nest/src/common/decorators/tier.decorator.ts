import { SetMetadata } from '@nestjs/common';
import { UserTier } from '../types/tier.types';

export const TIER_KEY = 'tier';
export const RequireTier = (tier: UserTier) =>
  SetMetadata(TIER_KEY, tier);

export const Tier = RequireTier;