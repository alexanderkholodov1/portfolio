import { createHash } from 'node:crypto';
import { access, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { list, extract } from 'tar';
import { checkPrivacy } from './privacy-check.mjs';

const archiveLimit = 32 * 1024 * 1024;
const unpackedLimit = 128 * 1024 * 1024;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function validateManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.games || Array.isArray(manifest.games) || !Object.keys(manifest.games).length) {
    throw new Error('Invalid games manifest');
  }
  for (const [game, pin] of Object.entries(manifest.games)) {
    if (!pin || typeof pin !== 'object' || !/^[a-z][a-z0-9-]*$/.test(game) || ['assets', 'fonts', 'es', 'projects', 'about', 'links', 'private'].includes(game) ||
        !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(pin.repository) ||
        !/^v\d+\.\d+\.\d+$/.test(pin.tag) || pin.artifact !== `${game}-dist-${pin.tag}.tar.gz`) {
      throw new Error('Invalid game release pin');
    }
  }
  return manifest.games;
}

export function verifyChecksum(bytes, sums, filename) {
  const matching = sums.split(/\r?\n/).filter((line) => line.slice(66) === filename);
  if (matching.length !== 1 || !/^[a-f0-9]{64} [ *]/.test(matching[0]) || matching[0].slice(0, 64) !== sha256(bytes)) {
    throw new Error(`Release checksum mismatch or missing entry: ${filename}`);
  }
}

async function download(url, limit) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { Accept: 'application/octet-stream' } });
  if (!response.ok) throw new Error(`Release download failed: HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error('Release download exceeds size limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function localFile(directory, filename, limit) {
  const file = path.join(directory, filename);
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > limit) throw new Error('Invalid local release file');
  return readFile(file);
}

export async function validateArchive(file) {
  const names = new Set();
  let size = 0;
  const invalid = [];
  await list({ file, strict: true, onReadEntry(entry) {
    const name = entry.path.replace(/^(\.\/)+/, '').replace(/\/$/, '');
    if (!name || name === '.') { if (entry.type !== 'Directory') invalid.push('root'); return; }
    size += entry.size;
    if (name.startsWith('/') || name.includes('\\') || /[\x00-\x1f\x7f]/.test(name) || name.split('/').some((part) => !part || part === '..' || part.startsWith('.')) ||
        !['File', 'Directory'].includes(entry.type) || names.has(name) || size > unpackedLimit || names.size >= 10000 ||
        /(^|\/)(private|node_modules)(\/|$)|service[-_]?account|firebase-adminsdk|\.(pem|key|p12|pfx)$/i.test(name)) {
      invalid.push('entry');
    }
    names.add(name);
  } });
  if (invalid.length) throw new Error('Unsafe or oversized release archive');
  if (!names.has('index.html') || !names.has('version.json')) throw new Error('Release archive is missing index.html or version.json');
}

export async function assembleGames({ root = process.cwd(), artifactDirectory = process.env.GAMES_ARTIFACT_DIR, allowDownload = process.env.GAME_DOWNLOADS === '1', allowedPublicKeys = [process.env.VITE_FIREBASE_API_KEY].filter(Boolean) } = {}) {
  const manifest = JSON.parse(await readFile(path.join(root, 'games.json'), 'utf8'));
  const games = validateManifest(manifest);
  // Network use is explicit. Missing local inputs never fall back to downloads.
  if (!artifactDirectory && !allowDownload) throw new Error('Game assembly needs GAMES_ARTIFACT_DIR for local archives or GAME_DOWNLOADS=1 for authorized release downloads');
  const dist = path.join(root, 'dist');
  await access(path.join(dist, 'index.html'));
  const receipt = { schemaVersion: 1, games: {} };
  for (const [game, pin] of Object.entries(games)) {
    const source = `https://github.com/${pin.repository}/releases/download/${pin.tag}`;
    const get = (filename, limit) => artifactDirectory
      ? localFile(path.resolve(artifactDirectory), filename, limit)
      : download(`${source}/${filename}`, limit);
    const archive = await get(pin.artifact, archiveLimit);
    const sums = (await get('SHA256SUMS', 64 * 1024)).toString('utf8');
    const metadata = await get('version.json', 16 * 1024);
    verifyChecksum(archive, sums, pin.artifact);
    verifyChecksum(metadata, sums, 'version.json');
    const scratch = await mkdtemp(path.join(dist, '.assembly-'));
    try {
      const archivePath = path.join(scratch, 'release.tar.gz');
      const output = path.join(scratch, 'output');
      await writeFile(archivePath, archive);
      await validateArchive(archivePath);
      await mkdir(output);
      await extract({ file: archivePath, cwd: output, strict: true, noChmod: true, noMtime: true });
      const packedMetadata = await readFile(path.join(output, 'version.json'));
      if (!metadata.equals(packedMetadata)) throw new Error('Archive and release version.json differ');
      const version = JSON.parse(metadata.toString('utf8'));
      if (version.version !== pin.tag.slice(1) || !/^[a-f0-9]{40}$/.test(version.commit) || !Number.isFinite(Date.parse(version.builtAt))) {
        throw new Error('Release metadata does not match the pinned version');
      }
      const html = await readFile(path.join(output, 'index.html'), 'utf8');
      if (!html.includes(`/${game}/assets/`)) throw new Error('Game HTML does not use its mounted asset base');
      await checkPrivacy({ root, dist: output, allowedPublicKeys });
      const destination = path.join(dist, game);
      await rm(destination, { recursive: true, force: true });
      await rename(output, destination);
      receipt.games[game] = { ...pin, sha256: sha256(archive), commit: version.commit, source: artifactDirectory ? 'local-rehearsal' : 'github-release' };
    } finally { await rm(scratch, { recursive: true, force: true }); }
  }
  await writeFile(path.join(dist, 'assembly.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const receipt = await assembleGames();
    for (const [game, entry] of Object.entries(receipt.games)) console.log(`Assembled ${game} ${entry.tag} (${entry.source})`);
  } catch (error) { console.error(`Game assembly failed: ${error.message}`); process.exitCode = 1; }
}
