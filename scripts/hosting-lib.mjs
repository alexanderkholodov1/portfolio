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

// Minimal flag parser: `--name value`, `--name=value` for strings; booleans are presence-only
// and reject any inline value, so `--yes=false` is an error instead of an authorization.
export function parseArgs(argv, { booleans = [], strings = [] }) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[i]);
    if (!match) throw new Error(`Unexpected argument: ${argv[i]}`);
    const [, name, inline] = match;
    if (booleans.includes(name)) {
      if (inline !== undefined) throw new Error(`--${name} takes no value (got "${inline}"); omit the flag to leave it off`);
      flags[name] = true;
    } else if (strings.includes(name)) {
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
const versionPattern = new RegExp(`^projects/[^/]+/sites/${SITE}/versions/[^/]+$`);
const MAX_PAGES = 20;

// The channel resource carries the authoritative current release.
export async function getCurrentRelease(rest, channel = 'live') {
  const release = (await rest.get(`projects/${PROJECT}/sites/${SITE}/channels/${channel}`)).release;
  if (!release?.version?.name || !versionPattern.test(release.version.name)) throw new Error(`The ${channel} channel reports no release`);
  return release;
}

// Every page of the channel's release history. The API documents no ordering, so none is assumed.
export async function listLiveReleases(rest) {
  const releases = [];
  let token = '';
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await rest.get(`${liveChannel}/releases`, `?pageSize=100${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`);
    releases.push(...(response.releases ?? []));
    token = response.nextPageToken ?? '';
    if (!token) return releases;
  }
  throw new Error(`Release history has more than ${MAX_PAGES} pages; refusing to guess`);
}

// The previous release is the newest other, finalized version released no later than the current one.
// Candidates are ordered by their validated releaseTime, never by response order.
export function pickRollbackTarget(current, releases) {
  if (!current?.version?.name) throw new Error('No live release found');
  const currentTime = Date.parse(current.releaseTime);
  const candidates = releases
    .filter((release) => versionPattern.test(release.version?.name ?? '') && release.version.status === 'FINALIZED' && release.type !== 'SITE_DISABLE' && Number.isFinite(Date.parse(release.releaseTime)))
    .filter((release) => !Number.isFinite(currentTime) || Date.parse(release.releaseTime) <= currentTime)
    .sort((a, b) => Date.parse(b.releaseTime) - Date.parse(a.releaseTime));
  const target = candidates.find((release) => release.version.name !== current.version.name);
  if (!target) throw new Error('No previous release to roll back to');
  return { current, target };
}

export async function releaseLive(rest, versionName, message) {
  return rest.post(`${liveChannel}/releases`, `?versionName=${encodeURIComponent(versionName)}`, { message });
}

// Re-reads the live release and the target version right before the write.
export async function revalidateRollback(rest, current, target) {
  const now = await getCurrentRelease(rest);
  if (now.version.name !== current.version.name) throw new Error('The live release changed while waiting; nothing was written. Run the rollback again.');
  const version = await rest.get(target.version.name);
  if (version.status !== 'FINALIZED') throw new Error(`Version ${versionId(target.version.name)} is no longer available (${version.status ?? 'unknown status'}); nothing was written.`);
}

export const versionId = (name) => name.split('/').at(-1);

export const ROLLBACK_HINT = 'CI path: run the portfolio workflow on main with galaxy_tag set to a known-good release. This deploy-only override expires on the next latest deploy.';
