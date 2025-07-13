
import { z } from 'zod';

export const SubscriptionLimitsSchema = z.object({
  planId: z.string(),
  maxProjects: z.number().positive(),
  maxUsers: z.number().positive(),
  storageLimit: z.number().positive(),
});

export type SubscriptionLimits = z.infer<typeof SubscriptionLimitsSchema>;
