import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { requireAdmin } from '../src/middleware/admin.js';
import { curriculumSchemas } from '../src/routes/admin.js';

const adminId = randomUUID();
const google = { id: adminId, app_metadata: { provider: 'google' } };
const auth = (user) => () => ({ auth: { getUser: async () => ({ data: { user } }) } });
async function authorize(config, user, header = 'Bearer valid') {
  let passed = false;
  await requireAdmin(auth(user), config, () => ({ profile: { findUnique: async ({ where }) => ({ role: where.id === adminId ? 'admin' : 'user' }) } }))({ headers: { authorization: header } }, {}, () => { passed = true; });
  return passed;
}
test('admin auth bypass is explicit and development-only; protected access needs a verified Google admin', async () => {
  assert.equal(await authorize({ NODE_ENV: 'development', ADMIN_AUTH_BYPASS: 'true' }), true);
  for (const NODE_ENV of ['production', 'test']) await assert.rejects(authorize({ NODE_ENV, ADMIN_AUTH_BYPASS: 'true' }), { status: 503 });
  const config = { NODE_ENV: 'production', ADMIN_AUTH_BYPASS: 'false', ADMIN_USER_IDS: adminId };
  assert.equal(await authorize(config, google), true);
  await assert.rejects(authorize(config, { ...google, id: randomUUID() }), { status: 403 });
  await assert.rejects(authorize(config, { ...google, app_metadata: { provider: 'email' } }), { status: 403 });
  await assert.rejects(authorize(config, google, ''), { status: 401 });
});
test('curriculum validates unknown fields, hierarchy IDs, slugs, order, and Markdown size', () => {
  const base = { name: ' Math ', description: '', slug: 'math', sortOrder: 0, isPublished: false };
  assert.equal(curriculumSchemas.subjects.parse(base).name, 'Math');
  for (const patch of [{ name: '  ' }, { slug: 'Bad Slug' }, { sortOrder: -1 }, { sortOrder: 1.2 }, { isPublished: 'true' }, { role: 'admin' }]) assert.equal(curriculumSchemas.subjects.safeParse({ ...base, ...patch }).success, false);
  const { name, ...rest } = base;
  assert.equal(curriculumSchemas.topics.safeParse({ ...rest, title: name, subjectId: 'fake' }).success, false);
  assert.equal(curriculumSchemas.lessons.safeParse({ slug: 'intro', title: 'Intro', summary: '', topicId: randomUUID(), content: 'x'.repeat(200001), sortOrder: 0, isPublished: false }).success, false);
});
test('admin routes perform CRUD, reject invalid bodies, and translate database conflicts', async () => {
  const id = randomUUID(); let row;
  const model = {
    findMany: async () => row ? [row] : [],
    create: async ({ data }) => { if (data.slug === 'duplicate') throw Object.assign(new Error(), { code: 'P2002' }); row = { id, ...data }; return row; },
    update: async ({ data }) => { row = { ...row, ...data }; return row; },
    delete: async () => { if (row?.slug === 'has-children') throw Object.assign(new Error(), { code: 'P2003' }); row = undefined; },
  };
  const server = createApp(undefined, { getDatabase: () => ({ subject: model }), config: { NODE_ENV: 'development', ADMIN_AUTH_BYPASS: 'true' } }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/admin/subjects`;
  const request = (method, body, suffix = '') => fetch(url + suffix, { method, headers: { 'Content-Type': 'application/json' }, ...(body && { body: JSON.stringify(body) }) });
  const body = { name: 'Math', description: '', slug: 'math', sortOrder: 0, isPublished: false };
  try {
    assert.equal((await request('POST', { ...body, unknown: 1 })).status, 400);
    assert.equal((await request('POST', body)).status, 201);
    assert.equal((await (await request('GET')).json()).data[0].name, 'Math');
    assert.equal((await request('PUT', { ...body, name: 'Mathematics' }, `/${id}`)).status, 200);
    assert.equal(row.name, 'Mathematics');
    assert.equal((await request('POST', { ...body, slug: 'duplicate' })).status, 409);
    await request('PUT', { ...body, slug: 'has-children' }, `/${id}`);
    assert.equal((await request('DELETE', null, `/${id}`)).status, 409);
    await request('PUT', body, `/${id}`);
    assert.equal((await request('DELETE', null, `/${id}`)).status, 204);
    assert.equal((await request('DELETE', null, '/invalid-id')).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
