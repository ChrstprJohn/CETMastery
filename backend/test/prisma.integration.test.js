import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ensureProfile } from '../src/services/profiles.js';

test('Prisma persists one profile per verified identity', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
  const user = { id: randomUUID(), user_metadata: { full_name: 'Prisma test learner' } };
  try {
    const [first, second] = await Promise.all([
      ensureProfile(prisma, user), ensureProfile(prisma, user),
    ]);
    assert.equal(first.id, user.id);
    assert.equal(second.createdAt.toISOString(), first.createdAt.toISOString());
    assert.equal(await prisma.profile.count({ where: { id: user.id } }), 1);
    assert.equal((await prisma.profile.findUnique({ where: { id: user.id } })).displayName, 'Prisma test learner');
    const [security] = await prisma.$queryRaw`SELECT relrowsecurity FROM pg_class WHERE oid = 'app_private.profiles'::regclass`;
    assert.equal(security.relrowsecurity, true);
  } finally {
    await prisma.profile.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
