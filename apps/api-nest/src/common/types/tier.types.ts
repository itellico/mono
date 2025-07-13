export enum UserTier {
  PUBLIC = 'public',
  USER = 'user',
  ACCOUNT = 'account',
  TENANT = 'tenant',
  PLATFORM = 'platform',
}

export const TierHierarchy = {
  [UserTier.PUBLIC]: 0,
  [UserTier.USER]: 1,
  [UserTier.ACCOUNT]: 2,
  [UserTier.TENANT]: 3,
  [UserTier.PLATFORM]: 4,
};

export function hasMinimumTier(userTier: UserTier, requiredTier: UserTier): boolean {
  return TierHierarchy[userTier] >= TierHierarchy[requiredTier];
}