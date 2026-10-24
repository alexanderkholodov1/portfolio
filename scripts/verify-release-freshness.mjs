import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllReleases, isReleaseTag, pickLatestPublishedRelease } from './resolve-galaxy-release.mjs';

export async function evaluateReleaseFreshness({
  eventName,
  tag = '',
  inputTag = '',
  assemblyReceipt = null,
  assemblyPath = 'dist/assembly.json',
  repository = 'alexanderkholodov1/little-galaxy',
  token = process.env.GITHUB_TOKEN,
  fetchRelease = globalThis.fetch,
} = {}) {
  // Non-production events (pull_request, etc.) do not deploy production
  if (eventName === 'pull_request') {
    return { deploy: false, reason: 'non-production-event', tag };
  }

  // Manual rollback or deployment via workflow_dispatch with an explicit tag is an operator override
  if (eventName === 'workflow_dispatch') {
    const manualTag = inputTag || tag;
    if (manualTag) {
      if (!isReleaseTag(manualTag)) {
        throw new Error(`Cannot verify release freshness: invalid manual tag "${manualTag}"`);
      }
      return { deploy: true, reason: 'manual-workflow-dispatch', tag: manualTag };
    }
  }

  // Determine target release tag to evaluate for freshness
  let targetTag = '';
  if (eventName === 'repository_dispatch') {
    if (!tag || !isReleaseTag(tag)) {
      throw new Error(`Cannot verify release freshness: invalid dispatch tag "${tag}"`);
    }
    targetTag = tag;
  } else if (eventName === 'push' || eventName === 'workflow_dispatch') {
    targetTag = tag || assemblyReceipt?.games?.galaxy?.tag || '';
    if (!targetTag) {
      try {
        const receipt = JSON.parse(await readFile(assemblyPath, 'utf8'));
        targetTag = receipt.games?.galaxy?.tag || '';
      } catch (err) {
        throw new Error(`Cannot verify release freshness: assembled release tag not found in "${assemblyPath}" (${err.message})`, { cause: err });
      }
    }
    if (!targetTag || !isReleaseTag(targetTag)) {
      throw new Error(`Cannot verify release freshness: invalid release tag "${targetTag}"`);
    }
  } else {
    return { deploy: false, reason: 'non-production-event', tag };
  }

  // Re-resolve the latest published galaxy release from GitHub
  const allReleases = await fetchAllReleases(repository, { token, fetchRelease });
  const latest = pickLatestPublishedRelease(allReleases);
  const target = allReleases.find((r) => r.tag_name === targetTag && !r.draft && r.published_at);

  if (!target) {
    throw new Error(`Cannot verify release freshness: release "${targetTag}" was not found or has no publication timestamp`);
  }

  const targetTime = new Date(target.published_at).getTime();
  const latestTime = new Date(latest.published_at).getTime();

  if (target.tag_name === latest.tag_name || targetTime >= latestTime) {
    return {
      deploy: true,
      reason: 'newest-published-release',
      tag: targetTag,
      latestTag: latest.tag_name,
      targetPublishedAt: target.published_at,
      latestPublishedAt: latest.published_at,
    };
  }

  return {
    deploy: false,
    superseded: true,
    reason: 'superseded-by-newer-release',
    tag: targetTag,
    latestTag: latest.tag_name,
    targetPublishedAt: target.published_at,
    latestPublishedAt: latest.published_at,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME || process.env.EVENT_NAME || '';
    const tag = process.env.GALAXY_TAG || '';
    const inputTag = process.env.INPUT_GALAXY_TAG || '';
    const token = process.env.GITHUB_TOKEN;
    const assemblyPath = process.env.GAMES_ASSEMBLY_PATH || 'dist/assembly.json';

    const manifest = JSON.parse(await readFile('games.json', 'utf8'));
    const repository = manifest.games?.galaxy?.repository ?? 'alexanderkholodov1/little-galaxy';

    let fetchRelease = globalThis.fetch;
    if (process.env.PORTFOLIO_RELEASES_FIXTURE) {
      const fixtureData = await readFile(process.env.PORTFOLIO_RELEASES_FIXTURE, 'utf8');
      fetchRelease = async () => new Response(fixtureData, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await evaluateReleaseFreshness({
      eventName,
      tag,
      inputTag,
      assemblyPath,
      repository,
      token,
      fetchRelease,
    });

    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, `deploy=${result.deploy}\n`);
      if (result.superseded) {
        await appendFile(process.env.GITHUB_OUTPUT, `superseded=true\n`);
      }
    }

    if (result.deploy) {
      console.log(`Release freshness verified for ${eventName}: deploy authorized (${result.reason}, tag: "${result.tag || 'latest'}")`);
    } else if (result.superseded) {
      console.log(`[FRESHNESS] Assembled release "${result.tag}" (published ${result.targetPublishedAt}) was superseded by newer published release "${result.latestTag}" (published ${result.latestPublishedAt}). Skipping production deployment (newest published wins).`);
    } else {
      console.log(`Release freshness check: production deploy not authorized for event ${eventName}`);
    }
  } catch (error) {
    console.error(`Release freshness check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
