// The motion budget, checked in the source: every keyframed animation runs on the compositor (transform and
// opacity only), so a loop never repaints the page. A looping box-shadow on one small dot made the whole home repaint
// 60 times a second (measured 2026-11-18). Names are unique (a second @keyframes silently replaces the first) and
// every one is used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const css = readFileSync(new URL('../src/styles/site.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)].map(([, name, body]) => ({ name, body }));
const COMPOSITED = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate']);

test('every keyframed animation changes only transform, translate, scale, rotate or opacity', () => {
  assert.ok(keyframes.length > 20);
  for (const { name, body } of keyframes) {
    const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
    const painted = props.filter((p) => !COMPOSITED.has(p) && p !== 'animation-timing-function');
    assert.deepEqual(painted, [], `@keyframes ${name} animates ${painted.join(', ')}, which repaints every frame`);
  }
});

test('keyframe names are unique and every one is used', () => {
  const names = keyframes.map((k) => k.name);
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], 'a repeated @keyframes replaces the earlier one');
  const rules = css.replace(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, '');
  const used = new Set([...rules.matchAll(/animation(?:-name)?\s*:([^;}]*)/g)].flatMap((m) => m[1].split(/[\s,()]+/)));
  const files = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' }).split('\n').filter((f) => /\.(astro|ts)$/.test(f));
  for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/animation[^;"'`]*/g)) for (const t of m[0].split(/[\s,():]+/)) used.add(t);
  assert.deepEqual(names.filter((n) => !used.has(n)), [], 'unused @keyframes');
});
