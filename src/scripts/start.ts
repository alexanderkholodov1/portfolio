// "Start your project": one question at a time, each with the time it takes, saved after every step so a person can
// leave and resume. Signing in happens on the one sign-in page (My account) and brings the person back here. A person
// can have any number of requests: `?id=` resumes a draft, `?new=1` starts another, and otherwise the latest draft
// is resumed or a new request begins. `?ref=<project>` records the project that inspired the request.
// His notes of 2026-11-16/18 (docs/plan/10-client-services.md): anything can be asked for; how it is delivered sets
// the price (relative marks, never invented amounts); payment, agreement and a call are asked only for big projects.
import { ensureProfile, getRequest, loadProfile, loadSite, myRequests, saveRequest, watchUser, type Answers, type Request, type Site } from '../lib/accounts';
import { el } from '../lib/dom';

type Q = { key: string; title: string; hint?: string; time: string; type: 'multi' | 'one' | 'text' | 'contact' | 'deliver'; options?: string[]; placeholder?: string; optional?: boolean; show?: 'deliver' | 'big' };
type Copy = {
  steps: string[]; question: string; of: string; next: string; back: string; optional: string; loading: string; paused: string; days: string;
  q: Q[]; kindGroups: string[]; deliver: { names: Record<string, string>; groups: Record<string, [string, string][]>; other: string; cost: string }; inspired: string;
  review: Record<string, string>; done: { title: string[]; lead: string; status: string; received: string; view: string; another: string; statuses: Record<string, string> };
  errors: Record<string, string>;
};
type Data = Answers & { status: string; step?: number; deliverables?: string[]; payment?: string; agreement?: string[]; ref?: string };

// The fields a draft carries back into the questionnaire.
const KEEP = ['name', 'email', 'kinds', 'idea', 'deliverables', 'forWhom', 'where', 'when', 'budget', 'payment', 'agreement', 'contact', 'contactValue', 'lang', 'step', 'ref'];

export function startFlow(root: HTMLElement) {
  const c: Copy = JSON.parse(root.dataset.copy!);
  const lang = root.dataset.lang!;
  const accountHref = root.dataset.account!;
  const projects: Record<string, string> = JSON.parse(root.dataset.projects || '{}');
  const view = root.querySelector<HTMLElement>('[data-view]')!;
  const stepsBar = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const params = new URLSearchParams(location.search);
  let uid = '', rid: string | null = null, data: Data = { status: 'draft' }, site: Site | null = null;

  const markStep = (n: number) => stepsBar.forEach((s, k) => { s.dataset.state = k < n ? 'done' : k === n ? 'now' : ''; });
  const show = (node: HTMLElement) => { view.replaceChildren(node); node.classList.add('enter'); view.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true }); };

  // Which groups the chosen kinds belong to, and which questions apply to them.
  const groups = () => [...new Set((data.kinds || []).map((k) => c.kindGroups[(c.q[0].options || []).indexOf(k)]).filter(Boolean))];
  const applies = (q: Q) => !q.show || (q.show === 'deliver' ? groups().length > 0 : groups().includes('software'));
  const visible = () => c.q.map((q, i) => (applies(q) ? i : -1)).filter((i) => i >= 0);
  const nextFrom = (i: number) => visible().find((k) => k > i);
  const prevFrom = (i: number) => [...visible()].reverse().find((k) => k < i);
  const stepOf = (q: Q) => (q.key === 'kinds' || q.key === 'idea' ? 1 : q.key === 'contact' ? 3 : 2);

  const questionView = (i: number) => {
    const q = c.q[i]; markStep(stepOf(q));
    const err = el('p', { class: 'err', role: 'alert' });
    let input: HTMLElement; let read: () => unknown;
    const value = (data as Record<string, unknown>)[q.key];
    if (q.type === 'text') {
      const t = el('textarea', { rows: 6, placeholder: q.placeholder || '', value: (value as string) || '', 'aria-label': q.title, maxLength: 5000 }) as HTMLTextAreaElement;
      input = t; read = () => t.value.trim();
    } else if (q.type === 'deliver') {
      // Options for each chosen kind, grouped, each with its relative cost; always a way to ask for a recommendation.
      const chosen = new Set<string>(Array.isArray(value) ? value : []);
      const toggle = (b: HTMLButtonElement, o: string) => b.addEventListener('click', () => { chosen.has(o) ? chosen.delete(o) : chosen.add(o); b.setAttribute('aria-pressed', String(chosen.has(o))); });
      const sections = groups().map((g) => el('div', { class: 'deliver-group' }, el('p', { class: 'kicker' }, c.deliver.names[g]),
        el('div', { class: 'choices', role: 'group', 'aria-label': c.deliver.names[g] }, ...c.deliver.groups[g].map(([label, cost]) => {
          const b = el('button', { type: 'button', class: 'choice cost', 'aria-pressed': String(chosen.has(label)) }, label, el('span', { class: 'mark', title: c.deliver.cost }, cost)) as HTMLButtonElement;
          toggle(b, label); return b;
        }))));
      const rec = el('button', { type: 'button', class: 'choice', 'aria-pressed': String(chosen.has(c.deliver.other)) }, c.deliver.other) as HTMLButtonElement;
      toggle(rec, c.deliver.other);
      input = el('div', { class: 'deliver' }, ...sections, el('div', { class: 'choices' }, rec));
      read = () => [...chosen];
    } else {
      const multi = q.type === 'multi';
      const chosen = new Set<string>(Array.isArray(value) ? value : value ? [String(value)] : []);
      const box = el('div', { class: 'choices', role: multi ? 'group' : 'radiogroup', 'aria-label': q.title });
      const extra = el('input', { type: 'tel', class: 'extra', placeholder: q.placeholder || '', value: data.contactValue || '', autocomplete: 'tel', 'aria-label': q.placeholder || q.title }) as HTMLInputElement;
      for (const o of q.options || []) {
        const b = el('button', { type: 'button', class: 'choice' }, o);
        b.setAttribute(multi ? 'aria-pressed' : 'aria-checked', String(chosen.has(o))); if (!multi) b.setAttribute('role', 'radio');
        b.addEventListener('click', () => {
          if (multi) { chosen.has(o) ? chosen.delete(o) : chosen.add(o); b.setAttribute('aria-pressed', String(chosen.has(o))); }
          else { chosen.clear(); chosen.add(o); box.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-checked', String(x === b))); if (q.type === 'contact') extra.hidden = o === q.options![0]; }
        });
        box.append(b);
      }
      extra.hidden = q.type !== 'contact' || !chosen.size || chosen.has(q.options![0]);
      input = q.type === 'contact' ? el('div', {}, box, extra) : box;
      read = () => (multi ? [...chosen] : [...chosen][0] || '');
      if (q.type === 'contact') { const base = read; read = () => { const v = base(); return v ? { v, extra: extra.hidden ? '' : extra.value.trim() } : ''; }; }
    }
    const before = prevFrom(i);
    const back = before === undefined ? el('a', { class: 'btn-b', href: accountHref }, c.back) : el('button', { type: 'button', class: 'btn-b' }, c.back);
    if (before !== undefined) back.addEventListener('click', () => show(questionView(before)));
    const next = el('button', { type: 'submit', class: 'btn-a' }, c.next, el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'));
    const form = el('form', { class: 'q-form' }, input, err, el('p', { class: 'calls' }, back, next));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const v = read();
      const empty = v === '' || (Array.isArray(v) && !v.length);
      if (empty && !q.optional) { err.textContent = c.errors.required; return; }
      if (q.type === 'contact' && v && typeof v === 'object' && !Array.isArray(v)) { const cv = v as { v: string; extra: string }; data.contact = cv.v; data.contactValue = cv.extra; }
      else (data as Record<string, unknown>)[q.key] = v;
      const after = nextFrom(i);
      data.step = Math.max(data.step || 0, after ?? c.q.length); next.disabled = true;
      try { rid = await saveRequest(rid, uid, { ...data, lang, status: 'draft' }); show(after !== undefined ? questionView(after) : reviewView()); }
      catch { err.textContent = c.errors.generic; next.disabled = false; }
    });
    const list = visible(); const n = list.indexOf(i) + 1;
    const progress = el('div', { class: 'qbar' }, el('i', {}));
    (progress.firstChild as HTMLElement).style.transform = `scaleX(${n / (list.length + 1)})`;
    return el('div', { class: 'card' }, progress, inspiredBy(),
      el('p', { class: 'time' }, `${c.question} ${n} ${c.of} ${list.length} · ${q.time}${q.optional ? ' · ' + c.optional : ''}`),
      el('h2', {}, q.title), q.hint ? el('p', { class: 'lede' }, q.hint) : null, form);
  };
  const inspiredBy = () => (data.ref && projects[data.ref] ? el('p', { class: 'inspired' }, `${c.inspired}: `, el('b', {}, projects[data.ref])) : null);

  const answerOf = (q: Q) => {
    if (q.type === 'contact') return [data.contact, data.contactValue].filter(Boolean).join(' · ') || '—';
    const v = (data as Record<string, unknown>)[q.key]; return Array.isArray(v) ? v.join(', ') || '—' : String(v || '—');
  };
  const reviewView = () => {
    markStep(4);
    const err = el('p', { class: 'err', role: 'alert' });
    const list = el('dl', { class: 'review' });
    for (const i of visible()) {
      const q = c.q[i];
      const edit = el('button', { type: 'button', class: 'link' }, c.review.edit); edit.addEventListener('click', () => show(questionView(i)));
      list.append(el('div', {}, el('dt', {}, q.title, edit), el('dd', {}, answerOf(q))));
    }
    const send = el('button', { type: 'button', class: 'btn-a big' }, c.review.send, el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'));
    send.addEventListener('click', async () => {
      send.disabled = true;
      // Answers to questions that no longer apply (the kinds changed) are removed before sending.
      const drop = c.q.filter((q) => !applies(q)).map((q) => q.key);
      for (const k of drop) delete (data as Record<string, unknown>)[k];
      try { rid = await saveRequest(rid, uid, { ...data, lang, status: 'submitted' }, drop); data.status = 'submitted'; show(doneView()); }
      catch { err.textContent = c.errors.generic; send.disabled = false; }
    });
    return el('div', { class: 'card' }, inspiredBy(), el('h2', {}, c.review.title), el('p', { class: 'lede' }, c.review.lead), list, err, el('p', { class: 'calls' }, send));
  };

  // Sent: the next step is the account, where the request, its progress and the conversation live.
  const doneView = () => {
    stepsBar.forEach((s) => { s.dataset.state = 'done'; });
    const h = el('h2', {}, c.done.title[0], el('em', {}, c.done.title[1]));
    return el('div', { class: 'card done' }, el('span', { class: 'burst', 'aria-hidden': 'true' }, ...Array.from({ length: 10 }, () => el('i'))), h, el('p', { class: 'lede' }, c.done.lead),
      el('p', { class: 'status' }, el('span', {}, c.done.status), el('b', {}, c.done.statuses[data.status] || c.done.received)),
      site?.responseDays ? el('p', { class: 'soft' }, c.days.replace('{n}', String(site.responseDays))) : null,
      el('p', { class: 'calls center' },
        el('a', { class: 'btn-a big', href: `${accountHref}#request/${rid}` }, c.done.view, el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→')),
        el('a', { class: 'btn-b', href: `${location.pathname}?new=1` }, c.done.another)));
  };

  const begin = (r: Request | null, name: string, email: string, contact?: string, contactValue?: string) => {
    if (r && r.status !== 'draft') { location.replace(`${accountHref}#request/${r.id}`); return; }
    rid = r?.id ?? null;
    const answers = r ? Object.fromEntries(Object.entries(r).filter(([k]) => KEEP.includes(k))) : {};
    data = r ? { ...answers, status: 'draft' } : { status: 'draft', name, email, ...(contact ? { contact, contactValue } : {}) };
    const ref = params.get('ref');
    if (ref && projects[ref] && !data.ref) data.ref = ref;
    const at = visible().find((k) => k >= (data.step || 0));
    if (at === undefined) show(reviewView()); else show(questionView(at));
  };

  view.replaceChildren(el('div', { class: 'card' }, el('p', { class: 'soft' }, c.loading)));
  watchUser(async (user) => {
    if (!user) { location.replace(`${accountHref}?next=start${params.get('ref') ? '&ref=' + encodeURIComponent(params.get('ref')!) : ''}`); return; }
    uid = user.uid; markStep(1);
    ensureProfile(user);
    const [profile, settings] = await Promise.all([loadProfile(user), loadSite()]);
    site = settings;
    // While he is not taking new projects, the questionnaire says so first (his availability in the console).
    if (site && !site.accepting && !root.querySelector('.notice')) view.before(el('p', { class: 'notice', role: 'status' }, (lang === 'es' ? site.noticeEs : site.noticeEn) || c.paused));
    const id = params.get('id');
    if (id) { begin(await getRequest(id).catch(() => null), profile.name || '', profile.email || ''); return; }
    if (params.get('new') || params.get('ref')) { begin(null, profile.name || '', profile.email || '', profile.contact, profile.contactValue); return; }
    const draft = (await myRequests(uid).catch(() => [])).find((r) => r.status === 'draft') ?? null;
    begin(draft, profile.name || '', profile.email || '', profile.contact, profile.contactValue);
  });
}
