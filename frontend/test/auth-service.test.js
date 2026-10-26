import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attachAccessToken, createAuthService } from '../src/lib/auth-service.js';

function setup() {
  const calls = [];
  const session = { access_token: 'test-supabase-access-token' };
  const account = { user: { id: 'learner-1', email: 'learner@example.test' }, profile: { id: 'learner-1', displayName: 'Sample Learner' } };
  const client = { auth: {
    async getSession() { return { data: { session } }; },
    async signInWithOAuth(options) { calls.push(['signIn', options]); return { error: null }; },
    async exchangeCodeForSession(code) { calls.push(['exchange', code]); return { data: { session }, error: null }; },
    async signOut(options) { calls.push(['clearSession', options]); return { error: null }; },
  } };
  const api = {
    async get(path) { calls.push(['get', path]); return { data: { data: account } }; },
    async post(path, body) { calls.push(['post', path, body]); return { data: { data: account } }; },
  };
  return { client, api, calls, account, auth: createAuthService(client, api) };
}

test('Google sign-in uses an origin-matched callback and no email/password flow', async () => {
  const { auth, calls } = setup();
  await auth.startSignIn('http://localhost:5174');
  assert.deepEqual(calls, [['signIn', {
    provider: 'google', options: {
      redirectTo: 'http://localhost:5174/auth/callback', scopes: 'openid email profile', queryParams: { prompt: 'select_account' },
    },
  }]]);
  await assert.rejects(createAuthService(null, {}).startSignIn('http://localhost:5174'), /not configured/);
});

test('API requests attach Supabase access tokens and allow public requests without a session', async () => {
  const { client } = setup();
  const protectedRequest = await attachAccessToken({ headers: {} }, client);
  assert.equal(protectedRequest.headers.Authorization, 'Bearer test-supabase-access-token');
  const anonymous = { auth: { async getSession() { return { data: { session: null } }; } } };
  assert.deepEqual(await attachAccessToken({ headers: {} }, anonymous), { headers: {} });
  assert.deepEqual(await attachAccessToken({ headers: { Authorization: 'Bearer stale' } }, anonymous), { headers: {} });
  assert.deepEqual(await attachAccessToken({ headers: {} }, null), { headers: {} });
});

test('callback exchanges a one-use code and bootstraps the profile only once', async () => {
  const { auth, calls, account } = setup();
  const href = 'http://localhost:5174/auth/callback?code=one-use-code';
  const first = auth.completeCallback(href);
  const second = auth.completeCallback(href);
  assert.equal(first, second);
  assert.deepEqual(await first, account);
  assert.deepEqual(calls, [['exchange', 'one-use-code'], ['post', '/auth/session', {}]]);
});

test('cancelled or missing OAuth codes never create a profile', async () => {
  const cancelled = setup();
  await assert.rejects(cancelled.auth.completeCallback('http://localhost:5174/auth/callback?error=access_denied&error_description=untrusted'), /cancelled/);
  assert.deepEqual(cancelled.calls, []);
  const missing = setup();
  await assert.rejects(missing.auth.completeCallback('http://localhost:5174/auth/callback'), /missing or expired/);
  assert.deepEqual(missing.calls, []);
  const invalid = setup();
  invalid.client.auth.exchangeCodeForSession = async () => ({ data: {}, error: {} });
  await assert.rejects(invalid.auth.completeCallback('http://localhost:5174/auth/callback?code=invalid'), /could not be verified/);
  assert.deepEqual(invalid.calls, []);
  const duplicate = setup();
  await assert.rejects(duplicate.auth.completeCallback('http://localhost:5174/auth/callback?code=one&code=two'), /missing or expired/);
  assert.deepEqual(duplicate.calls, []);
});

test('existing accounts are read and a missing profile is bootstrapped', async () => {
  const { auth, calls, api, account } = setup();
  assert.deepEqual(await auth.loadAccount(), account);
  assert.deepEqual(calls, [['get', '/auth/me']]);
  api.get = async () => ({ data: { data: { user: account.user, profile: null } } });
  assert.deepEqual(await auth.loadAccount(), account);
  assert.equal(calls.at(-1)[1], '/auth/session');
});

test('sign-out uses Supabase directly and does not depend on Express availability', async () => {
  const { auth, calls } = setup();
  assert.deepEqual(await auth.signOut(), {});
  assert.deepEqual(calls, [['clearSession', { scope: 'local' }]]);
  const unavailable = setup();
  unavailable.api.post = async () => { throw { response: { status: 503 } }; };
  await unavailable.auth.signOut();
  assert.deepEqual(unavailable.calls, [['clearSession', { scope: 'local' }]]);
});

test('failed remote revocation distinguishes a cleared browser session from an active session', async () => {
  const cleared = setup();
  cleared.client.auth.signOut = async () => ({ error: { status: 503 } });
  cleared.client.auth.getSession = async () => ({ data: { session: null }, error: null });
  assert.match((await cleared.auth.signOut()).warning, /signed out on this browser/);
  const active = setup();
  active.client.auth.signOut = async () => ({ error: { status: 503 } });
  await assert.rejects(active.auth.signOut(), /could not be cleared/);
});
