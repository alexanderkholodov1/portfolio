import { readFile } from 'node:fs/promises';
import { isReleaseTag, validateManifest } from './assemble-games.mjs';

const selections = validateManifest(JSON.parse(await readFile('games.json', 'utf8')));
const receipt = JSON.parse(await readFile('dist/assembly.json', 'utf8'));
const override = process.env.GALAXY_TAG ?? '';
if (override && !isReleaseTag(override)) throw new Error('GALAXY_TAG must be a release tag like v1.2.3');
for (const [game, selection] of Object.entries(selections)) {
  const assembled = receipt.games?.[game];
  const requested = game === 'galaxy' && override ? override : selection.tag;
  const metadata = JSON.parse(await readFile(`dist/${game}/version.json`, 'utf8'));
  if (assembled?.source !== 'github-release' || !isReleaseTag(assembled.tag) ||
      (requested !== 'latest' && assembled.tag !== requested) || assembled.repository !== selection.repository ||
      assembled.artifact !== `${game}-dist-${assembled.tag}.tar.gz` ||
      !/^[a-f0-9]{64}$/.test(assembled.sha256 ?? '') || !/^[a-f0-9]{40}$/.test(assembled.commit ?? '') ||
      `v${metadata.version}` !== assembled.tag || metadata.commit !== assembled.commit) {
    throw new Error('Hosting requires the configured GitHub Release; local rehearsal output must not be deployed');
  }
}
console.log('Hosting inputs match the resolved GitHub Releases');
