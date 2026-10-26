import { z } from 'zod';

const schema = z.object({
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  SUPABASE_URL: z.union([z.url(), z.literal('')]).optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
