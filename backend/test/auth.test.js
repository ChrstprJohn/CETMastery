import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { HttpError } from '../src/middleware/errors.js';

const userId = 'dc93b010-e717-4ce4-bbd1-9d066f4a8d27';
const otherId = '2112aa9e-409c-490a-bef2-507196b7d6c8';
const profiles = new Map();
const signouts = [];
const user = { id: userId, email: 'learner@example.test', app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Sample Learner', role: 'admin' } };
const database = { profile: {
  async upsert({ where, create }) {
    assert.equal(where.id, create.id);
    if (!profiles.has(where.id)) profiles.set(where.id, { ...create, createdAt: new Date().toISOString() });
    return profiles.get(where.id);
  },
  async findUnique({ where }) { return profiles.get(where.id) ?? null; },
} };
const authClient = { auth: {
  async getUser(token) {
    if (token === 'unavailable') return { error: { status: 503 } };
    if (token === 'bad') return { error: { status: 401 } };
    if (token === 'unconfigured') throw new HttpError(503, 'Authentication is not configured yet.');
    if (token === 'email') return { data: { user: { ...user, app_metadata: { provider: 'email' } } } };
    if (token === 'anonymous') return { data: { user: { ...user, is_anonymous: true } } };
    return { data: { user: token === 'other' ? { ...user, id: otherId } : user } };
  },
  admin: { async signOut(token, scope) { signouts.push({ token, scope }); return { error: null }; } },
} };

let server;
let origin;
before(async () => {
  server = createApp({ getAuthClient: () => authClient, getDatabase: () => database }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}/api/auth`;
});
after(() => new Promise((resolve) => server.close(resolve)));
const request = (path, token, method = 'GET', body) => fetch(`${origin}${path}`, {
  method,
  headers: { ...(token && { Authorization: `Bearer ${token}` }), 'Content-Type': 'application/json' },
  ...(body !== undefined && { body: JSON.stringify(body) }),
});

test('auth rejects missing, invalid, anonymous, and email credentials', async () => {
  assert.equal((await request('/me')).status, 401);
  assert.equal((await request('/me', 'bad')).status, 401);
  assert.equal((await request('/me', 'email')).status, 403);
  assert.equal((await request('/me', 'anonymous')).status, 403);
  assert.equal((await request('/me', 'unavailable')).status, 503);
  assert.equal((await request('/me', 'unconfigured')).status, 503);
  const malformed = await fetch(`${origin}/me`, { headers: { Authorization: 'Bearer bad,extra' } });
  assert.equal(malformed.status, 401);
  assert.equal(profiles.size, 0);
});

test('session bootstrap is idempotent and current-user reads stay scoped', async () => {
  assert.equal((await (await request('/me', 'google')).json()).data.profile, null);
  const first = await request('/session', 'google', 'POST', {});
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const { data } = await first.json();
  assert.equal(data.profile.id, userId);
  assert.equal(data.profile.displayName, 'Sample Learner');
  assert.deepEqual(data.user, { id: userId, email: user.email, provider: 'google' });
  assert.equal((await request('/session', 'google', 'POST')).status, 200);
  assert.equal(profiles.size, 1);
  const own = await (await request('/me', 'google')).json();
  assert.equal(own.data.profile.id, userId);
  const other = await (await request(`/me?userId=${userId}`, 'other')).json();
  assert.equal(other.data.user.id, otherId);
  assert.equal(other.data.profile, null);
  assert.equal((await request('/session', 'google', 'POST', { userId: otherId, role: 'admin' })).status, 400);
});

test('sign-out revokes only the verified caller session', async () => {
  assert.equal((await request('/logout', 'google', 'POST')).status, 204);
  assert.deepEqual(signouts, [{ token: 'google', scope: 'local' }]);
  assert.equal((await request('/logout', 'bad', 'POST')).status, 401);
  assert.equal(signouts.length, 1);
});

test('email registration and password routes do not exist', async () => {
  assert.equal((await request('/register', 'google', 'POST', { email: user.email, password: 'unused' })).status, 404);
});
