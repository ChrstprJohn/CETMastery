import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { app } from '../src/app.js';

let server;
let origin;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test('health responds and question delivery keeps the answer private', async () => {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const response = await fetch(`${origin}/api/practice/question`);
  const { data } = await response.json();
  assert.equal(data.options.length, 4);
  assert.equal(data.correctOptionId, undefined);
  assert.equal(data.explanation, undefined);
});

test('scores answers on the server and rejects invalid requests', async () => {
  const answer = (body) => fetch(`${origin}/api/practice/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const correct = await answer({ questionId: 'linear-equations-01', optionId: 'b' });
  assert.equal((await correct.json()).data.correct, true);
  const incorrect = await answer({ questionId: 'linear-equations-01', optionId: 'a' });
  assert.equal((await incorrect.json()).data.correct, false);
  assert.equal((await answer({ questionId: 'linear-equations-01', optionId: 'z' })).status, 400);
  assert.equal((await answer({ questionId: 'missing', optionId: 'a' })).status, 404);
  assert.equal((await answer({ questionId: 'linear-equations-01', optionId: 'b', score: 100 })).status, 400);
  const malformed = await fetch(`${origin}/api/practice/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);
  const missing = await fetch(`${origin}/api/missing`);
  assert.equal(missing.status, 404);
});
