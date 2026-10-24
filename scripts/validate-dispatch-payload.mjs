import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isReleaseTag } from './resolve-galaxy-release.mjs';

export function validateDispatchPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Repository dispatch requires a client_payload object');
  }
  if (typeof payload.tag !== 'string' || !payload.tag.trim()) {
    throw new Error('Repository dispatch requires a nonempty client_payload.tag string');
  }
  if (!isReleaseTag(payload.tag)) {
    throw new Error(`Invalid repository dispatch client_payload.tag: "${payload.tag}". Must match release tag format like v1.0.0-alpha.1`);
  }
  return payload.tag;
}

export function resolveDeploymentTag({ eventName, payload, inputTag = '' } = {}) {
  if (eventName === 'repository_dispatch') {
    return validateDispatchPayload(payload);
  }
  if (eventName === 'workflow_dispatch') {
    if (inputTag && typeof inputTag === 'string' && inputTag.trim() !== '') {
      const trimmed = inputTag.trim();
      if (!isReleaseTag(trimmed)) {
        throw new Error(`Invalid workflow_dispatch galaxy_tag input: "${inputTag}". Must be empty or match release tag format like v1.0.0-alpha.1`);
      }
      return trimmed;
    }
    return '';
  }
  // push, pull_request, etc. resolve latest (empty tag)
  return '';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME || process.env.EVENT_NAME || '';
    let payload = null;
    const rawPayload = process.env.CLIENT_PAYLOAD_JSON || process.env.EVENT_PAYLOAD_JSON;
    if (rawPayload !== undefined && rawPayload !== '') {
      try {
        payload = JSON.parse(rawPayload);
      } catch (err) {
        throw new Error(`Invalid JSON in CLIENT_PAYLOAD_JSON: ${err.message}`, { cause: err });
      }
    }
    const inputTag = process.env.INPUT_GALAXY_TAG ?? process.env.GALAXY_TAG ?? '';
    const resolvedTag = resolveDeploymentTag({ eventName, payload, inputTag });

    if (process.env.GITHUB_ENV) {
      await appendFile(process.env.GITHUB_ENV, `GALAXY_TAG=${resolvedTag}\n`);
    }
    console.log(`Validated deployment tag for event "${eventName}": "${resolvedTag}"`);
  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
