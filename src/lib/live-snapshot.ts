// Reads the galaxy's `snapshots/live` document through the public Firestore REST endpoint.
// Contract: docs/live-snapshot-contract.md. No imports: the browser bundle and the Node tests share it.

export const STALE_AFTER_MS = 10 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 2 * 60 * 1000;

export type Reading =
  | { state: 'fresh'; count: number; updatedAt: number }
  | { state: 'stale'; updatedAt: number }
  | { state: 'unavailable' };

export function snapshotUrl(projectId: string, apiKey: string) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/snapshots/live?key=${encodeURIComponent(apiKey)}`;
}

type Field = { integerValue?: string; doubleValue?: number; timestampValue?: string };

// Turns a REST document into what may be shown. A number is returned only if it was read,
// is a whole non-negative count and its timestamp is recent.
export function interpret(document: unknown, now: number): Reading {
  const fields = (document as { fields?: Record<string, Field> } | null)?.fields;
  const stamp = fields?.at?.timestampValue;
  const updatedAt = typeof stamp === 'string' ? Date.parse(stamp) : NaN;
  if (!Number.isFinite(updatedAt) || updatedAt - now > FUTURE_TOLERANCE_MS) return { state: 'unavailable' };
  if (now - updatedAt > STALE_AFTER_MS) return { state: 'stale', updatedAt };
  const raw = fields?.creators?.integerValue ?? fields?.creators?.doubleValue;
  const count = typeof raw === 'string' && /^\d{1,9}$/.test(raw) ? Number(raw) : raw;
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) return { state: 'unavailable' };
  return { state: 'fresh', count, updatedAt };
}

export async function readLive(projectId: string, apiKey: string, fetcher: typeof fetch = fetch, now = Date.now(), timeoutMs = 5000): Promise<Reading> {
  try {
    const response = await fetcher(snapshotUrl(projectId, apiKey), { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return { state: 'unavailable' };
    return interpret(await response.json(), now);
  } catch {
    return { state: 'unavailable' };
  }
}
