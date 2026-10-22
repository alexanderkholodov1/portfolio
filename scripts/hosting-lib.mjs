import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { promisify } from 'node:util';

export const PROJECT = 'alexanderkholodov';
export const SITE = 'alexanderkholodov';
export const LIVE_ORIGIN = `https://${SITE}.web.app`;
const API = 'https://firebasehosting.googleapis.com/v1beta1';
const run = promisify(execFile);

// Minimal flag parser: `--name value`, `--name=value` or boolean `--name`.
export function parseArgs(argv, { booleans = [], strings = [] }) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[i]);
    if (!match) throw new Error(`Unexpected argument: ${argv[i]}`);
    const [, name, inline] = match;
    if (booleans.includes(name)) flags[name] = true;
    else if (strings.includes(name)) {
      const value = inline ?? argv[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`--${name} needs a value`);
      flags[name] = value;
    } else throw new Error(`Unknown flag: --${name}`);
  }
  return flags;
}

// Credentials are only ever a path in GOOGLE_APPLICATION_CREDENTIALS. The file
// is never opened here; it must live outside the repository or under private/.
export function checkCredentials(env, root, exists = existsSync) {
  const file = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!file) throw new Error('GOOGLE_APPLICATION_CREDENTIALS must point to a service-account file outside the repository or in private/');
  const resolved = path.resolve(file);
  const relative = path.relative(path.resolve(root), resolved);
  const inside = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  if (inside && !relative.startsWith(`private${path.sep}`)) throw new Error('Credentials inside the repository must be under private/');
  if (!exists(resolved)) throw new Error('GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist');
}

// Runs the pinned firebase CLI. Output is returned to the caller, never echoed.
export function firebaseRunner(root) {
  const bin = path.join(root, 'node_modules/.bin/firebase');
  return async (args) => (await run(bin, [...args, '--project', PROJECT, '--non-interactive'], { cwd: root, env: process.env, maxBuffer: 16 * 1024 * 1024 })).stdout;
}

export async function confirm({ yes, phrase, ask, interactive = process.stdin.isTTY }) {
  if (yes) return true;
  if (!ask && !interactive) throw new Error(`Not a terminal: pass --yes to confirm without typing "${phrase}"`);
  if (ask) return (await ask(`Type "${phrase}" to continue: `)).trim() === phrase;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(`Type "${phrase}" to continue: `)).trim() === phrase; } finally { rl.close(); }
}

// Hosting REST client. `token` resolves an OAuth access token for the service account.
export function restClient({ fetch = globalThis.fetch, token }) {
  const call = async (method, url, body) => {
    const response = await fetch(url, {
      method,
      signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Hosting API ${method} failed: HTTP ${response.status}`);
    return response.json();
  };
  return { get: (resource, query = '') => call('GET', `${API}/${resource}${query}`), post: (resource, query, body) => call('POST', `${API}/${resource}${query}`, body) };
}

export async function googleToken() {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  return async () => (await auth.getAccessToken());
}

const liveChannel = `projects/${PROJECT}/sites/${SITE}/channels/live`;

export async function listLiveReleases(rest) {
  return (await rest.get(`${liveChannel}/releases`, '?pageSize=25')).releases ?? [];
}

// Releases arrive newest first. The previous one is the newest release whose
// version differs from the one serving now.
export function pickRollbackTarget(releases) {
  const [current, ...older] = releases;
  if (!current?.version?.name) throw new Error('No live release found');
  const target = older.find((release) => release.version?.name && release.version.name !== current.version.name && (release.version.status ?? 'FINALIZED') === 'FINALIZED');
  if (!target) throw new Error('No previous release to roll back to');
  return { current, target };
}

export async function releaseLive(rest, versionName, message) {
  return rest.post(`${liveChannel}/releases`, `?versionName=${encodeURIComponent(versionName)}`, { message });
}

export const versionId = (name) => name.split('/').at(-1);

export const ROLLBACK_HINT = 'CI path: revert the games.json pin (git revert the commit that changed it) and merge; the main workflow redeploys the previous game release.';
