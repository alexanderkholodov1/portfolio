import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A valid release tag starts with 'v', followed by major.minor.patch,
// and optionally a prerelease suffix like '-alpha.1' or '-rc.2'.
export const isReleaseTag = (tag) => typeof tag === 'string' && /^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(tag);

export function parseNextPageUrl(linkHeader) {
  if (!linkHeader || typeof linkHeader !== 'string') return null;
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/i);
    if (match && match[2].toLowerCase() === 'next') {
      return match[1].trim();
    }
  }
  return null;
}

async function localFile(dir, file, maxBytes) {
  const target = path.join(dir, file);
  const data = await readFile(target);
  if (data.length > maxBytes) throw new Error(`File too large: ${file}`);
  return data;
}

export function pickLatestPublishedRelease(releases, game = 'galaxy') {
  if (!Array.isArray(releases)) {
    throw new Error(`Invalid published ${game} releases response`);
  }
  // Drafts are never published. Pre-releases (such as alpha tags) ARE included.
  const valid = releases.filter((r) => !r.draft && isReleaseTag(r.tag_name) && r.published_at);
  if (valid.length === 0) {
    throw new Error(`Invalid published ${game} release: no published releases found`);
  }
  // Sort strictly by published_at timestamp descending (newest published first),
  // never by semver (which would erroneously prioritize older v1.0.1 over newer v1.0.0-alpha.N).
  valid.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return valid[0];
}

export async function fetchAllReleases(repository, {
  token = process.env.GITHUB_TOKEN,
  fetchRelease = globalThis.fetch,
  maxPages = 20,
} = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let url = `https://api.github.com/repos/${repository}/releases?per_page=50`;
  const allReleases = [];
  let pages = 0;
  while (url) {
    pages++;
    if (pages > maxPages) {
      throw new Error(`Cannot resolve galaxy releases: release history has more than ${maxPages} pages; refusing to guess`);
    }
    let response;
    try {
      response = await fetchRelease(url, { signal: AbortSignal.timeout(60_000), headers });
    } catch (error) {
      throw new Error(`Cannot resolve galaxy releases: ${error.message}`, { cause: error });
    }
    if (!response.ok) {
      throw new Error(`Cannot resolve galaxy releases: HTTP ${response.status}; no fallback release will be used`);
    }
    const releases = await response.json();
    if (!Array.isArray(releases)) {
      throw new Error('Invalid published galaxy releases response');
    }
    allReleases.push(...releases);
    const linkHeader = response.headers?.get?.('link') ?? response.headers?.link ?? null;
    url = parseNextPageUrl(linkHeader);
  }
  return allReleases;
}

// Resolve once per build. An unavailable release is fatal; never reuse an old receipt.
export async function resolveGameRelease(game, selection, {
  galaxyTag = '',
  token = process.env.GITHUB_TOKEN,
  fetchRelease = globalThis.fetch,
  artifactDirectory,
} = {}) {
  if (galaxyTag && !isReleaseTag(galaxyTag)) {
    throw new Error('GALAXY_TAG must be a release tag like v1.2.3 or v1.0.0-alpha.1');
  }
  const requested = game === 'galaxy' && galaxyTag ? galaxyTag : selection.tag;
  let tag = requested;

  if (artifactDirectory) {
    // Offline rehearsals resolve only their explicitly supplied metadata, never the network.
    if (requested === 'latest') {
      const metadata = JSON.parse((await localFile(path.resolve(artifactDirectory), 'version.json', 16 * 1024)).toString('utf8'));
      tag = `v${metadata.version}`;
    }
  } else {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (requested === 'latest') {
      const allReleases = await fetchAllReleases(selection.repository, { token, fetchRelease });
      const latestRelease = pickLatestPublishedRelease(allReleases, game);
      tag = latestRelease.tag_name;
    } else {
      const url = `https://api.github.com/repos/${selection.repository}/releases/tags/${requested}`;
      let response;
      try {
        response = await fetchRelease(url, { signal: AbortSignal.timeout(60_000), headers });
      } catch (error) {
        throw new Error(`Cannot resolve ${game} release ${requested}: ${error.message}`, { cause: error });
      }
      if (!response.ok) {
        throw new Error(`Cannot resolve ${game} release ${requested}: HTTP ${response.status}; no fallback release will be used`);
      }
      const release = await response.json();
      tag = release.tag_name;
      if (release.draft || tag !== requested) {
        throw new Error(`Invalid published ${game} release for ${requested}`);
      }
    }
  }

  if (!isReleaseTag(tag)) {
    throw new Error(`Invalid resolved ${game} release tag: ${tag}`);
  }
  return { repository: selection.repository, tag, artifact: `${game}-dist-${tag}.tar.gz` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const args = process.argv.slice(2);
    let tag = process.env.GALAXY_TAG ?? '';
    let json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--tag' && args[i + 1]) tag = args[++i];
      else if (args[i] === '--json') json = true;
    }
    const manifest = JSON.parse(await readFile('games.json', 'utf8'));
    const selection = manifest.games?.galaxy ?? { repository: 'alexanderkholodov1/little-galaxy', tag: 'latest' };
    const resolved = await resolveGameRelease('galaxy', selection, { galaxyTag: tag });
    if (json) {
      console.log(JSON.stringify(resolved, null, 2));
    } else {
      console.log(resolved.tag);
    }
  } catch (error) {
    console.error(`Release resolution failed: ${error.message}`);
    process.exitCode = 1;
  }
}
