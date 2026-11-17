// "Start your project": create an account, then answer one question at a time, each with the time it takes.
// Answers are saved after every step (Firestore `requests/{uid}`), so a person can leave and resume later.
import { leave, loadRequest, saveRequest, signIn, signInGoogle, signUp, watchUser, type Request } from '../lib/accounts';

type Q = { key: string; title: string; hint?: string; time: string; type: 'multi' | 'one' | 'text' | 'contact'; options?: string[]; placeholder?: string; optional?: boolean };
type Copy = {
  steps: string[]; question: string; of: string; next: string; back: string; optional: string;
  account: Record<string, string>; q: Q[]; review: Record<string, string>; done: { title: string[]; lead: string; status: string; received: string; out: string; from: string; statuses: Record<string, string> };
  errors: Record<string, string>;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {}, ...kids: (Node | string | null)[]) => {
  const n = document.createElement(tag); const { class: cls, ...rest } = props as Record<string, unknown>;
  if (cls) n.className = cls as string; Object.assign(n, rest); for (const k of kids) if (k !== null) n.append(k); return n;
};

export function startFlow(root: HTMLElement) {
  const c: Copy = JSON.parse(root.dataset.copy!);
  const lang = root.dataset.lang!;
  const view = root.querySelector<HTMLElement>('[data-view]')!;
  const stepsBar = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  let uid = '', data: Request = { status: 'draft' }, isNew = true, mode: 'create' | 'signin' = 'create';

  const markStep = (n: number) => stepsBar.forEach((s, k) => { s.dataset.state = k < n ? 'done' : k === n ? 'now' : ''; });
  const show = (node: HTMLElement) => { view.replaceChildren(node); node.classList.add('enter'); view.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true }); };
  const errorText = (e: unknown) => {
    const code = (e as { code?: string })?.code || '';
    if (code.includes('invalid-email')) return c.errors.email;
    if (code.includes('email-already-in-use')) return c.errors.inUse;
    if (code.includes('weak-password')) return c.errors.weak;
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return c.errors.wrong;
    return c.errors.generic;
  };

  const accountView = () => {
    markStep(0);
    const err = el('p', { class: 'err', role: 'alert' });
    const name = el('input', { type: 'text', name: 'name', autocomplete: 'name', required: true });
    const email = el('input', { type: 'email', name: 'email', autocomplete: 'email', required: true });
    const pass = el('input', { type: 'password', name: 'password', autocomplete: mode === 'create' ? 'new-password' : 'current-password', required: true, minLength: 6 });
    const field = (label: string, input: HTMLInputElement) => el('label', { class: 'field' }, el('span', {}, label), input);
    const submit = el('button', { type: 'submit', class: 'btn-a' }, mode === 'create' ? c.account.create : c.account.signin, el('span', { class: 'arrow' }, '→'));
    const form = el('form', { class: 'acct-form', noValidate: true }, ...(mode === 'create' ? [field(c.account.name, name)] : []), field(c.account.email, email), field(c.account.password, pass), err, submit);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = ''; submit.disabled = true;
      try { if (mode === 'create') await signUp(name.value.trim(), email.value.trim(), pass.value); else await signIn(email.value.trim(), pass.value); }
      catch (x) { err.textContent = errorText(x); submit.disabled = false; }
    });
    const google = el('button', { type: 'button', class: 'btn-google' }, el('span', { class: 'g' }, 'G'), c.account.google);
    google.addEventListener('click', async () => { err.textContent = ''; try { await signInGoogle(); } catch (x) { err.textContent = errorText(x); } });
    const swap = el('button', { type: 'button', class: 'link' }, mode === 'create' ? c.account.have : c.account.need);
    swap.addEventListener('click', () => { mode = mode === 'create' ? 'signin' : 'create'; show(accountView()); });
    return el('div', { class: 'card' },
      el('p', { class: 'time' }, c.account.time),
      el('h2', {}, c.account.title), el('p', { class: 'lede' }, c.account.lead),
      google, el('p', { class: 'or' }, c.account.or), form, swap);
  };

  const groupOf = (i: number) => (i <= 1 ? 1 : i <= 5 ? 2 : 3);
  const questionView = (i: number) => {
    const q = c.q[i]; markStep(groupOf(i));
    const err = el('p', { class: 'err', role: 'alert' });
    let input: HTMLElement; let read: () => unknown;
    if (q.type === 'text') {
      const t = el('textarea', { rows: 6, placeholder: q.placeholder || '', value: (data[q.key as keyof Request] as string) || '' });
      input = t; read = () => t.value.trim();
    } else {
      const multi = q.type === 'multi';
      const current = data[q.key as keyof Request];
      const chosen = new Set<string>(Array.isArray(current) ? current : current ? [String(current)] : []);
      const box = el('div', { class: 'choices', role: multi ? 'group' : 'radiogroup' });
      for (const o of q.options || []) {
        const b = el('button', { type: 'button', class: 'choice' }, o);
        b.setAttribute(multi ? 'aria-pressed' : 'aria-checked', String(chosen.has(o))); if (!multi) b.setAttribute('role', 'radio');
        b.addEventListener('click', () => {
          if (multi) { chosen.has(o) ? chosen.delete(o) : chosen.add(o); b.setAttribute('aria-pressed', String(chosen.has(o))); }
          else { chosen.clear(); chosen.add(o); box.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-checked', String(x === b))); if (q.type === 'contact') extra.hidden = o === q.options![0]; }
        });
        box.append(b);
      }
      const extra = el('input', { type: 'tel', class: 'extra', placeholder: q.placeholder || '', value: data.contactValue || '', autocomplete: 'tel' });
      extra.hidden = q.type !== 'contact' || !chosen.size || chosen.has(q.options![0]);
      input = q.type === 'contact' ? el('div', {}, box, extra) : box;
      read = () => (multi ? [...chosen] : [...chosen][0] || '');
      if (q.type === 'contact') {
        const base = read; read = () => { const v = base(); return v ? { v, extra: extra.hidden ? '' : extra.value.trim() } : ''; };
      }
    }
    const back = el('button', { type: 'button', class: 'btn-b' }, c.back);
    back.addEventListener('click', () => show(i === 0 ? accountDone() : questionView(i - 1)));
    const next = el('button', { type: 'submit', class: 'btn-a' }, c.next, el('span', { class: 'arrow' }, '→'));
    const form = el('form', { class: 'q-form' }, input, err, el('p', { class: 'calls' }, back, next));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const v = read();
      const empty = v === '' || (Array.isArray(v) && !v.length);
      if (empty && !q.optional) { err.textContent = c.errors.required; return; }
      if (q.type === 'contact' && v && typeof v === 'object' && !Array.isArray(v)) { const cv = v as { v: string; extra: string }; data.contact = cv.v; data.contactValue = cv.extra; }
      else (data as Record<string, unknown>)[q.key] = v;
      data.step = i + 1; next.disabled = true;
      try { await saveRequest(uid, { ...data, lang, status: 'draft' }, isNew); isNew = false; show(i + 1 < c.q.length ? questionView(i + 1) : reviewView()); }
      catch { err.textContent = c.errors.generic; next.disabled = false; }
    });
    const progress = el('div', { class: 'qbar' }, el('i', {}));
    (progress.firstChild as HTMLElement).style.transform = `scaleX(${(i + 1) / (c.q.length + 1)})`;
    return el('div', { class: 'card' }, progress,
      el('p', { class: 'time' }, `${c.question} ${i + 1} ${c.of} ${c.q.length} · ${q.time}${q.optional ? ' · ' + c.optional : ''}`),
      el('h2', {}, q.title), q.hint ? el('p', { class: 'lede' }, q.hint) : null, form);
  };
  // Signed in with nothing answered yet: "back" from the first question returns here, to the account summary.
  const accountDone = () => questionView(0);

  const answerOf = (q: Q) => {
    if (q.type === 'contact') return [data.contact, data.contactValue].filter(Boolean).join(' · ');
    const v = data[q.key as keyof Request]; return Array.isArray(v) ? v.join(', ') : String(v || '—');
  };
  const reviewView = () => {
    markStep(4);
    const err = el('p', { class: 'err', role: 'alert' });
    const list = el('dl', { class: 'review' });
    c.q.forEach((q, i) => {
      const edit = el('button', { type: 'button', class: 'link' }, c.review.edit); edit.addEventListener('click', () => show(questionView(i)));
      list.append(el('div', {}, el('dt', {}, q.title, edit), el('dd', {}, answerOf(q))));
    });
    const send = el('button', { type: 'button', class: 'btn-a big' }, c.review.send, el('span', { class: 'arrow' }, '→'));
    send.addEventListener('click', async () => {
      send.disabled = true;
      try { data.status = 'submitted'; await saveRequest(uid, { ...data, lang }, isNew); show(doneView()); }
      catch { data.status = 'draft'; err.textContent = c.errors.generic; send.disabled = false; }
    });
    return el('div', { class: 'card' }, el('h2', {}, c.review.title), el('p', { class: 'lede' }, c.review.lead), list, err, el('p', { class: 'calls' }, send));
  };

  const doneView = () => {
    stepsBar.forEach((s) => { s.dataset.state = 'done'; });
    const out = el('button', { type: 'button', class: 'link' }, c.done.out); out.addEventListener('click', () => leave());
    const h = el('h2', {}, c.done.title[0], el('em', {}, c.done.title[1]));
    return el('div', { class: 'card done' }, el('span', { class: 'burst' }, ...Array.from({ length: 10 }, () => el('i'))), h, el('p', { class: 'lede' }, c.done.lead),
      el('p', { class: 'status' }, el('span', {}, c.done.status), el('b', {}, c.done.statuses[data.status] || c.done.received)),
      data.message ? el('div', { class: 'admin-msg' }, el('small', {}, c.done.from), el('p', {}, data.message)) : null, out);
  };

  watchUser(async (user) => {
    if (!user) { uid = ''; data = { status: 'draft' }; isNew = true; show(accountView()); return; }
    uid = user.uid;
    const saved = await loadRequest(uid).catch(() => null);
    isNew = !saved;
    data = saved || { status: 'draft', name: user.displayName || '', email: user.email || '' };
    if (data.status !== 'draft') show(doneView());
    else if ((data.step || 0) >= c.q.length) show(reviewView());
    else show(questionView(data.step || 0));
  });
}
