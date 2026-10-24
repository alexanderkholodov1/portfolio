import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { checkPrivacy } from '../scripts/privacy-check.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-privacy-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'dist'));
  await mkdir(path.join(root, 'private'));
  return root;
}

test('allows public pages and fails closed on a missing output', async (t) => {
  const root = await fixture(t);
  await assert.rejects(checkPrivacy({ root }), /empty/);
  await writeFile(path.join(root, 'dist/index.html'), '<h1>Alexander Kholodov</h1>');
  assert.equal(await checkPrivacy({ root }), 1);
});

for (const content of ['-----BEGIN PRIVATE KEY-----', '{"private_key":"hidden"}', `ghp_${'a'.repeat(36)}`]) {
  test('rejects key material without echoing it', async (t) => {
    const root = await fixture(t);
    await writeFile(path.join(root, 'dist/bundle.js'), content);
    await assert.rejects(checkPrivacy({ root }), (error) => /forbidden/.test(error.message) && !error.message.includes(content));
  });
}

test('rejects renamed private files and embedded escaped private values', async (t) => {
  const root = await fixture(t);
  const value = 'synthetic-private-value-with\nmultiple-lines';
  await writeFile(path.join(root, 'private/input.json'), JSON.stringify({ credential: value }));
  await writeFile(path.join(root, 'dist/photo.bin'), JSON.stringify({ credential: value }));
  await assert.rejects(checkPrivacy({ root }), /forbidden/);
  await writeFile(path.join(root, 'dist/photo.bin'), `prefix ${JSON.stringify(value)} suffix`);
  await assert.rejects(checkPrivacy({ root }), /forbidden/);
});

test('rejects short identical private bytes, private paths and symbolic links', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'private/short'), 'tiny');
  await writeFile(path.join(root, 'dist/leak'), 'tiny');
  await assert.rejects(checkPrivacy({ root }), /forbidden/);
  await rm(path.join(root, 'dist/leak'));
  await writeFile(path.join(root, 'dist/.env'), 'PUBLIC=ok');
  await assert.rejects(checkPrivacy({ root }), /forbidden/);
  await rm(path.join(root, 'dist/.env'));
  await symlink('../private/short', path.join(root, 'dist/link'));
  await assert.rejects(checkPrivacy({ root }), /symbolic link/);
});

test('allows only explicitly configured public web keys', async (t) => {
  const root = await fixture(t);
  const key = `AIza${'x'.repeat(35)}`;
  await writeFile(path.join(root, 'dist/app.js'), key);
  await assert.rejects(checkPrivacy({ root }), /forbidden/);
  assert.equal(await checkPrivacy({ root, allowedPublicKeys: [key] }), 1);
});
