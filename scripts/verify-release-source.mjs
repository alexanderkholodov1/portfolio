import { readFile } from 'node:fs/promises';
import { validateManifest } from './assemble-games.mjs';

const pins = validateManifest(JSON.parse(await readFile('games.json', 'utf8')));
const receipt = JSON.parse(await readFile('dist/assembly.json', 'utf8'));
for (const [game, pin] of Object.entries(pins)) {
  const assembled = receipt.games?.[game];
  if (assembled?.source !== 'github-release' || assembled.tag !== pin.tag || assembled.repository !== pin.repository || assembled.artifact !== pin.artifact) {
    throw new Error('Hosting requires the configured GitHub Release; local rehearsal output must not be deployed');
  }
}
console.log('Hosting inputs match the configured GitHub Release pins');
