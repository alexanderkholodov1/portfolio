// The admin's request desk inside "My account": every client request with search and filters, a detail with the
// client's answers and ways to reach them, the status workflow with priority, the conversation as the admin, and
// private notes; plus the list of clients. Loaded only after the admin role is confirmed; firestore.rules is what
// actually guards the data.
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { accounts, markRead, newest, unreadFor, when, type Request } from '../lib/accounts';
import { el, icon } from '../lib/dom';
import { deskCopy } from '../data/desk-copy';
import type { Shell } from './account';

const STATUSES = ['submitted', 'reviewing', 'proposal', 'in-progress', 'delivered', 'closed', 'declined', 'withdrawn'];
type Client = { id: string; name?: string; email?: string; contact?: string; contactValue?: string; lang?: string; createdAt?: { toMillis(): number; toDate(): Date } };

export function mountDesk(s: Shell) {
  const d = deskCopy[s.lang === 'es' ? 'es' : 'en'];
  const db = accounts().db;
  let rows: Request[] = [], clients: Client[] = [], filter = 'all', showDrafts = false, term = '';

  s.nav.append(el('p', { class: 'sect' }, d.section));
  const deskLink = el('a', { href: '#desk', data: { route: 'desk' } }, icon('desk'), el('span', {}, d.desk));
  const badge = el('b', { class: 'badge', hidden: true });
  deskLink.append(badge);
  s.nav.append(deskLink, el('a', { href: '#clients', data: { route: 'clients' } }, icon('clients'), el('span', {}, d.clients)));

  // Requests stay live, so new ones and new messages appear without reloading.
  let ready = false; let current = '';
  onSnapshot(query(collection(db, 'requests'), orderBy('updatedAt', 'desc')), (snap) => {
    rows = snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<Request, 'id'>) }) as Request).sort(newest);
    const waiting = rows.filter((r) => r.status === 'submitted' || unreadFor(r, 'admin')).length;
    badge.hidden = !waiting; badge.textContent = String(waiting);
    if (!ready) { ready = true; }
    if (current === 'desk') list(s.panel);
  });
  const loadClients = async () => {
    const snap = await getDocs(collection(db, 'users'));
    clients = snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<Client, 'id'>) })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  };

  const list = (panel: HTMLElement) => {
    const counts: Record<string, number> = { all: 0 };
    const visible = rows.filter((r) => showDrafts || r.status !== 'draft');
    for (const r of visible) { counts.all++; counts[r.status] = (counts[r.status] || 0) + 1; }
    const search = el('input', { type: 'search', value: term, placeholder: d.search, 'aria-label': d.search, class: 'desk-search' }) as HTMLInputElement;
    const bar = el('div', { class: 'filters' }, ...['all', ...STATUSES].filter((k) => k === 'all' || counts[k]).map((k) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(filter === k) }, `${k === 'all' ? d.all : s.copy.statuses[k]} · ${counts[k] || 0}`);
      b.addEventListener('click', () => { filter = k; list(panel); }); return b;
    }));
    const drafts = el('label', { class: 'toggle' }, el('input', { type: 'checkbox', checked: showDrafts }), el('span', {}, d.drafts));
    drafts.querySelector('input')!.addEventListener('change', (e) => { showDrafts = (e.target as HTMLInputElement).checked; list(panel); });
    const matches = (r: Request) => !term || [r.name, r.email, r.idea, ...(r.kinds || [])].join(' ').toLowerCase().includes(term.toLowerCase());
    const shown = visible.filter((r) => (filter === 'all' || r.status === filter) && matches(r));
    const table = el('div', { class: 'desk-list' }, ...(shown.length ? shown.map((r) => el('a', { class: 'desk-row', href: '#desk/' + r.id },
      s.pill(r.status),
      el('span', { class: 'who' }, el('b', {}, r.name || r.email || '—'), el('small', {}, r.email || '')),
      el('span', { class: 'what' }, s.titleOf(r)),
      el('span', { class: 'flags' }, r.priority ? el('span', { class: 'prio p-' + r.priority }, d.priorities[r.priority as 'high']) : null,
        unreadFor(r, 'admin') ? el('span', { class: 'new' }, el('span', { class: 'dot-new', 'aria-hidden': 'true' }), d.unread) : null),
      el('time', {}, when(r.submittedAt || r.updatedAt, s.lang)))) : [el('p', { class: 'soft empty' }, d.empty)]));
    search.addEventListener('input', () => { term = search.value; const pos = search.selectionStart; list(panel); const n = panel.querySelector<HTMLInputElement>('.desk-search')!; n.focus(); n.setSelectionRange(pos, pos); });
    panel.replaceChildren(s.heading(d.title), el('p', { class: 'lede' }, d.lead), el('div', { class: 'desk-tools' }, search, drafts), bar, table);
  };

  const detail = (panel: HTMLElement, id: string) => {
    const r = rows.find((x) => x.id === id);
    if (!r) { s.go('desk'); return; }
    if (unreadFor(r, 'admin')) markRead(r.id, 'admin').catch(() => undefined);
    const ref = doc(db, 'requests', r.id);
    const status = el('select', { 'aria-label': d.status }) as HTMLSelectElement;
    for (const k of STATUSES) status.append(el('option', { value: k, selected: k === r.status }, s.copy.statuses[k]));
    const priority = el('select', { 'aria-label': d.priority }) as HTMLSelectElement;
    for (const [k, label] of Object.entries(d.priorities)) priority.append(el('option', { value: k, selected: (r.priority || '') === k }, label));
    const ok = el('span', { class: 'ok', role: 'status' });
    const save = el('button', { type: 'button', class: 'btn-a' }, d.save);
    save.addEventListener('click', async () => {
      save.disabled = true; ok.textContent = '';
      const changes: Record<string, unknown> = { status: status.value, priority: priority.value, updatedAt: serverTimestamp() };
      if (status.value !== r.status) changes[`statusAt.${status.value}`] = serverTimestamp();
      try { await updateDoc(ref, changes); ok.textContent = d.saved; } catch { ok.textContent = s.copy.errors.generic; }
      save.disabled = false;
    });
    const digits = (r.contactValue || '').replace(/[^\d+]/g, '');
    const reach = el('p', { class: 'reach' },
      r.email ? el('a', { class: 'chip-link', href: `mailto:${r.email}` }, d.email) : null,
      digits && /whatsapp/i.test(r.contact || '') ? el('a', { class: 'chip-link', href: `https://wa.me/${digits.replace('+', '')}` }, d.whatsapp) : null,
      digits ? el('a', { class: 'chip-link', href: `tel:${digits}` }, d.call) : null);
    const notesBox = el('ul', { class: 'notes' });
    const loadNotes = async () => {
      const ns = await getDocs(query(collection(ref, 'notes'), orderBy('at', 'desc')));
      notesBox.replaceChildren(...ns.docs.map((n) => el('li', {}, el('time', {}, when(n.data().at, s.lang, true)), el('p', {}, n.data().text))));
    };
    const note = el('textarea', { rows: 2, placeholder: d.note, 'aria-label': d.note, maxLength: 4000 }) as HTMLTextAreaElement;
    const addNote = el('button', { type: 'button', class: 'btn-b' }, d.addNote);
    addNote.addEventListener('click', async () => { const t = note.value.trim(); if (!t) return; await addDoc(collection(ref, 'notes'), { text: t, at: serverTimestamp() }); note.value = ''; loadNotes(); });
    panel.replaceChildren(
      el('a', { class: 'back', href: '#desk' }, icon('back'), d.back),
      el('div', { class: 'detail-head' }, el('h1', {}, r.name || r.email || '—'), s.pill(r.status)),
      el('p', { class: 'soft' }, [r.email, r.lang?.toUpperCase(), when(r.submittedAt || r.createdAt, s.lang, true)].filter(Boolean).join(' · ')),
      s.timeline(r),
      el('div', { class: 'acct-split' },
        el('div', { class: 'stack' },
          el('section', { class: 'acct-card desk-actions', 'aria-label': d.status },
            el('div', { class: 'two' }, el('label', { class: 'field' }, el('span', {}, d.status), status), el('label', { class: 'field' }, el('span', {}, d.priority), priority)),
            el('p', { class: 'calls' }, save, ok)),
          el('section', { class: 'acct-card', 'aria-label': d.reply }, el('h2', {}, d.reply), el('p', { class: 'soft' }, d.replyLead), s.thread(r, 'admin', { me: d.you, other: r.name || d.client }))),
        el('div', { class: 'stack' },
          el('section', { class: 'acct-card' }, el('h2', {}, s.titleOf(r)), s.answers(r), el('h3', {}, d.reach), reach),
          el('section', { class: 'acct-card' }, el('h2', {}, d.notes), el('p', { class: 'soft' }, d.notesLead), note, el('p', { class: 'calls' }, addNote), notesBox))));
    loadNotes();
  };

  const clientsPanel = async (panel: HTMLElement) => {
    panel.replaceChildren(s.heading(d.clientsTitle), el('p', { class: 'lede' }, d.clientsLead));
    await loadClients().catch(() => undefined);
    const count = (uid: string) => rows.filter((r) => r.uid === uid && r.status !== 'draft').length;
    panel.append(el('div', { class: 'desk-list' }, ...(clients.length ? clients.map((u) => el('div', { class: 'desk-row client' },
      el('span', { class: 'avatar small', 'aria-hidden': 'true' }, (u.name || u.email || '?').charAt(0).toUpperCase()),
      el('span', { class: 'who' }, el('b', {}, u.name || '—'), el('small', {}, u.email || '')),
      el('span', { class: 'what' }, [u.contact, u.contactValue].filter(Boolean).join(' · ')),
      el('span', { class: 'flags' }, `${count(u.id)} ${d.requests}`),
      el('time', {}, u.createdAt ? `${d.joined} ${u.createdAt.toDate().toLocaleDateString(s.lang === 'es' ? 'es-EC' : 'en-US', { dateStyle: 'medium' })}` : ''))) : [el('p', { class: 'soft empty' }, d.noClients)])));
  };

  return (hash: string, panel: HTMLElement) => {
    current = hash;
    if (hash === 'desk') { list(panel); return true; }
    if (hash.startsWith('desk/')) { detail(panel, hash.slice(5)); return true; }
    if (hash === 'clients') { clientsPanel(panel); return true; }
    return false;
  };
}
