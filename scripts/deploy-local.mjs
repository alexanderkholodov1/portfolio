import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assembleGames } from './assemble-games.mjs';
import { LIVE_ORIGIN, PROJECT, ROLLBACK_HINT, SITE, checkCredentials, confirm, firebaseRunner, parseArgs } from './hosting-lib.mjs';
import { checkPrivacy } from './privacy-check.mjs';

const channelPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;
const smokePaths = ['/', '/es/', '/links/', '/galaxy/', '/galaxy/version.json'];

// Streams a build command to the terminal; rejects on a non-zero exit.
function inherit(command, args, { cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
  });
}

// HTTP 200 for the key routes and the expected galaxy version in version.json.
export async function smokeCheck(origin, expectedVersion, fetch = globalThis.fetch) {
  const failures = [];
  for (const route of smokePaths) {
    try {
      const response = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(30_000), headers: { 'Cache-Control': 'no-cache' } });
      if (response.status !== 200) { failures.push(`${route}: HTTP ${response.status}`); continue; }
      if (route === '/galaxy/version.json') {
        const { version } = await response.json();
        if (version !== expectedVersion) failures.push(`${route}: version ${version}, expected ${expectedVersion}`);
      }
    } catch (error) { failures.push(`${route}: ${error.message}`); }
  }
  return failures;
}

export async function deployLocal(argv, deps = {}) {
  const root = deps.root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const exec = deps.exec ?? inherit;
  const firebase = deps.firebase ?? firebaseRunner(root);
  const assemble = deps.assemble ?? assembleGames;
  const flags = parseArgs(argv, {
    booleans: ['yes', 'dry-run', 'no-smoke', 'skip-galaxy-build'],
    strings: ['galaxy', 'galaxy-dist', 'artifact-dir', 'channel', 'expires'],
  });
  const artifactDirectory = flags['artifact-dir'] ?? env.GAMES_ARTIFACT_DIR;
  const galaxyDir = path.resolve(root, flags.galaxy ?? env.GALAXY_DIR ?? '../little-galaxy');
  const galaxyDist = path.resolve(galaxyDir, flags['galaxy-dist'] ?? 'apps/web/dist');
  const channel = flags.channel ?? `local-${new Date().toISOString().replace(/\D/g, '').slice(0, 12)}`;
  const expires = flags.expires ?? '1d';
  if (!channelPattern.test(channel) || channel === 'live') throw new Error('Invalid channel id');
  if (!/^\d+[hd]$/.test(expires)) throw new Error('--expires must look like 12h or 2d');
  const clone = ['hosting:clone', `${SITE}:${channel}`, `${SITE}:live`];
  const deploy = ['hosting:channel:deploy', channel, '--expires', expires, '--json'];
  const galaxyStep = artifactDirectory
    ? `take the pinned release artifact from ${path.resolve(artifactDirectory)}`
    : `${flags['skip-galaxy-build'] ? 'use the existing' : 'build'} galaxy in ${galaxyDir} (pnpm run build), assemble ${galaxyDist} as a local build`;

  if (flags['dry-run']) {
    const steps = [
      'pnpm run build:site (Astro build + privacy gate)',
      galaxyStep,
      'assemble into dist/galaxy with the release checks and privacy gate; dist/assembly.json source = ' + (artifactDirectory ? 'local-rehearsal' : 'local-build'),
      'privacy gate over the whole dist/',
      `require GOOGLE_APPLICATION_CREDENTIALS outside the repository or in private/`,
      `firebase ${deploy.join(' ')} --project ${PROJECT}`,
      flags['no-smoke'] ? 'skip the smoke check' : `smoke check ${smokePaths.join(' ')} on the preview URL; expected galaxy version from dist/galaxy/version.json`,
      flags.yes ? 'promote without asking (--yes), only if the smoke check passed' : 'ask for the word "promote"',
      `firebase ${clone.join(' ')} --project ${PROJECT}`,
      `smoke check ${LIVE_ORIGIN}`,
    ];
    steps.forEach((step, index) => log(`[dry-run] ${index + 1}. ${step}`));
    log('[dry-run] no build was run and no network call was made.');
    return { dryRun: true };
  }

  checkCredentials(env, root, deps.exists);
  log(`Building the portfolio`);
  await exec('pnpm', ['run', 'build:site'], { cwd: root, env });
  const options = { root };
  if (artifactDirectory) options.artifactDirectory = artifactDirectory;
  else {
    if (!flags['skip-galaxy-build']) {
      log(`Building galaxy in ${galaxyDir}`);
      await exec('pnpm', ['run', 'build'], { cwd: galaxyDir, env });
    }
    options.artifactDirectory = '';
    options.localBuilds = { galaxy: galaxyDist };
  }
  const receipt = await assemble(options);
  const galaxyEntry = receipt.games.galaxy;
  log(`Assembled galaxy ${galaxyEntry.tag} (${galaxyEntry.source}) commit ${galaxyEntry.commit.slice(0, 12)}`);
  await (deps.privacy ?? checkPrivacy)({ root, allowedPublicKeys: [env.VITE_FIREBASE_API_KEY].filter(Boolean) });
  const expectedVersion = JSON.parse(await readFile(path.join(root, 'dist/galaxy/version.json'), 'utf8')).version;

  log(`Deploying preview channel ${channel}`);
  const output = await firebase(deploy);
  const parsed = JSON.parse(output);
  const previewUrl = parsed.result?.[SITE]?.url;
  if (!previewUrl || !previewUrl.startsWith('https://')) throw new Error('The preview channel deploy returned no URL');
  log(`Preview: ${previewUrl}`);

  let failures = [];
  if (!flags['no-smoke']) {
    failures = await smokeCheck(previewUrl.replace(/\/$/, ''), expectedVersion, deps.fetch);
    if (failures.length) failures.forEach((failure) => log(`Smoke check failed: ${failure}`));
    else log(`Smoke check passed (galaxy ${expectedVersion})`);
  }
  if (failures.length) { log('Not promoting. The preview stays up until it expires.'); process.exitCode = 1; return { previewUrl, promoted: false }; }

  if (!await confirm({ yes: flags.yes, phrase: 'promote', ask: deps.ask })) { log('Not promoted. The preview stays up until it expires.'); return { previewUrl, promoted: false }; }
  await firebase(clone);
  log(`Promoted ${channel} to live. The tested preview version is now serving ${LIVE_ORIGIN}`);
  if (!flags['no-smoke']) {
    const live = await smokeCheck(LIVE_ORIGIN, expectedVersion, deps.fetch);
    log(live.length ? `Live smoke check reported: ${live.join('; ')}` : 'Live smoke check passed');
    if (live.length) process.exitCode = 1;
  }
  log(`To undo: pnpm run rollback. ${ROLLBACK_HINT}`);
  return { previewUrl, promoted: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await deployLocal(process.argv.slice(2)); } catch (error) { console.error(`Local deploy failed: ${error.message}`); process.exitCode = 1; }
}
