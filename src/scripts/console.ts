// The admin console: its own environment, apart from the client's account (his note of 2026-11-17: "son dos entornos
// completamente distintos"). Loaded only after the admin role is confirmed; firestore.rules guards the data.
// Overview (indicators, what needs attention, requests per week, the funnel, recent activity), every request with
// filters and CSV export, a board by stage with drag and drop, the request detail (status, priority, conversation
// with quick replies, private notes, the client's other requests), messages, clients, statistics, settings
// (availability, response time, quick replies, browser alerts, data export) and the system's state.
import type { User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { accounts, leave, markRead, newest, sendMessage, unreadFor, watchMessages, when, type Request } from '../lib/accounts';
import { el, icon } from '../lib/dom';
import { consoleCopy } from '../data/console-copy';
import web from '../data/firebase-web.json';

type Shared = { statuses: Record<string, string>; fields: Record<string, string>; steps: string[]; generic: string };
type Ctx = { lang: string; home: string; build: string; shared: Shared };
type Row = Request & { firstResponseAt?: Timestamp };
type Client = { id: string; name?: string; email?: string; contact?: string; contactValue?: string; lang?: string; createdAt?: Timestamp; profile: boolean };
type Site = { accepting: boolean; responseDays: number; noticeEs: string; noticeEn: string };
type Reply = { title: string; text: string };

const FLOW = ['submitted', 'reviewing', 'proposal', 'in-progress', 'delivered'];
const ENDED = ['closed', 'declined', 'withdrawn'];
const STATUSES = [...FLOW, ...ENDED];
const REGION = 'southamerica-east1';
const DAY = 864e5;
const ms = (t?: Timestamp | null) => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);
const owner = (r: Row) => r.uid || r.id;
const fill = (s: string, n: number | string) => s.replace('{n}', String(n));
const store = { get: (k: string) => { try { return localStorage.getItem('console.' + k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem('console.' + k, v); } catch { /* private mode */ } } };

export function mountConsole(root: HTMLElement, user: User, ctx: Ctx) {
  const t = consoleCopy[ctx.lang === 'es' ? 'es' : 'en'];
  const S = ctx.shared;
  const db = accounts().db;
  const locale = ctx.lang === 'es' ? 'es-EC' : 'en-US';
  const view = root.querySelector<HTMLElement>('[data-view]')!;
  let rows: Row[] = [], users: Client[] = [], site: Site = { accepting: true, responseDays: 2, noticeEs: '', noticeEn: '' }, replies: Reply[] = [];
  const log: string[] = [];
  const note = (msg: string) => { log.unshift(`${new Date().toLocaleTimeString(locale)} · ${msg}`); log.length = Math.min(log.length, 60); };
  let stopThread: (() => void) | null = null, current = '';

  const heading = (parts: string[]) => el('h1', {}, parts[0], parts[1] ? el('em', {}, parts[1]) : null);
  const pill = (s: string) => el('span', { class: `pill s-${s}` }, S.statuses[s] || s);
  const titleOf = (r: Row) => (r.kinds?.length ? r.kinds.join(' · ') : '—');
  const nameOf = (r: Row) => r.name || r.email || '—';
  const ago = (t0?: Timestamp | null) => {
    const d = Date.now() - ms(t0); if (!ms(t0)) return '';
    if (d < 6e4) return t.ago.now; if (d < 36e5) return fill(t.ago.min, Math.round(d / 6e4)); if (d < DAY) return fill(t.ago.h, Math.round(d / 36e5)); return fill(t.ago.d, Math.round(d / DAY));
  };
  const duration = (h: number) => (h < 48 ? fill(t.hours, Math.max(1, Math.round(h))) : fill(t.days, Math.round(h / 24)));
  const sent = () => rows.filter((r) => r.status !== 'draft');
  const reached = (r: Row, stage: string) => FLOW.indexOf(r.status) >= FLOW.indexOf(stage) || Boolean(stage === 'submitted' ? r.submittedAt : r.statusAt?.[stage]);
  const waiting = (r: Row) => unreadFor(r, 'admin') || (r.status === 'submitted' && !r.adminReadAt);

  // The chrome: admin-only buttons in the header, the console's own navigation beside the panel.
  const head = document.querySelector<HTMLElement>('[data-con-head]');
  const bell = el('a', { class: 'con-bell', href: '#inbox', title: t.head.activity, 'aria-label': t.head.activity }, icon('bell'), el('b', { class: 'badge', hidden: true }));
  const out = el('button', { type: 'button', class: 'tap con-out' }, icon('out'), el('span', {}, t.head.out));
  out.addEventListener('click', () => leave());
  head?.replaceChildren(bell,
    el('a', { class: 'tap con-ext', href: `https://console.firebase.google.com/project/${web.projectId}/overview`, target: '_blank', rel: 'noopener' }, el('span', {}, t.head.firebase), icon('external')),
    el('span', { class: 'con-me', title: user.email || '' }, el('span', { class: 'avatar small', 'aria-hidden': 'true' }, (user.displayName || user.email || 'A').charAt(0).toUpperCase()), el('span', { class: 'con-role' }, t.head.role)),
    out);
  const sections: [string, string][] = [['overview', 'overview'], ['requests', 'requests'], ['board', 'board'], ['inbox', 'inbox'], ['clients', 'clients'], ['stats', 'stats'], ['settings', 'settings'], ['system', 'system']];
  const badges: Record<string, HTMLElement> = {};
  const nav = el('nav', { class: 'con-nav', 'aria-label': t.title }, ...sections.map(([key, ic]) => {
    const b = el('b', { class: 'badge', hidden: true }); badges[key] = b;
    return el('a', { href: '#' + key, data: { route: key } }, icon(ic), el('span', {}, t.nav[key as keyof typeof t.nav]), b);
  }));
  const panel = el('div', { class: 'con-main' });
  view.replaceChildren(el('div', { class: 'con' }, el('aside', { class: 'con-side' }, nav), panel));
  document.title = `${t.title} · Alexander Kholodov`;

  const counters = () => {
    const pending = rows.filter((r) => r.status === 'submitted' && !r.adminReadAt).length;
    const unread = rows.filter((r) => unreadFor(r, 'admin')).length;
    const set = (b: HTMLElement, n: number) => { b.hidden = !n; b.textContent = String(n); };
    set(badges.requests, pending); set(badges.inbox, unread); set(bell.querySelector('.badge')!, pending + unread);
    document.title = `${pending + unread ? `(${pending + unread}) ` : ''}${t.title} · Alexander Kholodov`;
  };

  // Browser alerts for new requests and messages while the console is open.
  const chime = () => {
    if (store.get('sound') !== '1') return;
    try {
      const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain();
      o.connect(g); g.connect(a.destination); o.frequency.setValueAtTime(660, a.currentTime); o.frequency.setValueAtTime(880, a.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.15, a.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.35);
      o.start(); o.stop(a.currentTime + 0.4);
    } catch { /* no audio */ }
  };
  const alertOf = (text: string, hash: string) => {
    note(text); chime();
    if (store.get('notify') === '1' && 'Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(t.title, { body: text, tag: hash }); n.onclick = () => { window.focus(); location.hash = hash; };
    }
  };

  // Live data.
  let first = true; const lastSeen = new Map<string, number>();
  onSnapshot(query(collection(db, 'requests'), orderBy('updatedAt', 'desc')), (snap) => {
    rows = snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Row, 'id'>) }) as Row).sort(newest);
    if (!first) for (const ch of snap.docChanges()) {
      const r = rows.find((x) => x.id === ch.doc.id); if (!r) continue;
      if (r.status === 'submitted' && !r.adminReadAt && ms(r.submittedAt) > (lastSeen.get(r.id) ?? 0) && ch.type !== 'removed' && !lastSeen.has(r.id + ':sent')) { lastSeen.set(r.id + ':sent', 1); alertOf(`${t.notif.request} ${nameOf(r)}`, 'request/' + r.id); }
      if (unreadFor(r, 'admin') && ms(r.lastAt) > (lastSeen.get(r.id) ?? 0)) alertOf(`${t.notif.message} ${nameOf(r)}`, 'request/' + r.id);
    }
    for (const r of rows) { lastSeen.set(r.id, ms(r.lastAt)); if (r.status !== 'draft') lastSeen.set(r.id + ':sent', 1); }
    first = false; counters();
    if (['overview', 'requests', 'board', 'inbox', 'clients', 'stats'].includes(current.split('/')[0]) && !(panel.contains(document.activeElement) && document.activeElement?.matches('input[type=search], input[type=text], input[type=number], textarea'))) route(false);
  }, () => note(S.generic));
  onSnapshot(collection(db, 'users'), (snap) => {
    users = snap.docs.map((d) => ({ id: d.id, profile: true, ...(d.data() as Omit<Client, 'id' | 'profile'>) }));
    if (current.startsWith('client')) route(false);
  }, () => undefined);
  getDoc(doc(db, 'config', 'site')).then((s) => { if (s.exists()) site = { ...site, ...(s.data() as Partial<Site>) }; }).catch(() => undefined);
  getDoc(doc(db, 'config', 'replies')).then((s) => { if (s.exists()) replies = ((s.data() as { items?: Reply[] }).items || []); }).catch(() => undefined);

  const clients = (): (Client & { reqs: Row[] })[] => {
    const map = new Map<string, Client>();
    for (const u of users) if (u.id !== user.uid) map.set(u.id, u);
    for (const r of rows) { const id = owner(r); if (id !== user.uid && !map.has(id)) map.set(id, { id, name: r.name, email: r.email, contact: r.contact, contactValue: r.contactValue, lang: r.lang, profile: false }); }
    return [...map.values()].map((c) => ({ ...c, reqs: rows.filter((r) => owner(r) === c.id) }))
      .sort((a, b) => Math.max(0, ...b.reqs.map((r) => ms(r.updatedAt))) - Math.max(0, ...a.reqs.map((r) => ms(r.updatedAt))) || ms(b.createdAt) - ms(a.createdAt));
  };

  // Charts: one hue for magnitude, labels in text colour, a table view for each.
  const withTable = (chart: HTMLElement, head: string[], body: (string | number)[][], label: string) => {
    const table = el('table', { class: 'con-table sr-table', hidden: true }, el('caption', {}, label), el('thead', {}, el('tr', {}, ...head.map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, ...body.map((row) => el('tr', {}, ...row.map((c, k) => (k ? el('td', {}, String(c)) : el('th', { scope: 'row' }, String(c))))))));
    const toggle = el('button', { type: 'button', class: 'link soft small' }, t.table);
    toggle.addEventListener('click', () => { const show = table.hidden; table.hidden = !show; chart.hidden = show; toggle.textContent = show ? t.chart : t.table; });
    return el('div', { class: 'chart-wrap' }, chart, table, toggle);
  };
  const columns = (data: { label: string; full: string; value: number }[], label: string) => {
    const W = 640, H = 210, L = 30, B = 26, T = 10;
    const max = Math.max(1, ...data.map((d) => d.value));
    const top = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
    const cw = (W - L) / data.length, bw = Math.max(6, cw - 8);
    const y = (v: number) => T + (H - T - B) * (1 - v / top);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">`;
    for (let k = 0; k <= 4; k++) { const v = (top / 4) * k; svg += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" class="tick" text-anchor="end">${Math.round(v)}</text>`; }
    data.forEach((d, k) => {
      const x = L + cw * k + (cw - bw) / 2, h = (H - T - B) * (d.value / top), r = Math.min(4, h, bw / 2);
      if (d.value) svg += `<path class="bar" d="M${x},${H - B} V${H - B - h + r} Q${x},${H - B - h} ${x + r},${H - B - h} H${x + bw - r} Q${x + bw},${H - B - h} ${x + bw},${H - B - h + r} V${H - B} Z"/>`;
      svg += `<rect class="hit" x="${L + cw * k}" y="${T}" width="${cw}" height="${H - T - B}" data-k="${k}"/>`;
      if (k % 2 === (data.length % 2 ? 0 : 1) || data.length <= 8) svg += `<text x="${x + bw / 2}" y="${H - 8}" class="tick" text-anchor="middle">${d.label}</text>`;
    });
    svg += '</svg>';
    const box = el('div', { class: 'chart' }); box.innerHTML = svg;
    const tip = el('div', { class: 'tip', hidden: true }); box.append(tip);
    box.querySelectorAll<SVGRectElement>('.hit').forEach((h) => {
      const d = data[Number(h.dataset.k)];
      const show = () => { tip.hidden = false; tip.textContent = `${d.full} · ${d.value}`; const r = h.getBoundingClientRect(), b = box.getBoundingClientRect(); tip.style.left = `${r.left - b.left + r.width / 2}px`; h.classList.add('on'); };
      h.addEventListener('pointerenter', show); h.addEventListener('pointerleave', () => { tip.hidden = true; h.classList.remove('on'); });
    });
    return withTable(box, [t.overview.week, t.count], data.map((d) => [d.full, d.value]), label);
  };
  const bars = (entries: [string, number][], label: string) => {
    const max = Math.max(1, ...entries.map((e) => e[1])); const total = entries.reduce((a, e) => a + e[1], 0) || 1;
    const list = el('ul', { class: 'hbars', 'aria-label': label }, ...entries.map(([k, v]) => el('li', {},
      el('span', { class: 'hb-label' }, k), el('span', { class: 'hb-track' }, el('i', { style: `width:${(v / max) * 100}%` })), el('span', { class: 'hb-val' }, `${v} · ${Math.round((v / total) * 100)}%`))));
    return entries.length ? list : el('p', { class: 'soft' }, t.stats.none);
  };
  const tally = (key: keyof Row) => {
    const m = new Map<string, number>();
    for (const r of sent()) { const v = r[key]; for (const x of Array.isArray(v) ? v : v ? [String(v)] : []) m.set(String(x), (m.get(String(x)) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const weeks = (n: number) => {
    const now = new Date(); const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: n }, (_, k) => { const s = new Date(start); s.setDate(s.getDate() - 7 * (n - 1 - k)); const e = s.getTime() + 7 * DAY;
      return { label: s.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), full: `${t.overview.week} ${s.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}`, value: sent().filter((r) => ms(r.submittedAt) >= s.getTime() && ms(r.submittedAt) < e).length }; });
  };
  const months = (n: number) => {
    const now = new Date();
    return Array.from({ length: n }, (_, k) => { const s = new Date(now.getFullYear(), now.getMonth() - (n - 1 - k), 1); const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      return { label: s.toLocaleDateString(locale, { month: 'short' }), full: s.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), value: sent().filter((r) => ms(r.submittedAt) >= s.getTime() && ms(r.submittedAt) < e.getTime()).length }; });
  };
  const responseHours = () => { const xs = sent().filter((r) => r.firstResponseAt && r.submittedAt).map((r) => (ms(r.firstResponseAt) - ms(r.submittedAt)) / 36e5); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
  const deliveryHours = () => { const xs = sent().filter((r) => r.statusAt?.delivered && r.submittedAt).map((r) => (ms(r.statusAt!.delivered) - ms(r.submittedAt)) / 36e5); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
  const card = (title: string, lead: string | null, ...kids: (Node | null)[]) => el('section', { class: 'con-card' }, el('h2', {}, title), lead ? el('p', { class: 'soft' }, lead) : null, ...kids);

  // Writes that count as the admin's first response.
  const firstResponse = (r: Row) => (r.firstResponseAt ? {} : { firstResponseAt: serverTimestamp() });
  const setStatus = async (r: Row, status: string, priority?: string) => {
    const changes: Record<string, unknown> = { status, updatedAt: serverTimestamp(), ...firstResponse(r) };
    if (status !== r.status) changes[`statusAt.${status}`] = serverTimestamp();
    if (priority !== undefined) changes.priority = priority;
    await updateDoc(doc(db, 'requests', r.id), changes);
    note(`${nameOf(r)} → ${S.statuses[status]}`);
  };

  // Panels.
  const overview = () => {
    const all = sent(); const cs = clients();
    const name = (user.displayName || 'Alexander').split(' ')[0];
    const resp = responseHours();
    const accepted = all.filter((r) => reached(r, 'in-progress')).length;
    const drafts = rows.filter((r) => r.status === 'draft' && Date.now() - ms(r.updatedAt) > 2 * DAY);
    const kpi = (key: keyof typeof t.overview.kpi, value: string | number, hash: string | null, tone = '') =>
      el(hash ? 'a' : 'div', { class: 'kpi' + (tone ? ' ' + tone : ''), ...(hash ? { href: '#' + hash } : {}) }, el('span', { class: 'kpi-label' }, t.overview.kpi[key]), el('b', {}, String(value)), el('small', {}, t.overview.hint[key]));
    const pending = rows.filter((r) => r.status === 'submitted' && !r.adminReadAt).length;
    const unread = rows.filter((r) => unreadFor(r, 'admin')).length;
    const attention: [Row, string][] = [];
    for (const r of all) {
      if (r.status === 'submitted' && !r.adminReadAt) attention.push([r, t.overview.reasons.new]);
      else if (unreadFor(r, 'admin')) attention.push([r, t.overview.reasons.message]);
      else if (['reviewing', 'proposal', 'in-progress'].includes(r.status) && Date.now() - ms(r.updatedAt) > 7 * DAY) attention.push([r, fill(t.overview.reasons.stale, Math.round((Date.now() - ms(r.updatedAt)) / DAY))]);
    }
    for (const r of drafts.slice(0, 3)) attention.push([r, fill(t.overview.reasons.draft, Math.round((Date.now() - ms(r.updatedAt)) / DAY))]);
    const events: { at: number; node: HTMLElement }[] = [];
    for (const r of all) {
      if (r.submittedAt) events.push({ at: ms(r.submittedAt), node: el('span', {}, el('b', {}, nameOf(r)), ' ', t.overview.events.submitted) });
      if (r.lastAt && r.lastFrom) events.push({ at: ms(r.lastAt), node: r.lastFrom === 'client' ? el('span', {}, el('b', {}, nameOf(r)), ' ', t.overview.events.client) : el('span', {}, t.overview.events.admin, ' ', el('b', {}, nameOf(r))) });
      for (const [s, at] of Object.entries(r.statusAt || {})) events.push({ at: ms(at), node: el('span', {}, el('b', {}, nameOf(r)), ' ', t.overview.events.status, ' ', pill(s)) });
    }
    events.sort((a, b) => b.at - a.at);
    const funnel: [string, number][] = FLOW.map((s, k) => [S.steps[k], all.filter((r) => reached(r, s)).length]);
    panel.replaceChildren(
      el('h1', {}, t.overview.hello, el('em', {}, name)), el('p', { class: 'lede' }, t.overview.lead),
      el('div', { class: 'kpis' },
        kpi('pending', pending, 'requests', pending ? 'hot' : ''), kpi('unanswered', unread, 'inbox', unread ? 'hot' : ''),
        kpi('active', all.filter((r) => ['reviewing', 'proposal', 'in-progress'].includes(r.status)).length, 'board'),
        kpi('delivered', all.filter((r) => r.status === 'delivered').length, 'board'),
        kpi('clients', cs.length, 'clients'), kpi('acceptance', all.length ? `${Math.round((accepted / all.length) * 100)}%` : '—', 'stats'),
        kpi('response', resp === null ? '—' : duration(resp), 'stats'), kpi('drafts', drafts.length, 'requests')),
      el('div', { class: 'con-grid' },
        card(t.overview.attention, null, attention.length ? el('ul', { class: 'con-list' }, ...attention.slice(0, 8).map(([r, why]) => el('li', {}, el('a', { href: '#request/' + r.id },
          el('span', { class: 'dot-new' + (why === t.overview.reasons.new || why === t.overview.reasons.message ? '' : ' calm'), 'aria-hidden': 'true' }),
          el('span', { class: 'who' }, el('b', {}, nameOf(r)), el('small', {}, `${titleOf(r)} · ${why}`)), el('time', {}, ago(r.lastAt || r.updatedAt)))))) : el('p', { class: 'soft empty' }, t.overview.attentionEmpty)),
        card(t.overview.recent, null, events.length ? el('ul', { class: 'con-feed' }, ...events.slice(0, 8).map((e) => el('li', {}, e.node, el('time', {}, ago({ toMillis: () => e.at } as Timestamp))))) : el('p', { class: 'soft empty' }, t.overview.recentEmpty)),
        card(t.overview.weekly, t.overview.weeklyLead, columns(weeks(12), t.overview.weekly)),
        card(t.overview.funnel, t.overview.funnelLead, bars(funnel, t.overview.funnel))));
  };

  const filters = { term: '', status: 'all', priority: '', kind: '', sort: 'recent', drafts: false };
  const requestsPanel = () => {
    const kinds = tally('kinds').map((e) => e[0]);
    const base = rows.filter((r) => filters.drafts || r.status !== 'draft');
    const counts: Record<string, number> = { all: base.length }; for (const r of base) counts[r.status] = (counts[r.status] || 0) + 1;
    const match = (r: Row) => (filters.status === 'all' || r.status === filters.status) && (!filters.priority || (r.priority || '') === filters.priority) && (!filters.kind || (r.kinds || []).includes(filters.kind))
      && (!filters.term || [r.name, r.email, r.idea, ...(r.kinds || [])].join(' ').toLowerCase().includes(filters.term.toLowerCase()));
    const rank: Record<string, number> = { high: 0, medium: 1, low: 2, '': 3 };
    const shown = base.filter(match).sort(filters.sort === 'old' ? (a, b) => ms(a.submittedAt || a.createdAt) - ms(b.submittedAt || b.createdAt)
      : filters.sort === 'priority' ? (a, b) => rank[a.priority || ''] - rank[b.priority || ''] || newest(a, b)
        : filters.sort === 'waiting' ? (a, b) => Number(waiting(b)) - Number(waiting(a)) || newest(a, b) : newest);
    const search = el('input', { type: 'search', class: 'con-input', value: filters.term, placeholder: t.requests.search, 'aria-label': t.requests.search }) as HTMLInputElement;
    search.addEventListener('input', () => { filters.term = search.value; const pos = search.selectionStart; requestsPanel(); const n = panel.querySelector<HTMLInputElement>('input[type=search]')!; n.focus(); n.setSelectionRange(pos, pos); });
    const select = (value: string, options: [string, string][], label: string, on: (v: string) => void) => {
      const s = el('select', { class: 'con-input', 'aria-label': label }) as HTMLSelectElement;
      for (const [v, l] of options) s.append(el('option', { value: v, selected: v === value }, l));
      s.addEventListener('change', () => on(s.value)); return s;
    };
    const drafts = el('label', { class: 'toggle' }, el('input', { type: 'checkbox', checked: filters.drafts }), el('span', {}, t.requests.drafts));
    drafts.querySelector('input')!.addEventListener('change', (e) => { filters.drafts = (e.target as HTMLInputElement).checked; requestsPanel(); });
    const exportBtn = el('button', { type: 'button', class: 'btn-b small' }, icon('download'), el('span', {}, t.requests.export));
    exportBtn.addEventListener('click', () => download(`requests-${new Date().toISOString().slice(0, 10)}.csv`, csv(shown), 'text/csv'));
    const chips = el('div', { class: 'filters' }, ...['all', ...STATUSES, 'draft'].filter((k) => k === 'all' || counts[k]).map((k) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(filters.status === k) }, `${k === 'all' ? t.requests.all : S.statuses[k]} · ${counts[k] || 0}`);
      b.addEventListener('click', () => { filters.status = k; requestsPanel(); }); return b;
    }));
    const table = el('div', { class: 'con-rows', role: 'table', 'aria-label': t.nav.requests },
      el('div', { class: 'con-row head', role: 'row' }, ...Object.values(t.requests.cols).map((c) => el('span', { role: 'columnheader' }, c))),
      ...(shown.length ? shown.map((r) => el('a', { class: 'con-row' + (waiting(r) ? ' waiting' : ''), href: '#request/' + r.id, role: 'row' },
        el('span', { role: 'cell' }, pill(r.status)),
        el('span', { class: 'who', role: 'cell' }, el('b', {}, nameOf(r)), el('small', {}, r.email || '')),
        el('span', { class: 'what', role: 'cell' }, titleOf(r)),
        el('span', { role: 'cell' }, r.priority ? el('span', { class: 'prio p-' + r.priority }, t.priorities[r.priority as 'high']) : el('span', { class: 'soft' }, '—')),
        el('span', { role: 'cell', class: 'soft' }, when(r.submittedAt || r.createdAt, ctx.lang)),
        el('span', { role: 'cell', class: 'act' }, waiting(r) ? el('span', { class: 'dot-new', 'aria-hidden': 'true' }) : null, ago(r.lastAt || r.updatedAt))))
        : [el('p', { class: 'soft empty' }, t.requests.empty)]));
    panel.replaceChildren(heading(t.requests.title), el('p', { class: 'lede' }, t.requests.lead),
      el('div', { class: 'con-tools' }, search,
        select(filters.priority, [['', t.requests.anyPriority], ...Object.entries(t.priorities).filter(([k]) => k)] as [string, string][], t.detail.priority, (v) => { filters.priority = v; requestsPanel(); }),
        select(filters.kind, [['', t.requests.anyKind], ...kinds.map((k) => [k, k])] as [string, string][], t.requests.cols.what, (v) => { filters.kind = v; requestsPanel(); }),
        select(filters.sort, Object.entries(t.requests.sorts) as [string, string][], t.requests.sorts.recent, (v) => { filters.sort = v; requestsPanel(); }),
        drafts, exportBtn),
      chips, el('p', { class: 'soft small' }, fill(t.requests.shown, shown.length).replace('{t}', String(base.length))), table);
  };

  const board = () => {
    const cols: [string, string[], string][] = [...FLOW.map((s, k) => [s, [s], S.steps[k]] as [string, string[], string]), ['closed', ENDED, t.board.closed]];
    const lanes = cols.map(([key, statuses, label]) => {
      const items = sent().filter((r) => statuses.includes(r.status));
      const lane = el('section', { class: 'lane', data: { status: key }, 'aria-label': label },
        el('h2', {}, el('span', {}, label), el('b', {}, String(items.length))),
        el('div', { class: 'lane-cards' }, ...(items.length ? items.map((r) => {
          const move = el('select', { class: 'con-input mini', 'aria-label': t.board.move }) as HTMLSelectElement;
          move.append(el('option', { value: '' }, t.board.move + '…'));
          for (const s of STATUSES) if (s !== r.status) move.append(el('option', { value: s }, S.statuses[s]));
          move.addEventListener('change', () => { if (move.value) setStatus(r, move.value).catch(() => note(S.generic)); });
          const c = el('article', { class: 'kard' + (waiting(r) ? ' waiting' : ''), draggable: true, data: { id: r.id } },
            el('a', { href: '#request/' + r.id }, el('b', {}, nameOf(r)), el('span', {}, titleOf(r))),
            el('p', { class: 'kard-meta' }, r.priority ? el('span', { class: 'prio p-' + r.priority }, t.priorities[r.priority as 'high']) : null,
              ENDED.includes(r.status) ? pill(r.status) : null, waiting(r) ? el('span', { class: 'dot-new', 'aria-hidden': 'true' }) : null, el('time', {}, ago(r.updatedAt))), move);
          c.addEventListener('dragstart', (e) => { e.dataTransfer?.setData('text/plain', r.id); c.classList.add('dragging'); });
          c.addEventListener('dragend', () => c.classList.remove('dragging'));
          return c;
        }) : [el('p', { class: 'soft lane-empty' }, t.board.empty)])));
      lane.addEventListener('dragover', (e) => { e.preventDefault(); lane.classList.add('over'); });
      lane.addEventListener('dragleave', () => lane.classList.remove('over'));
      lane.addEventListener('drop', (e) => {
        e.preventDefault(); lane.classList.remove('over');
        const r = rows.find((x) => x.id === e.dataTransfer?.getData('text/plain')); const target = key === 'closed' ? 'closed' : key;
        if (r && !statuses.includes(r.status)) setStatus(r, target).catch(() => note(S.generic));
      });
      return lane;
    });
    panel.replaceChildren(heading(t.board.title), el('p', { class: 'lede' }, t.board.lead), el('div', { class: 'lanes' }, ...lanes));
  };

  const thread = (r: Row) => {
    stopThread?.();
    const box = el('div', { class: 'thread', 'aria-live': 'polite' });
    const legacy = r.message ? [{ id: 'legacy', from: 'admin' as const, text: r.message, at: r.updatedAt }] : [];
    stopThread = watchMessages(r.id, (msgs) => {
      const all = [...legacy, ...msgs];
      box.replaceChildren(...(all.length ? all.map((m) => el('div', { class: 'msg' + (m.from === 'admin' ? ' me' : '') }, el('p', {}, m.text),
        el('small', {}, `${m.from === 'admin' ? t.detail.you : nameOf(r)} · ${when(m.at, ctx.lang, true)}`))) : [el('p', { class: 'soft empty' }, '—')]));
      box.scrollTop = box.scrollHeight;
    });
    const text = el('textarea', { rows: 3, maxLength: 4000, placeholder: t.detail.placeholder, 'aria-label': t.detail.chat }) as HTMLTextAreaElement;
    const send = el('button', { type: 'submit', class: 'btn-a send' }, icon('send'), el('span', {}, t.detail.send));
    const form = el('form', { class: 'composer' }, text, send);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const v = text.value.trim(); if (!v) return; send.disabled = true;
      try {
        await sendMessage(r.id, user.uid, v, 'admin');
        if (!r.firstResponseAt) await updateDoc(doc(db, 'requests', r.id), { firstResponseAt: serverTimestamp() });
        text.value = ''; note(`${t.detail.you} → ${nameOf(r)}`);
      } catch { note(S.generic); }
      send.disabled = false; text.focus();
    });
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
    const quick = el('div', { class: 'quick' }, ...(replies.length ? replies.map((q) => { const b = el('button', { type: 'button', class: 'chip-link' }, q.title); b.addEventListener('click', () => { text.value = (text.value ? text.value + '\n' : '') + q.text; text.focus(); }); return b; })
      : [el('a', { class: 'link soft small', href: '#settings' }, t.detail.noReplies)]));
    return el('div', { class: 'chat' }, box, el('p', { class: 'kicker' }, t.detail.replies), quick, form);
  };

  const detail = (id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r) { location.hash = 'requests'; return; }
    if (r.status !== 'draft' && (unreadFor(r, 'admin') || !r.adminReadAt)) markRead(r.id, 'admin').catch(() => undefined);
    const status = el('select', { class: 'con-input', 'aria-label': t.detail.status }) as HTMLSelectElement;
    for (const s of STATUSES) status.append(el('option', { value: s, selected: s === r.status }, S.statuses[s]));
    const priority = el('select', { class: 'con-input', 'aria-label': t.detail.priority }) as HTMLSelectElement;
    for (const [k, l] of Object.entries(t.priorities)) priority.append(el('option', { value: k, selected: (r.priority || '') === k }, l));
    const ok = el('span', { class: 'ok', role: 'status' });
    const save = el('button', { type: 'button', class: 'btn-a' }, t.detail.save);
    save.addEventListener('click', async () => { save.disabled = true; ok.textContent = ''; try { await setStatus(r, status.value, priority.value); ok.textContent = t.detail.saved; } catch { ok.textContent = S.generic; } save.disabled = false; });
    if (r.status === 'draft') { status.disabled = true; priority.disabled = true; save.disabled = true; }
    const digits = (r.contactValue || '').replace(/[^\d+]/g, '');
    const copy = el('button', { type: 'button', class: 'chip-link' }, icon('copy'), el('span', {}, t.detail.copy));
    copy.addEventListener('click', () => { navigator.clipboard?.writeText(r.email || '').then(() => { copy.querySelector('span:last-child')!.textContent = t.detail.copied; }).catch(() => undefined); });
    const reach = el('p', { class: 'reach' },
      r.email ? el('a', { class: 'chip-link', href: `mailto:${r.email}` }, t.detail.email) : null, r.email ? copy : null,
      digits && /whats/i.test(r.contact || '') ? el('a', { class: 'chip-link', href: `https://wa.me/${digits.replace('+', '')}`, target: '_blank', rel: 'noopener' }, t.detail.whatsapp) : null,
      digits ? el('a', { class: 'chip-link', href: `tel:${digits}` }, t.detail.call) : null);
    const ref = doc(db, 'requests', r.id);
    const notesBox = el('ul', { class: 'notes' });
    const loadNotes = async () => { const ns = await getDocs(query(collection(ref, 'notes'), orderBy('at', 'desc'))); notesBox.replaceChildren(...ns.docs.map((n) => el('li', {}, el('time', {}, when(n.data().at, ctx.lang, true)), el('p', {}, n.data().text)))); };
    const noteText = el('textarea', { rows: 2, class: 'con-input', placeholder: t.detail.note, 'aria-label': t.detail.note, maxLength: 4000 }) as HTMLTextAreaElement;
    const addNote = el('button', { type: 'button', class: 'btn-b' }, t.detail.addNote);
    addNote.addEventListener('click', async () => { const v = noteText.value.trim(); if (!v) return; await addDoc(collection(ref, 'notes'), { text: v, at: serverTimestamp() }); noteText.value = ''; loadNotes(); });
    const others = rows.filter((x) => owner(x) === owner(r) && x.id !== r.id && x.status !== 'draft');
    const at = FLOW.indexOf(r.status);
    const line = el('ol', { class: 'timeline' }, ...FLOW.map((s, k) => { const stamp = s === 'submitted' ? r.submittedAt : r.statusAt?.[s]; return el('li', { class: at < 0 ? '' : k < at ? 'done' : k === at ? 'now' : '' }, el('span', {}, S.steps[k]), stamp ? el('small', {}, when(stamp, ctx.lang)) : null); }));
    const answers = el('dl', { class: 'review' }, ...Object.entries(S.fields).map(([k, label]) => {
      const v = k === 'contact' ? [r.contact, r.contactValue].filter(Boolean).join(' · ') : (r as Record<string, unknown>)[k];
      return el('div', {}, el('dt', {}, label), el('dd', {}, Array.isArray(v) ? v.join(', ') : v ? String(v) : '—'));
    }));
    const facts = el('dl', { class: 'facts' },
      ...([[t.detail.facts.received, when(r.submittedAt || r.createdAt, ctx.lang, true)], [t.detail.facts.firstResponse, r.firstResponseAt ? duration((ms(r.firstResponseAt) - ms(r.submittedAt)) / 36e5) : '—'],
        [t.detail.facts.updated, ago(r.lastAt || r.updatedAt)], [t.detail.facts.lang, (r.lang || '—').toUpperCase()]] as [string, string][]).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))));
    panel.replaceChildren(
      el('a', { class: 'back', href: '#requests' }, icon('back'), t.detail.back),
      el('div', { class: 'detail-head' }, el('h1', {}, nameOf(r)), pill(r.status), r.priority ? el('span', { class: 'prio p-' + r.priority }, t.priorities[r.priority as 'high']) : null),
      el('p', { class: 'soft' }, [r.email, titleOf(r)].filter(Boolean).join(' · '), ' · ', el('a', { href: '#client/' + owner(r) }, t.detail.profile)),
      facts, ...(ENDED.includes(r.status) ? [] : [line]),
      el('div', { class: 'con-split' },
        el('div', { class: 'stack' },
          el('section', { class: 'con-card con-actions' }, el('div', { class: 'two' }, el('label', { class: 'field' }, el('span', {}, t.detail.status), status), el('label', { class: 'field' }, el('span', {}, t.detail.priority), priority)), el('p', { class: 'calls' }, save, ok)),
          card(t.detail.chat, t.detail.chatLead, r.status === 'draft' ? null : thread(r))),
        el('div', { class: 'stack' },
          card(t.detail.answers, null, answers, el('h3', {}, t.detail.reach), reach),
          card(t.detail.notes, t.detail.notesLead, noteText, el('p', { class: 'calls' }, addNote), notesBox),
          card(t.detail.other, null, others.length ? el('ul', { class: 'con-list' }, ...others.map((o) => el('li', {}, el('a', { href: '#request/' + o.id }, pill(o.status), el('span', { class: 'who' }, el('b', {}, titleOf(o)), el('small', {}, when(o.submittedAt, ctx.lang))))))) : el('p', { class: 'soft' }, t.detail.none)))));
    loadNotes().catch(() => undefined);
  };

  const inbox = () => {
    const convo = sent().filter((r) => r.lastAt).sort((a, b) => Number(unreadFor(b, 'admin')) - Number(unreadFor(a, 'admin')) || ms(b.lastAt) - ms(a.lastAt));
    panel.replaceChildren(heading(t.inbox.title), el('p', { class: 'lede' }, t.inbox.lead),
      convo.length ? el('ul', { class: 'con-list big' }, ...convo.map((r) => el('li', { class: unreadFor(r, 'admin') ? 'waiting' : '' }, el('a', { href: '#request/' + r.id },
        el('span', { class: 'avatar small', 'aria-hidden': 'true' }, nameOf(r).charAt(0).toUpperCase()),
        el('span', { class: 'who' }, el('b', {}, nameOf(r)), el('small', {}, `${titleOf(r)} · ${r.lastFrom === 'client' ? t.inbox.last.client : t.inbox.last.admin}`)),
        unreadFor(r, 'admin') ? el('span', { class: 'new' }, el('span', { class: 'dot-new', 'aria-hidden': 'true' }), t.inbox.waiting) : el('span', { class: 'soft small' }, t.inbox.replied),
        el('time', {}, ago(r.lastAt)))))) : el('p', { class: 'soft empty' }, t.inbox.empty));
  };

  let clientTerm = '';
  const clientsPanel = () => {
    const list = clients().filter((c) => !clientTerm || [c.name, c.email].join(' ').toLowerCase().includes(clientTerm.toLowerCase()));
    const search = el('input', { type: 'search', class: 'con-input', value: clientTerm, placeholder: t.clients.search, 'aria-label': t.clients.search }) as HTMLInputElement;
    search.addEventListener('input', () => { clientTerm = search.value; const pos = search.selectionStart; clientsPanel(); const n = panel.querySelector<HTMLInputElement>('input[type=search]')!; n.focus(); n.setSelectionRange(pos, pos); });
    panel.replaceChildren(heading(t.clients.title), el('p', { class: 'lede' }, t.clients.lead), el('div', { class: 'con-tools' }, search),
      list.length ? el('ul', { class: 'con-list big' }, ...list.map((c) => {
        const sentReqs = c.reqs.filter((r) => r.status !== 'draft');
        return el('li', {}, el('a', { href: '#client/' + c.id }, el('span', { class: 'avatar small', 'aria-hidden': 'true' }, (c.name || c.email || '?').charAt(0).toUpperCase()),
          el('span', { class: 'who' }, el('b', {}, c.name || '—'), el('small', {}, c.email || '')),
          el('span', { class: 'soft small' }, `${sentReqs.length} ${t.clients.requests}`),
          el('time', {}, c.reqs.length ? ago(c.reqs[0].updatedAt) : c.createdAt ? `${t.clients.since} ${when(c.createdAt, ctx.lang)}` : '')));
      })) : el('p', { class: 'soft empty' }, t.clients.empty));
  };
  const clientDetail = (id: string) => {
    const c = clients().find((x) => x.id === id);
    if (!c) { location.hash = 'clients'; return; }
    const reqs = c.reqs.filter((r) => r.status !== 'draft');
    const digits = (c.contactValue || '').replace(/[^\d+]/g, '');
    panel.replaceChildren(el('a', { class: 'back', href: '#clients' }, icon('back'), t.clients.back),
      el('div', { class: 'detail-head' }, el('span', { class: 'avatar' }, (c.name || c.email || '?').charAt(0).toUpperCase()), el('h1', {}, c.name || c.email || '—')),
      el('dl', { class: 'facts' }, ...([[t.detail.email, c.email || '—'], [t.clients.contact, [c.contact, c.contactValue].filter(Boolean).join(' · ') || '—'], [t.clients.lang, (c.lang || '—').toUpperCase()],
        [t.clients.since, c.createdAt ? when(c.createdAt, ctx.lang) : c.profile ? '—' : t.clients.noProfile]] as [string, string][]).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))),
      el('p', { class: 'reach' }, c.email ? el('a', { class: 'chip-link', href: `mailto:${c.email}` }, t.detail.email) : null,
        digits && /whats/i.test(c.contact || '') ? el('a', { class: 'chip-link', href: `https://wa.me/${digits.replace('+', '')}`, target: '_blank', rel: 'noopener' }, t.detail.whatsapp) : null,
        digits ? el('a', { class: 'chip-link', href: `tel:${digits}` }, t.detail.call) : null),
      card(t.nav.requests, null, reqs.length ? el('ul', { class: 'con-list' }, ...reqs.map((r) => el('li', {}, el('a', { href: '#request/' + r.id }, pill(r.status), el('span', { class: 'who' }, el('b', {}, titleOf(r)), el('small', {}, r.idea || '')), el('time', {}, when(r.submittedAt, ctx.lang)))))) : el('p', { class: 'soft' }, t.clients.none)));
  };

  const stats = () => {
    const resp = responseHours(), del = deliveryHours();
    const byStatus: [string, number][] = STATUSES.map((s) => [S.statuses[s], sent().filter((r) => r.status === s).length] as [string, number]).filter((e) => e[1]);
    panel.replaceChildren(heading(t.stats.title), el('p', { class: 'lede' }, t.stats.lead),
      el('div', { class: 'kpis small' },
        el('div', { class: 'kpi' }, el('span', { class: 'kpi-label' }, t.stats.avgResponse), el('b', {}, resp === null ? '—' : duration(resp))),
        el('div', { class: 'kpi' }, el('span', { class: 'kpi-label' }, t.stats.avgDelivery), el('b', {}, del === null ? '—' : duration(del)))),
      el('div', { class: 'con-grid' },
        card(t.stats.monthly, t.stats.monthlyLead, columns(months(12), t.stats.monthly)),
        card(t.stats.status, null, bars(byStatus, t.stats.status)),
        card(t.stats.kinds, null, bars(tally('kinds'), t.stats.kinds)), card(t.stats.budget, null, bars(tally('budget'), t.stats.budget)),
        card(t.stats.forWhom, null, bars(tally('forWhom'), t.stats.forWhom)), card(t.stats.where, null, bars(tally('where'), t.stats.where)),
        card(t.stats.when, null, bars(tally('when'), t.stats.when)), card(t.stats.lang, null, bars(tally('lang').map(([k, v]) => [k.toUpperCase(), v]), t.stats.lang))));
  };

  const settings = () => {
    const ok1 = el('span', { class: 'ok', role: 'status' });
    const accepting = el('input', { type: 'checkbox', checked: site.accepting }) as HTMLInputElement;
    const days = el('input', { type: 'number', class: 'con-input', min: 1, max: 60, value: String(site.responseDays) }) as HTMLInputElement;
    const nEs = el('textarea', { rows: 2, class: 'con-input', maxLength: 400, value: site.noticeEs }) as HTMLTextAreaElement;
    const nEn = el('textarea', { rows: 2, class: 'con-input', maxLength: 400, value: site.noticeEn }) as HTMLTextAreaElement;
    const save1 = el('button', { type: 'button', class: 'btn-a' }, t.settings.save);
    save1.addEventListener('click', async () => {
      save1.disabled = true; ok1.textContent = '';
      const next = { accepting: accepting.checked, responseDays: Math.min(60, Math.max(1, Math.round(Number(days.value) || 2))), noticeEs: nEs.value.trim(), noticeEn: nEn.value.trim() };
      try { await setDoc(doc(db, 'config', 'site'), { ...next, updatedAt: serverTimestamp() }); site = next; ok1.textContent = t.settings.saved; note(t.settings.availability); } catch { ok1.textContent = S.generic; }
      save1.disabled = false;
    });
    const ok2 = el('span', { class: 'ok', role: 'status' });
    const list = el('div', { class: 'reply-list' });
    const draw = () => list.replaceChildren(...replies.map((q, k) => {
      const ti = el('input', { type: 'text', class: 'con-input', value: q.title, maxLength: 60, 'aria-label': t.settings.replyTitle, placeholder: t.settings.replyTitle }) as HTMLInputElement;
      const tx = el('textarea', { rows: 2, class: 'con-input', value: q.text, maxLength: 2000, 'aria-label': t.settings.replyText, placeholder: t.settings.replyText }) as HTMLTextAreaElement;
      ti.addEventListener('input', () => { replies[k].title = ti.value; }); tx.addEventListener('input', () => { replies[k].text = tx.value; });
      const rm = el('button', { type: 'button', class: 'link danger small' }, t.settings.remove); rm.addEventListener('click', () => { replies.splice(k, 1); draw(); });
      return el('div', { class: 'reply-item' }, ti, tx, rm);
    }));
    draw();
    const add = el('button', { type: 'button', class: 'btn-b' }, icon('plus'), el('span', {}, t.settings.add)); add.addEventListener('click', () => { replies.push({ title: '', text: '' }); draw(); });
    const save2 = el('button', { type: 'button', class: 'btn-a' }, t.settings.save);
    save2.addEventListener('click', async () => {
      save2.disabled = true; ok2.textContent = '';
      replies = replies.filter((q) => q.title.trim() && q.text.trim()).map((q) => ({ title: q.title.trim(), text: q.text.trim() }));
      try { await setDoc(doc(db, 'config', 'replies'), { items: replies, updatedAt: serverTimestamp() }); ok2.textContent = t.settings.saved; draw(); note(t.settings.replies); } catch { ok2.textContent = S.generic; }
      save2.disabled = false;
    });
    const warn = el('p', { class: 'err', role: 'alert' });
    const notify = el('input', { type: 'checkbox', checked: store.get('notify') === '1' }) as HTMLInputElement;
    notify.addEventListener('change', async () => {
      if (notify.checked && 'Notification' in window && Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') { notify.checked = false; warn.textContent = t.settings.denied; } }
      store.set('notify', notify.checked ? '1' : '0');
    });
    const sound = el('input', { type: 'checkbox', checked: store.get('sound') === '1' }) as HTMLInputElement;
    sound.addEventListener('change', () => { store.set('sound', sound.checked ? '1' : '0'); if (sound.checked) chime(); });
    const csvBtn = el('button', { type: 'button', class: 'btn-b' }, icon('download'), el('span', {}, t.settings.csv));
    csvBtn.addEventListener('click', () => download(`requests-${new Date().toISOString().slice(0, 10)}.csv`, csv(rows), 'text/csv'));
    const jsonBtn = el('button', { type: 'button', class: 'btn-b' }, icon('download'), el('span', {}, t.settings.json));
    jsonBtn.addEventListener('click', () => download(`portfolio-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ requests: rows.map(plain), clients: clients().map((c) => plain({ id: c.id, name: c.name, email: c.email, contact: c.contact, contactValue: c.contactValue, lang: c.lang, createdAt: c.createdAt } as unknown as Row)), config: { site, replies } }, null, 2), 'application/json'));
    const toggle = (input: HTMLInputElement, label: string) => el('label', { class: 'toggle big' }, input, el('span', {}, label));
    panel.replaceChildren(heading(t.settings.title), el('p', { class: 'lede' }, t.settings.lead),
      el('div', { class: 'con-grid' },
        card(t.settings.availability, null, toggle(accepting, t.settings.accepting),
          el('label', { class: 'field' }, el('span', {}, t.settings.responseDays), days), el('small', { class: 'soft' }, t.settings.responseHint),
          el('label', { class: 'field' }, el('span', {}, t.settings.noticeEs), nEs), el('label', { class: 'field' }, el('span', {}, t.settings.noticeEn), nEn), el('small', { class: 'soft' }, t.settings.noticeHint),
          el('p', { class: 'calls' }, save1, ok1)),
        card(t.settings.replies, t.settings.repliesLead, list, el('p', { class: 'calls' }, add, save2, ok2)),
        card(t.settings.alerts, null, toggle(notify, t.settings.notify), toggle(sound, t.settings.sound), warn),
        card(t.settings.data, t.settings.dataLead, el('p', { class: 'calls' }, csvBtn, jsonBtn))));
  };

  const system = async () => {
    const status = el('dd', {}, '…'), latency = el('dd', {}, '…');
    const check = async () => {
      const t0 = performance.now();
      try { await getDoc(doc(db, 'config', 'site')); status.replaceChildren(el('span', { class: 'health ok' }, t.system.ok)); latency.textContent = `${Math.round(performance.now() - t0)} ms`; }
      catch { status.replaceChildren(el('span', { class: 'health bad' }, t.system.fail)); latency.textContent = '—'; }
    };
    const token = await user.getIdTokenResult();
    const again = el('button', { type: 'button', class: 'btn-b small' }, t.system.check); again.addEventListener('click', () => { status.textContent = '…'; check(); });
    const row = (k: string, v: string | Node) => el('div', {}, el('dt', {}, k), typeof v === 'string' ? el('dd', {}, v) : v);
    const links: [string, string][] = [[t.system.linkItems.auth, 'authentication/users'], [t.system.linkItems.data, 'firestore/databases/-default-/data'], [t.system.linkItems.rules, 'firestore/databases/-default-/rules'], [t.system.linkItems.usage, 'usage']];
    panel.replaceChildren(heading(t.system.title), el('p', { class: 'lede' }, t.system.lead),
      el('div', { class: 'con-grid' },
        card(t.system.connection, null, el('dl', { class: 'facts col' }, el('div', {}, el('dt', {}, t.system.connection), status), el('div', {}, el('dt', {}, t.system.latency), latency), row(t.system.region, REGION)), el('p', { class: 'calls' }, again)),
        card(t.system.session, null, el('dl', { class: 'facts col' }, row('Email', user.email || '—'), row(t.system.provider, String(token.signInProvider || '—')), row(t.system.claim, token.claims.admin ? t.head.role : '—'),
          row(t.system.expires, new Date(token.expirationTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })))),
        card(t.system.data, null, el('dl', { class: 'facts col' }, row(t.system.docs.requests, String(sent().length)), row(t.system.docs.drafts, String(rows.filter((r) => r.status === 'draft').length)),
          row(t.system.docs.clients, String(users.length)), row(t.system.docs.messages, String(sent().filter((r) => r.lastAt).length))),
          el('p', { class: 'kicker' }, t.system.quota), el('ul', { class: 'quota' }, ...t.system.quotaItems.map((q) => el('li', {}, q)))),
        card(t.system.project, null, el('dl', { class: 'facts col' }, row(t.system.project, web.projectId), row(t.system.app, web.appId.split(':').slice(-1)[0]), row(t.system.builtAt, new Date(ctx.build).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }))),
          el('p', { class: 'kicker' }, t.system.links), el('p', { class: 'reach' }, ...links.map(([l, p]) => el('a', { class: 'chip-link', href: `https://console.firebase.google.com/project/${web.projectId}/${p}`, target: '_blank', rel: 'noopener' }, l, icon('external'))))),
        card(t.system.log, null, log.length ? el('ul', { class: 'con-log' }, ...log.map((l) => el('li', {}, l))) : el('p', { class: 'soft' }, t.system.logEmpty))));
    check();
  };

  // CSV and downloads.
  const plain = (r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof (v as Timestamp).toDate === 'function' ? (v as Timestamp).toDate().toISOString()
    : v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, Timestamp>).map(([a, b]) => [a, b && typeof b.toDate === 'function' ? b.toDate().toISOString() : b])) : v]));
  const csv = (list: Row[]) => {
    const cols = ['id', 'status', 'priority', 'name', 'email', 'kinds', 'idea', 'forWhom', 'where', 'when', 'budget', 'contact', 'contactValue', 'lang', 'submittedAt', 'firstResponseAt', 'updatedAt'];
    const cell = (v: unknown) => `"${String(Array.isArray(v) ? v.join(' | ') : v ?? '').replace(/"/g, '""')}"`;
    return '﻿' + [cols.join(','), ...list.map((r) => { const p = plain(r) as Record<string, unknown>; return cols.map((c) => cell(p[c])).join(','); })].join('\r\n');
  };
  const download = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    note(name);
  };

  function route(fresh = true) {
    stopThread?.(); stopThread = null;
    const hash = location.hash.slice(1) || 'overview';
    current = hash;
    if (fresh) { panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); }
    const top = hash.split('/')[0];
    nav.querySelectorAll('a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.route === top || (a.dataset.route === 'requests' && top === 'request') || (a.dataset.route === 'clients' && top === 'client')));
    if (top === 'requests') requestsPanel();
    else if (top === 'request') detail(hash.slice(8));
    else if (top === 'board') board();
    else if (top === 'inbox') inbox();
    else if (top === 'clients') clientsPanel();
    else if (top === 'client') clientDetail(hash.slice(7));
    else if (top === 'stats') stats();
    else if (top === 'settings') settings();
    else if (top === 'system') system();
    else overview();
    panel.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
  }
  addEventListener('hashchange', () => { route(); panel.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); });
  route();
}
