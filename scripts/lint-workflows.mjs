import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { parseDocument } from 'yaml';

for (const file of await readdir('.github/workflows')) {
  if (!/\.ya?ml$/.test(file)) continue;
  const document = parseDocument(await readFile(`.github/workflows/${file}`, 'utf8'), { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Workflow YAML is invalid: ${file}`);
  const workflow = document.toJS();
  if (!workflow.on || !workflow.jobs || workflow.on.pull_request_target) throw new Error(`Unsupported workflow trigger/shape: ${file}`);
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps ?? []) {
      if (!step.run) continue;
      const result = spawnSync('bash', ['-n'], { input: step.run, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Workflow shell syntax failed: ${file}`);
    }
  }
}
console.log('Workflow YAML and Bash syntax passed (local static checks only)');
