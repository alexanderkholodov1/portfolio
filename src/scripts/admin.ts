// The operator's request desk: every client request, newest first, with filters by status, a detail view with the
// client's answers, the status workflow, a message the client sees, and private notes. Access is enforced by the
// Firestore rules (custom claim `admin`); this page only shows what the rules allow.
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { accounts, leave, signIn, signInGoogle, watchUser } from '../lib/accounts';

type Req = { id: string; name?: string; email?: string; kinds?: string[]; idea?: string; forWhom?: string; where?: string; when?: string; budget?: string; contact?: string; contactValue?: string; lang?: string; status: string; message?: string; priority?: string; submittedAt?: { toDate(): Date }; updatedAt?: { toDate(): Date } };
type Copy = { title: string; signin: string; email: string; password: string; google: string; denied: string; out: string; all: string; empty: string; save: string; saved: string; message: string; status: string; note: string; addNote: string; notes: string; priority: string; statuses: Record<string, string>; fields: Record<string, string> };

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string | null | undefined)[]) => {
  const n = document.createElement(tag); const { class: c, ...rest } = props; if (c) n.className = String(c); Object.assign(n, rest);
  for (const k of kids) if (k != null) n.append(k); return n;
};
const when = (t?: { toDate(): Date }) => (t ? t.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export function startAdmin(root: HTMLElement) {
  const c: Copy = JSON.parse(root.dataset.copy!);
  const view = root.querySelector<HTMLElement>('[data-view]')!;
  let rows: Req[] = [], filter = 'all';

  const login = () => {
    const err = el('p', { class: 'err', role: 'alert' });
    const email = el('input', { type: 'email', autocomplete: 'email', placeholder: c.email }) as HTMLInputElement;
    const pass = el('input', { type: 'password', autocomplete: 'current-password', placeholder: c.password }) as HTMLInputElement;
    const go = el('button', { type: 'submit', class: 'btn-a' }, c.signin);
    const form = el('form', { class: 'acct-form' }, email, pass, err, go);
    form.addEventListener('submit', async (e) => { e.preventDefault(); err.textContent = ''; try { await signIn(email.value.trim(), pass.value); } catch { err.textContent = c.denied; } });
    const g = el('button', { type: 'button', class: 'btn-google' }, c.google); g.addEventListener('click', () => signInGoogle().catch(() => { err.textContent = c.denied; }));
    view.replaceChildren(el('div', { class: 'card admin-login' }, el('h2', {}, c.signin), g, form));
  };

  const load = async () => {
    const snap = await getDocs(query(collection(accounts().db, 'requests'), orderBy('updatedAt', 'desc')));
    rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Req, 'id'>) })).filter((r) => r.status !== 'draft');
  };

  const list = () => {
    const counts: Record<string, number> = { all: rows.length };
    for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
    const bar = el('div', { class: 'filters' }, ...['all', ...Object.keys(c.statuses)].map((s) => {
      const b = el('button', { type: 'button' }, `${s === 'all' ? c.all : c.statuses[s]} · ${counts[s] || 0}`);
      b.setAttribute('aria-pressed', String(filter === s)); b.addEventListener('click', () => { filter = s; list(); }); return b;
    }));
    const shown = rows.filter((r) => filter === 'all' || r.status === filter);
    const table = el('div', { class: 'admin-table' }, ...(shown.length ? shown.map((r) => {
      const row = el('button', { type: 'button', class: 'admin-row' },
        el('span', { class: `pill s-${r.status}` }, c.statuses[r.status] || r.status),
        el('b', {}, r.name || r.email || r.id),
        el('span', {}, (r.kinds || []).join(', ')),
        el('span', { class: 'soft' }, r.priority ? `${c.priority} ${r.priority}` : ''),
        el('time', {}, when(r.submittedAt || r.updatedAt)));
      row.addEventListener('click', () => detail(r)); return row;
    }) : [el('p', { class: 'soft' }, c.empty)]));
    const out = el('button', { type: 'button', class: 'link' }, c.out); out.addEventListener('click', () => leave());
    view.replaceChildren(el('div', { class: 'admin-head' }, el('h2', {}, c.title), out), bar, table);
  };

  const detail = async (r: Req) => {
    const ref = doc(accounts().db, 'requests', r.id);
    const facts = el('dl', { class: 'review' }, ...Object.entries(c.fields).map(([k, label]) => {
      const v = (r as Record<string, unknown>)[k]; const text = Array.isArray(v) ? v.join(', ') : v ? String(v) : '—';
      return el('div', {}, el('dt', {}, label), el('dd', {}, text));
    }));
    const status = el('select', {}) as HTMLSelectElement;
    for (const [k, label] of Object.entries(c.statuses)) status.append(el('option', { value: k, selected: k === r.status }, label));
    const priority = el('select', {}) as HTMLSelectElement;
    for (const p of ['', 'high', 'medium', 'low']) priority.append(el('option', { value: p, selected: (r.priority || '') === p }, p || '—'));
    const message = el('textarea', { rows: 4, value: r.message || '', placeholder: c.message }) as HTMLTextAreaElement;
    const ok = el('span', { class: 'soft' });
    const save = el('button', { type: 'button', class: 'btn-a' }, c.save);
    save.addEventListener('click', async () => {
      await updateDoc(ref, { status: status.value, priority: priority.value, message: message.value.trim(), updatedAt: serverTimestamp() });
      Object.assign(r, { status: status.value, priority: priority.value, message: message.value.trim() }); ok.textContent = c.saved;
    });
    const notesBox = el('ul', { class: 'notes' });
    const loadNotes = async () => {
      const ns = await getDocs(query(collection(ref, 'notes'), orderBy('at', 'desc')));
      notesBox.replaceChildren(...ns.docs.map((n) => el('li', {}, el('time', {}, when(n.data().at)), el('p', {}, n.data().text))));
    };
    const note = el('textarea', { rows: 2, placeholder: c.note }) as HTMLTextAreaElement;
    const addNote = el('button', { type: 'button', class: 'btn-b' }, c.addNote);
    addNote.addEventListener('click', async () => { if (!note.value.trim()) return; await addDoc(collection(ref, 'notes'), { text: note.value.trim(), at: serverTimestamp() }); note.value = ''; loadNotes(); });
    const back = el('button', { type: 'button', class: 'link' }, '← ' + c.all); back.addEventListener('click', () => list());
    view.replaceChildren(el('div', { class: 'admin-detail' },
      back, el('h2', {}, r.name || r.email || r.id), el('p', { class: 'soft' }, `${r.email || ''} · ${when(r.submittedAt)}`),
      el('div', { class: 'admin-cols' },
        el('div', { class: 'card' }, facts),
        el('div', { class: 'card admin-actions' },
          el('label', { class: 'field' }, el('span', {}, c.status), status),
          el('label', { class: 'field' }, el('span', {}, c.priority), priority),
          el('label', { class: 'field' }, el('span', {}, c.message), message),
          el('p', { class: 'calls' }, save, ok),
          el('h3', {}, c.notes), note, addNote, notesBox))));
    loadNotes();
  };

  watchUser(async (user) => {
    if (!user) return login();
    const token = await user.getIdTokenResult(true);
    if (!token.claims.admin) { const out = el('button', { type: 'button', class: 'link' }, c.out); out.addEventListener('click', () => leave()); return view.replaceChildren(el('div', { class: 'card' }, el('p', {}, c.denied), out)); }
    await load(); list();
  });
}
