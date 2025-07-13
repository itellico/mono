
import { z } from 'zod';

export const BundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  featureIds: z.array(z.string()),
});

export type Bundle = z.infer<typeof BundleSchema>;
