// Small DOM helpers for the account pages. Text always goes in as text nodes, never as HTML; icons are fixed SVG
// strings from this file.
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string | null | undefined | false)[]) => {
  const n = document.createElement(tag);
  const { class: cls, data, ...rest } = props;
  if (cls) n.className = String(cls);
  if (data) for (const [k, v] of Object.entries(data as Record<string, string>)) n.dataset[k] = v;
  for (const [k, v] of Object.entries(rest)) {
    if (k.startsWith('aria-') || k === 'role' || k === 'for') n.setAttribute(k, String(v));
    else (n as unknown as Record<string, unknown>)[k] = v;
  }
  for (const k of kids) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
};

const PATHS: Record<string, string> = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  requests: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l1 8v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  security: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  desk: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.5.8 2.5 2.6 3 5.2"/>',
  out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
export const icon = (name: keyof typeof PATHS | string) => {
  const s = el('span', { class: 'ico', 'aria-hidden': 'true' });
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] ?? ''}</svg>`;
  return s;
};
