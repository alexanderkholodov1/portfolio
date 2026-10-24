import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deployLocal } from './deploy-local.mjs';
import { PROJECT, ROLLBACK_HINT, SITE, checkCredentials, confirm, getCurrentRelease, googleToken, listLiveReleases, parseArgs, pickRollbackTarget, releaseLive, restClient, revalidateRollback, versionId } from './hosting-lib.mjs';

const describe = (release) => `${versionId(release.version.name)} (released ${release.releaseTime ?? 'unknown time'}${release.version.fileCount ? `, ${release.version.fileCount} files` : ''})`;

export async function rollback(argv, { env = process.env, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), log = console.log, rest, ask, exists, deploy = deployLocal } = {}) {
  const flags = parseArgs(argv, { booleans: ['yes', 'yes-preview', 'dry-run'], strings: ['galaxy-tag'] });
  if (flags['galaxy-tag']) {
    return deploy(['--release', '--galaxy-tag', flags['galaxy-tag'], ...['yes', 'yes-preview', 'dry-run'].filter((flag) => flags[flag]).map((flag) => `--${flag}`)], { env, root, log, ask, exists });
  }
  if (flags['dry-run']) {
    log(`[dry-run] would require GOOGLE_APPLICATION_CREDENTIALS (outside the repository or in private/)`);
    log(`[dry-run] GET ${PROJECT}/${SITE} live channel (current release) and its releases (all pages, ordered by releaseTime)`);
    log('[dry-run] would show the live version and the previous version, then ask for the word "rollback" (or --yes)');
    log(`[dry-run] POST live channel release with versionName = previous version`);
    log(ROLLBACK_HINT);
    return { dryRun: true };
  }
  checkCredentials(env, root, exists);
  rest ??= restClient({ token: await googleToken() });
  const current = await getCurrentRelease(rest);
  const { target } = pickRollbackTarget(current, await listLiveReleases(rest));
  log(`Live now:        ${describe(current)}`);
  log(`Will become live: ${describe(target)}`);
  if (!await confirm({ yes: flags.yes, phrase: 'rollback', ask })) { log('Aborted. Nothing changed.'); return { aborted: true }; }
  await revalidateRollback(rest, current, target);
  const release = await releaseLive(rest, target.version.name, `Rollback to ${versionId(target.version.name)}`);
  log(`Rolled back: version ${versionId(target.version.name)} is live (release ${versionId(release.name ?? 'unknown')}).`);
  log(ROLLBACK_HINT);
  return { rolledBackTo: target.version.name };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await rollback(process.argv.slice(2)); } catch (error) { console.error(`Rollback failed: ${error.message}`); process.exitCode = 1; }
}
