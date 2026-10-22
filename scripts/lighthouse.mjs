// Reproducible local Lighthouse run (mobile emulation, Lighthouse defaults) against `astro preview`
// of the built site. Usage: pnpm run build:site && pnpm run lighthouse
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const port = 4322;
const origin = `http://127.0.0.1:${port}`;
const routes = ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/'];
const pages = ['', '/es'].flatMap((prefix) => routes.map((route) => `${prefix}${route}`.replace('//', '/')));
const minimum = 95;
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

spawnSync('pnpm', ['exec', 'astro', 'preview', 'stop'], { stdio: 'ignore' }); // never reuse a stale server
const preview = spawn('pnpm', ['exec', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
// Astro 7 runs `preview` as a background daemon that outlives this process: stop it explicitly.
const stop = () => { preview.kill('SIGTERM'); spawnSync('pnpm', ['exec', 'astro', 'preview', 'stop'], { stdio: 'ignore' }); };
process.on('exit', stop);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stop(); process.exit(1); });

for (let attempt = 0; ; attempt++) {
  try { if ((await fetch(origin)).ok) break; } catch { /* preview is starting */ }
  if (attempt > 50) { stop(); throw new Error('astro preview did not start (run `pnpm run build:site` first)'); }
  await new Promise((resolve) => setTimeout(resolve, 200));
}

// Playwright's own headless Chromium, with its DevTools port exposed to Lighthouse.
const debuggingPort = 9333;
const chrome = await chromium.launch({ args: [`--remote-debugging-port=${debuggingPort}`] });
let failed = false;
console.log(`Lighthouse ${minimum}+ required, mobile emulation, ${origin}`);
console.log(`${'page'.padEnd(26)}${categories.map((name) => name.slice(0, 5).padStart(7)).join('')}`);
try {
  for (const route of pages) {
    const { lhr } = await lighthouse(`${origin}${route}`, { port: debuggingPort, output: 'json', logLevel: 'error', onlyCategories: categories });
    const scores = categories.map((name) => Math.round((lhr.categories[name].score ?? 0) * 100));
    if (scores.some((score) => score < minimum)) failed = true;
    console.log(`${route.padEnd(26)}${scores.map((score) => String(score).padStart(7)).join('')}${scores.some((score) => score < minimum) ? '  FAIL' : ''}`);
  }
} finally {
  await chrome.close();
  stop();
}
if (failed) { console.error(`Some pages scored below ${minimum}`); process.exitCode = 1; }
