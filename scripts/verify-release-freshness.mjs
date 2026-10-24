import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllReleases, isReleaseTag, pickLatestPublishedRelease } from './resolve-galaxy-release.mjs';

export async function evaluateReleaseFreshness({
  eventName,
  tag = '',
  repository = 'alexanderkholodov1/little-galaxy',
  token = process.env.GITHUB_TOKEN,
  fetchRelease = globalThis.fetch,
} = {}) {
  // Manual rollback or deployment via workflow_dispatch is an explicit operator action
  if (eventName === 'workflow_dispatch') {
    return { deploy: true, reason: 'manual-workflow-dispatch', tag };
  }

  // Push to main resolved latest at build time and is authorized to deploy
  if (eventName === 'push') {
    return { deploy: true, reason: 'main-push', tag: '' };
  }

  // Repository dispatch must check against the globally newest published release
  if (eventName === 'repository_dispatch') {
    if (!tag || !isReleaseTag(tag)) {
      throw new Error(`Cannot verify release freshness: invalid dispatch tag "${tag}"`);
    }

    const allReleases = await fetchAllReleases(repository, { token, fetchRelease });
    const latest = pickLatestPublishedRelease(allReleases);
    const target = allReleases.find((r) => r.tag_name === tag && !r.draft && r.published_at);

    if (!target) {
      throw new Error(`Cannot verify release freshness: release "${tag}" was not found or has no publication timestamp`);
    }

    const targetTime = new Date(target.published_at).getTime();
    const latestTime = new Date(latest.published_at).getTime();

    if (target.tag_name === latest.tag_name || targetTime >= latestTime) {
      return {
        deploy: true,
        reason: 'newest-published-release',
        tag,
        latestTag: latest.tag_name,
        targetPublishedAt: target.published_at,
        latestPublishedAt: latest.published_at,
      };
    }

    return {
      deploy: false,
      superseded: true,
      reason: 'superseded-by-newer-release',
      tag,
      latestTag: latest.tag_name,
      targetPublishedAt: target.published_at,
      latestPublishedAt: latest.published_at,
    };
  }

  // Non-production events (pull_request, etc.) do not deploy production
  return { deploy: false, reason: 'non-production-event', tag };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME || process.env.EVENT_NAME || '';
    const tag = process.env.GALAXY_TAG || '';
    const token = process.env.GITHUB_TOKEN;

    const manifest = JSON.parse(await readFile('games.json', 'utf8'));
    const repository = manifest.games?.galaxy?.repository ?? 'alexanderkholodov1/little-galaxy';

    const result = await evaluateReleaseFreshness({ eventName, tag, repository, token });

    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, `deploy=${result.deploy}\n`);
      if (result.superseded) {
        await appendFile(process.env.GITHUB_OUTPUT, `superseded=true\n`);
      }
    }

    if (result.deploy) {
      console.log(`Release freshness verified for ${eventName}: deploy authorized (${result.reason}, tag: "${result.tag || 'latest'}")`);
    } else if (result.superseded) {
      console.log(`[FRESHNESS] Dispatched release "${result.tag}" (published ${result.targetPublishedAt}) was superseded by newer published release "${result.latestTag}" (published ${result.latestPublishedAt}). Skipping production deployment (newest published wins).`);
    } else {
      console.log(`Release freshness check: production deploy not authorized for event ${eventName}`);
    }
  } catch (error) {
    console.error(`Release freshness check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
