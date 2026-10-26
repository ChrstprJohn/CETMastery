import { PrismaClient } from '../../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errors.js';

let client;

export function getPrisma() {
  if (!env.DATABASE_URL) throw new HttpError(503, 'Database is not configured yet.');
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000 }),
  });
  return client;
}

export async function disconnectPrisma() {
  await client?.$disconnect();
}
