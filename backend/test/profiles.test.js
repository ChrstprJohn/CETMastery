import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ensureProfile } from '../src/services/profiles.js';

async function profileFrom(metadata) {
  let query;
  const prisma = { profile: { async upsert(input) { query = input; return input.create; } } };
  const profile = await ensureProfile(prisma, { id: 'verified-user-id', user_metadata: metadata });
  return { profile, query };
}

test('seeds optional Google fields without copying identity or privilege fields', async () => {
  const { profile } = await profileFrom({
    name: 'Sam Lee', given_name: ' Sam ', family_name: 'Lee',
    picture: 'https://example.test/photo.jpg', locale: 'en-ph',
    id: 'spoofed', email: 'unused@example.test', password: 'unused', role: 'admin',
  });
  assert.deepEqual(profile, {
    id: 'verified-user-id', displayName: 'Sam Lee', firstName: 'Sam', lastName: 'Lee',
    avatarUrl: 'https://example.test/photo.jpg', locale: 'en-PH',
  });
});

test('missing provider fields remain null and full names are never split', async () => {
  const { profile } = await profileFrom({ full_name: 'A Single Display Name' });
  assert.equal(profile.displayName, 'A Single Display Name');
  assert.equal(profile.firstName, null);
  assert.equal(profile.lastName, null);
  assert.equal(profile.avatarUrl, null);
  assert.equal(profile.locale, null);
  assert.equal((await profileFrom(undefined)).profile.displayName, null);
});

test('future provider-neutral metadata works while malformed optional values are ignored', async () => {
  const { profile } = await profileFrom({ first_name: 'Ada', last_name: 'Lovelace', avatar_url: 'javascript:alert(1)', locale: 'not a locale' });
  assert.equal(profile.displayName, 'Ada Lovelace');
  assert.equal(profile.avatarUrl, null);
  assert.equal(profile.locale, null);
  const oversized = await profileFrom({ full_name: '😀'.repeat(130), picture: 'https://example.test/' + 'x'.repeat(2100) });
  assert.equal(Array.from(oversized.profile.displayName).length, 120);
  assert.equal(oversized.profile.avatarUrl, null);
});
