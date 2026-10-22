// Walks the operator content and lists every pending item with its path.
// Plain TypeScript with no imports so Node can run it directly (pnpm run content:todo).
import * as content from './content.ts';

export type TodoEntry = { path: string; needed: string };

export function collectTodos(root: Record<string, unknown> = content): TodoEntry[] {
  const found: TodoEntry[] = [];
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((item, index) => walk(item, `${path}[${index}]`)); return; }
    const record = value as Record<string, unknown>;
    // A list carries its own "more needed" note next to the items it already has.
    if (Array.isArray(record.items) && 'todo' in record) {
      if (typeof record.todo === 'string') found.push({ path, needed: record.todo });
      walk(record.items, `${path}.items`);
      return;
    }
    if (content.isPending(value as content.Maybe<unknown>)) {
      found.push({ path, needed: (value as content.Pending).todo });
      return;
    }
    for (const [key, child] of Object.entries(record)) walk(child, path ? `${path}.${key}` : key);
  };
  for (const [key, value] of Object.entries(root)) if (typeof value === 'object') walk(value, key);
  return found;
}
