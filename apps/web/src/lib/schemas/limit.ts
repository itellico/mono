
import { z } from 'zod';

export const LimitSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  planId: z.string(),
  limit: z.number(),
});

export type Limit = z.infer<typeof LimitSchema>;
