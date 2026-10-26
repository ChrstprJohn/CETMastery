import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { getPrisma, disconnectPrisma } from '../src/lib/prisma.js';

test('Supabase curriculum CRUD and constraints leave no test content behind', { skip: process.env.RUN_CURRICULUM_DB_TEST !== 'true' }, async () => {
  const db = getPrisma(); const slug = 'verification-' + randomUUID(); const ids = {};
  const server = createApp(undefined, { config: { NODE_ENV: 'development', ADMIN_AUTH_BYPASS: 'true' } }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/admin`;
  const call = (path, method = 'GET', body) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body && { body: JSON.stringify(body) }) });
  const common = { slug, sortOrder: 0, isPublished: false };
  try {
    let r = await call('/subjects', 'POST', { ...common, name: 'Temporary verification', description: '' }); assert.equal(r.status, 201); ids.subject = (await r.json()).data.id;
    r = await call('/topics', 'POST', { ...common, title: 'Temporary verification', subjectId: ids.subject, description: '' }); assert.equal(r.status, 201); ids.topic = (await r.json()).data.id;
    r = await call('/lessons', 'POST', { ...common, title: 'Temporary verification', topicId: ids.topic, summary: '', content: '## Verification' }); assert.equal(r.status, 201); ids.lesson = (await r.json()).data.id;
    assert.equal((await call('/subjects/' + ids.subject, 'DELETE')).status, 409);
    assert.equal((await call('/topics/' + ids.topic, 'DELETE')).status, 409);
    assert.equal((await call('/subjects', 'POST', { ...common, name: 'Duplicate', description: '' })).status, 409);
    r = await call('/lessons/' + ids.lesson, 'PUT', { ...common, title: 'Updated verification', topicId: ids.topic, summary: '', content: '' }); assert.equal(r.status, 200);
    r = await call('/lessons'); assert.equal((await r.json()).data.find(l => l.id === ids.lesson).title, 'Updated verification');
    const security = await db.$queryRaw`SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE nspname = 'app_private' AND relname IN ('subjects', 'topics', 'lessons')`;
    assert.equal(security.length, 3); assert.ok(security.every(t => t.relrowsecurity));
    for (const [resource, id] of [['lessons', ids.lesson], ['topics', ids.topic], ['subjects', ids.subject]]) assert.equal((await call('/' + resource + '/' + id, 'DELETE')).status, 204);
    assert.equal(await db.subject.count({ where: { slug } }), 0);
  } finally {
    if (ids.lesson) await db.lesson.deleteMany({ where: { id: ids.lesson } });
    if (ids.topic) await db.topic.deleteMany({ where: { id: ids.topic } });
    if (ids.subject) await db.subject.deleteMany({ where: { id: ids.subject } });
    await new Promise(resolve => server.close(resolve)); await disconnectPrisma();
  }
});
