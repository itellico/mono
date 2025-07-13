
import { z } from 'zod';

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isEnabled: z.boolean(),
});

export type Feature = z.infer<typeof FeatureSchema>;
