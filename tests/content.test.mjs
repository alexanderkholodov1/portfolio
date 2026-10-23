import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as content from '../src/data/content.ts';
import { collectTodos } from '../src/data/todo.ts';

test('every pending item is reported with a path and a P3 description', () => {
  const todos = collectTodos();
  assert.ok(todos.length > 0);
  for (const { path, needed } of todos) {
    assert.ok(path.length > 0);
    assert.match(needed, /^P3: .{20,}/, path);
  }
  const paths = todos.map((todo) => todo.path);
  for (const expected of ['profile.cv', 'projects', 'projects.items[0].image']) {
    assert.ok(paths.includes(expected), expected);
  }
  for (const filled of ['profile.role', 'profile.bio', 'links', 'socials', 'projects.items[0].role', 'projects.items[0].stack', 'projects.items[0].dates']) {
    assert.ok(!paths.includes(filled), `${filled} should be filled`);
  }
});

test('the collector finds a nested pending value and ignores filled ones', () => {
  const found = collectTodos({ a: { b: content.todo('P3: nested thing needed, for the test') }, c: { en: 'x', es: 'y' }, list: { items: [], todo: null } });
  assert.deepEqual(found, [{ path: 'a.b', needed: 'P3: nested thing needed, for the test' }]);
});

test('filled content is bilingual and links are public and safe', () => {
  const bilingual = (value) => assert.ok(value.en.trim() && value.es.trim());
  for (const project of content.projects.items) { bilingual(project.title); bilingual(project.pitch); bilingual(project.context); }
  for (const link of content.links.items) {
    bilingual(link.label);
    assert.match(link.href, /^(\/[^/]|\/$|https:\/\/)/);
    assert.ok(!/alexanderkholodov1\/portfolio(?![\w-])/.test(link.href), 'the portfolio repository is private');
  }
  assert.equal(content.profile.name, 'Alexander Kholodov');
  bilingual(content.profile.role);
  bilingual(content.profile.bio);
});
