import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const forbiddenPath = /(^|\/)(private|node_modules|\.git|\.env(?:\..*)?)(\/|$)|\.(pem|key|p12|pfx)$|service[-_]?account|firebase-adminsdk/i;
const keyMaterial = /-----BEGIN [A-Z\d ]*PRIVATE KEY-----|["'](?:private_key|private_key_id|client_email|refresh_token|access_token)["']\s*:|\b(?:gh[pousr]_[A-Za-z\d]{20,}|github_pat_[A-Za-z\d_]{20,}|AIza[A-Za-z\d_-]{30,})/;

async function files(directory, optional = false) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (optional && error.code === 'ENOENT') return []; throw error; }
  const result = [];
  for (const entry of entries) {
    const name = path.join(directory, entry.name);
    const stat = await lstat(name);
    if (stat.isSymbolicLink()) throw new Error('Privacy gate: symbolic link in scanned tree');
    if (stat.isDirectory()) result.push(...await files(name));
    else if (stat.isFile()) result.push(name);
    else throw new Error('Privacy gate: unsupported file in scanned tree');
  }
  return result;
}

export async function checkPrivacy({ root = process.cwd(), dist = path.join(root, 'dist'), allowedPublicKeys = [] } = {}) {
  // Do not log private names, bytes, hashes or matched values. Private data is
  // used only for comparisons; it never enters an output or a build manifest.
  const privateFiles = await files(path.join(root, 'private'), true);
  const privateHashes = new Set();
  const privateValues = [];
  for (const file of privateFiles) {
    const bytes = await readFile(file);
    privateHashes.add(digest(bytes));
    if (bytes.length >= 16) privateValues.push(bytes);
    try {
      const parsed = JSON.parse(bytes.toString('utf8'));
      const collect = (value) => {
        if (typeof value === 'string' && value.length >= 16) privateValues.push(Buffer.from(value));
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
      };
      collect(parsed);
    } catch { /* Binary and non-JSON files are compared as complete bytes. */ }
  }
  const output = await files(dist);
  if (!output.length) throw new Error('Privacy gate: output is empty');
  for (const file of output) {
    const relative = path.relative(dist, file).split(path.sep).join('/');
    const bytes = await readFile(file);
    let text = bytes.toString('utf8');
    // Only exact, explicit Firebase web keys may be public. Never strip other
    // material, including PEM or service-account fields.
    for (const key of allowedPublicKeys) {
      if (/^AIza[A-Za-z\d_-]{30,}$/.test(key)) text = text.split(key).join('PUBLIC_FIREBASE_WEB_KEY');
    }
    if (forbiddenPath.test(relative) || privateHashes.has(digest(bytes)) ||
        privateValues.some((value) => bytes.includes(value) || text.includes(JSON.stringify(value.toString('utf8')).slice(1, -1))) ||
        keyMaterial.test(text)) {
      throw new Error('Privacy gate: forbidden content in build output (matched value suppressed)');
    }
  }
  return output.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(`Privacy gate passed: ${await checkPrivacy({ allowedPublicKeys: [process.env.VITE_FIREBASE_API_KEY].filter(Boolean) })} files`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
