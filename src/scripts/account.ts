// "My account": the one page for accounts. Signed out, it is the sign-in page. Signed in, it is the client's home:
// an overview, every request with its progress and its conversation with Alexander, the profile, and security.
// It is for clients only: an account with the admin role goes to the admin console, a separate environment (his
// note of 2026-11-17: "son dos entornos completamente distintos").
import type { User } from 'firebase/auth';
import {
  acceptPlan, discard, ensureProfile, isAdmin, leave, loadProfile, loadSite, markRead, myRequests, rate, saveProfile, sendMessage, unreadFor, usesPassword,
  watchMessages, watchUser, when, withdraw, resetPassword, type Message, type Profile, type Request, type Site,
} from '../lib/accounts';
import { el, icon } from '../lib/dom';
import { signinCard, type ErrorCopy, type SigninCopy } from './signin';

type Copy = {
  loading: string;
  gate: { eyebrow: string; title: string[]; lead: string; perks: string[]; startLead: string };
  signin: SigninCopy; errors: ErrorCopy;
  nav: Record<'overview' | 'requests' | 'profile' | 'security' | 'out' | 'new', string>;
  overview: Record<'hello' | 'lead' | 'newLead' | 'latest' | 'draft' | 'continue' | 'unread' | 'open' | 'empty' | 'explore' | 'services' | 'projects', string> & { newTitle: string[] };
  requests: Record<'lead' | 'all' | 'active' | 'drafts' | 'closed' | 'empty' | 'updated' | 'sent' | 'created' | 'untitled' | 'discard' | 'sure' | 'yes' | 'no' | 'newMsg', string> & { title: string[] };
  detail: Record<'back' | 'progress' | 'chat' | 'chatLead' | 'placeholder' | 'send' | 'you' | 'him' | 'noMsgs' | 'answers' | 'withdraw' | 'withdrawSure' | 'withdrawYes', string> & { steps: string[]; ended: Record<string, string> };
  profile: Record<'lead' | 'name' | 'email' | 'contact' | 'number' | 'lang' | 'save' | 'saved', string> & { title: string[]; contacts: string[]; langs: Record<string, string> };
  security: Record<'lead' | 'method' | 'google' | 'password' | 'created' | 'last' | 'change' | 'changeLead' | 'sent' | 'googleNote' | 'out', string> & { title: string[] };
  statuses: Record<string, string>; fields: Record<string, string>;
  plan: Record<string, string>; agreementDoc: Record<string, string>; rating: Record<string, string>;
};
export type Shell = {
  copy: Copy; lang: string; user: User; links: Record<string, string>;
  nav: HTMLElement; panel: HTMLElement; go: (hash: string) => void;
  heading: (parts: string[]) => HTMLElement; pill: (status: string) => HTMLElement; timeline: (r: Request) => HTMLElement;
  thread: (r: Request, side: 'client' | 'admin', names: { me: string; other: string }) => HTMLElement;
  answers: (r: Request) => HTMLElement; titleOf: (r: Request) => string;
};

const FLOW = ['submitted', 'reviewing', 'proposal', 'in-progress', 'delivered'];
const ENDED = ['closed', 'declined', 'withdrawn'];

export function startAccount(root: HTMLElement) {
  const c: Copy = JSON.parse(root.dataset.copy!);
  const lang = root.dataset.lang!;
  const links: Record<string, string> = JSON.parse(root.dataset.links!);
  const view = root.querySelector<HTMLElement>('[data-view]')!;
  const next = new URLSearchParams(location.search).get('next');
  let stopThread: (() => void) | null = null;

  const heading = (parts: string[], tag: 'h1' | 'h2' = 'h1') => el(tag, {}, parts[0], parts[1] ? el('em', {}, parts[1]) : null, parts[2] ?? null);
  const pill = (status: string) => el('span', { class: `pill s-${status}` }, c.statuses[status] || status);
  const titleOf = (r: Request) => (r.kinds?.length ? r.kinds.join(' · ') : c.requests.untitled);

  // Signed out: the sign-in page.
  const gate = () => {
    view.replaceChildren(el('div', { class: 'acct-gate' },
      el('div', { class: 'gate-copy' },
        el('p', { class: 'kicker' }, c.gate.eyebrow), heading(c.gate.title),
        el('p', { class: 'lede' }, next === 'start' ? c.gate.startLead : c.gate.lead),
        el('ul', { class: 'perks' }, ...c.gate.perks.map((p, k) => el('li', { style: `--i:${k}` }, icon(['requests', 'chat', 'overview'][k] || 'overview'), el('span', {}, p))))),
      signinCard(c.signin, c.errors, next === 'start' ? 'up' : 'in')));
  };

  const timeline = (r: Request) => {
    const at = FLOW.indexOf(r.status);
    const ol = el('ol', { class: 'timeline', 'aria-label': c.detail.progress });
    FLOW.forEach((s, k) => {
      const stamp = s === 'submitted' ? r.submittedAt : r.statusAt?.[s];
      ol.append(el('li', { class: at < 0 ? '' : k < at ? 'done' : k === at ? 'now' : '' }, el('span', {}, c.detail.steps[k]), stamp ? el('small', {}, when(stamp, lang)) : null));
    });
    return ol;
  };

  const answers = (r: Request) => el('dl', { class: 'review' }, ...Object.entries(c.fields).map(([k, label]) => {
    const v = k === 'contact' ? [r.contact, r.contactValue].filter(Boolean).join(' · ') : (r as Record<string, unknown>)[k];
    const text = Array.isArray(v) ? v.join(', ') : v ? String(v) : '—';
    return el('div', {}, el('dt', {}, label), el('dd', {}, text));
  }));

  // A live conversation for one request; `side` is who is reading.
  const thread = (r: Request, side: 'client' | 'admin', names: { me: string; other: string }) => {
    stopThread?.();
    const box = el('div', { class: 'thread', 'aria-live': 'polite' });
    const legacy: Message[] = r.message ? [{ id: 'legacy', from: 'admin', uid: '', text: r.message, at: r.updatedAt }] : [];
    stopThread = watchMessages(r.id, (msgs) => {
      const all = [...legacy, ...msgs];
      box.replaceChildren(...(all.length ? all.map((m) => el('div', { class: 'msg' + (m.from === side ? ' me' : '') },
        el('p', {}, m.text), el('small', {}, `${m.from === side ? names.me : names.other} · ${when(m.at, lang, true)}`))) : [el('p', { class: 'soft empty' }, c.detail.noMsgs)]));
      box.scrollTop = box.scrollHeight;
    });
    const text = el('textarea', { rows: 2, placeholder: c.detail.placeholder, 'aria-label': c.detail.placeholder, maxLength: 4000 }) as HTMLTextAreaElement;
    const send = el('button', { type: 'submit', class: 'btn-a send' }, icon('send'), el('span', {}, c.detail.send));
    const err = el('p', { class: 'err', role: 'alert' });
    const form = el('form', { class: 'composer' }, text, send);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const t = text.value.trim(); if (!t) return;
      send.disabled = true; err.textContent = '';
      try { await sendMessage(r.id, user!.uid, t, side); text.value = ''; } catch { err.textContent = c.errors.generic; }
      send.disabled = false; text.focus();
    });
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
    return el('div', { class: 'chat' }, box, ENDED.includes(r.status) && side === 'client' ? null : form, err);
  };

  let user: User | null = null, profile: Profile = {}, mine: Request[] = [], site: Site | null = null;
  const money = (n?: number, cur = 'USD') => (typeof n === 'number' ? n.toLocaleString(lang === 'es' ? 'es-EC' : 'en-US', { style: 'currency', currency: cur || 'USD' }) : '—');
  const day = (iso?: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-EC' : 'en-US', { dateStyle: 'medium' }) : '');
  const fill = (s: string, map: Record<string, string | number>) => Object.entries(map).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, String(v)), s);

  // The plan the admin published: stages with a link to try each, payments and what is due now, scope, ownership,
  // corrections and warranty, how to pay; accepted once, and turned into a printable service agreement.
  const planCard = (r: Request, panel: HTMLElement) => {
    const p = r.plan!; const P = c.plan;
    const owed = (p.payments || []).find((x) => !x.paid);
    const accept = el('button', { type: 'button', class: 'btn-a' }, P.accept);
    accept.addEventListener('click', async () => { accept.disabled = true; try { await acceptPlan(r.id); r.acceptedAt = { toDate: () => new Date(), toMillis: () => Date.now() } as never; detail(panel, r.id); } catch { accept.disabled = false; } });
    const doc = el('button', { type: 'button', class: 'btn-b' }, P.agreement); doc.addEventListener('click', () => agreement(r));
    const change = el('a', { class: 'link', href: '#' }, P.change);
    change.addEventListener('click', (e) => { e.preventDefault(); panel.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus(); });
    const howTo = (lang === 'es' ? site?.payInfoEs : site?.payInfoEn) || '';
    return el('section', { class: 'acct-card plan', 'aria-label': P.title },
      el('div', { class: 'plan-head' }, el('h2', {}, P.title), r.free ? el('span', { class: 'pill s-delivered' }, P.free) : null),
      el('p', { class: 'soft' }, p.summary || P.lead),
      (p.milestones || []).length ? el('div', {}, el('p', { class: 'kicker' }, P.milestones), el('ol', { class: 'stages' }, ...(p.milestones || []).map((m) => el('li', { class: m.done ? 'done' : '' },
        el('span', { class: 'tick', 'aria-hidden': 'true' }), el('span', { class: 'who' }, el('b', {}, m.title), m.due ? el('small', {}, day(m.due)) : null),
        m.link ? el('a', { class: 'chip-link', href: m.link, target: '_blank', rel: 'noopener' }, P.try) : m.done ? el('small', { class: 'soft' }, P.done) : null)))) : null,
      el('dl', { class: 'facts col' },
        p.due ? el('div', {}, el('dt', {}, P.due), el('dd', {}, day(p.due))) : null,
        !r.free && typeof p.price === 'number' ? el('div', {}, el('dt', {}, P.price), el('dd', {}, money(p.price, p.currency))) : null,
        ...(r.free ? [] : (p.payments || []).map((x) => el('div', {}, el('dt', {}, x.label), el('dd', {}, `${money(x.amount, p.currency)} · ${x.paid ? P.paid : P.pending}`)))),
        owed && !r.free ? el('div', { class: 'owed' }, el('dt', {}, P.now), el('dd', {}, money(owed.amount, p.currency))) : null),
      p.includes ? el('div', {}, el('p', { class: 'kicker' }, P.includes), el('p', { class: 'pre' }, p.includes)) : null,
      p.excludes ? el('div', {}, el('p', { class: 'kicker' }, P.excludes), el('p', { class: 'pre' }, p.excludes)) : null,
      p.ownership ? el('div', {}, el('p', { class: 'kicker' }, P.ownership), el('p', { class: 'pre' }, p.ownership)) : null,
      el('p', { class: 'soft small' }, [typeof p.corrections === 'number' ? fill(P.corrections, { n: p.corrections }) : '', typeof p.warrantyDays === 'number' && p.warrantyDays ? fill(P.warranty, { n: p.warrantyDays }) : ''].filter(Boolean).join(' · ')),
      howTo && !r.free ? el('div', {}, el('p', { class: 'kicker' }, P.howToPay), el('p', { class: 'pre' }, howTo)) : null,
      el('p', { class: 'calls' }, r.acceptedAt ? el('span', { class: 'ok' }, `${P.accepted} ${when(r.acceptedAt, lang)}`) : accept, doc, change));
  };

  const agreement = (r: Request) => {
    const p = r.plan || {}; const A = c.agreementDoc;
    const close = el('button', { type: 'button', class: 'btn-b' }, c.plan.close);
    const print = el('button', { type: 'button', class: 'btn-a' }, c.plan.print);
    const sheet = el('div', { class: 'agreement-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': A.title },
      el('article', { class: 'agreement' },
        el('h1', {}, A.title),
        el('p', {}, fill(A.between, { provider: 'Alexander Kholodov', client: r.name || r.email || '—' })),
        el('h2', {}, A.request), el('p', {}, `${titleOf(r)} — ${r.idea || ''}`),
        el('h2', {}, A.scope), el('p', { class: 'pre' }, [p.summary, p.includes && `${c.plan.includes}: ${p.includes}`, p.excludes && `${c.plan.excludes}: ${p.excludes}`].filter(Boolean).join('\n\n') || '—'),
        el('h2', {}, A.schedule), el('ol', {}, ...(p.milestones || []).map((m) => el('li', {}, `${m.title}${m.due ? ' — ' + day(m.due) : ''}`))),
        r.free ? null : el('h2', {}, A.price),
        r.free ? null : el('p', {}, [typeof p.price === 'number' ? money(p.price, p.currency) : '', ...(p.payments || []).map((x) => `${x.label}: ${money(x.amount, p.currency)}`)].filter(Boolean).join(' · ')),
        el('h2', {}, A.ownership), el('p', { class: 'pre' }, p.ownership || '—'),
        el('h2', {}, A.warranty), el('p', {}, [typeof p.corrections === 'number' ? fill(c.plan.corrections, { n: p.corrections }) : '', p.warrantyDays ? fill(c.plan.warranty, { n: p.warrantyDays }) : ''].filter(Boolean).join(' · ') || '—'),
        el('h2', {}, A.acceptance), el('p', {}, r.acceptedAt ? fill(A.acceptedOn, { date: when(r.acceptedAt, lang, true) }) : A.notYet),
        el('p', { class: 'soft small' }, A.note)),
      el('p', { class: 'calls no-print' }, print, close));
    const done = () => { sheet.remove(); document.body.classList.remove('printing'); removeEventListener('keydown', esc); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') done(); };
    close.addEventListener('click', done); print.addEventListener('click', () => window.print());
    addEventListener('keydown', esc);
    document.body.append(sheet); document.body.classList.add('printing'); print.focus();
  };

  // After delivery: stars, a few words, and consent to show them on the Services page.
  const ratingCard = (r: Request, panel: HTMLElement) => {
    const R = c.rating;
    if (r.rating) return el('section', { class: 'acct-card' }, el('h2', {}, R.yours), el('p', { class: 'stars-view', 'aria-label': `${r.rating.stars}/5` }, '★'.repeat(r.rating.stars) + '☆'.repeat(5 - r.rating.stars)), r.rating.comment ? el('p', { class: 'pre' }, r.rating.comment) : null, el('p', { class: 'ok' }, R.thanks));
    let stars = 0;
    const row = el('div', { class: 'stars', role: 'radiogroup', 'aria-label': R.stars });
    const paint = () => row.querySelectorAll('button').forEach((b, k) => { b.setAttribute('aria-checked', String(k + 1 === stars)); b.classList.toggle('on', k < stars); });
    for (let k = 1; k <= 5; k++) { const b = el('button', { type: 'button', role: 'radio', 'aria-label': String(k), 'aria-checked': 'false' }, '★'); b.addEventListener('click', () => { stars = k; paint(); }); row.append(b); }
    const text = el('textarea', { rows: 3, maxLength: 1000, placeholder: R.comment, 'aria-label': R.comment }) as HTMLTextAreaElement;
    const consent = el('input', { type: 'checkbox', checked: true }) as HTMLInputElement;
    const send = el('button', { type: 'button', class: 'btn-a' }, R.send);
    send.addEventListener('click', async () => { if (!stars) { row.querySelector('button')?.focus(); return; } send.disabled = true; try { await rate(r.id, stars, text.value.trim(), consent.checked); r.rating = { stars, comment: text.value.trim(), public: consent.checked }; detail(panel, r.id); } catch { send.disabled = false; } });
    return el('section', { class: 'acct-card rate' }, el('h2', {}, R.title), el('p', { class: 'soft' }, R.lead), row, text, el('label', { class: 'toggle' }, consent, el('span', {}, R.consent)), el('p', { class: 'calls' }, send));
  };
  let shell: Shell | null = null;

  const navButton = (hash: string, label: string, name: string, badge = 0) => {
    const a = el('a', { href: '#' + hash, data: { route: hash } }, icon(name), el('span', {}, label), badge ? el('b', { class: 'badge' }, String(badge)) : null);
    return a;
  };

  const layout = (admin: boolean) => {
    const initial = (profile.name || user!.email || '?').trim().charAt(0).toUpperCase();
    const unread = mine.filter((r) => unreadFor(r, 'client')).length;
    const nav = el('nav', { class: 'acct-nav', 'aria-label': c.nav.overview },
      navButton('overview', c.nav.overview, 'overview'), navButton('requests', c.nav.requests, 'requests', unread),
      navButton('profile', c.nav.profile, 'profile'), navButton('security', c.nav.security, 'security'));
    const out = el('button', { type: 'button', class: 'acct-out' }, icon('out'), el('span', {}, c.nav.out));
    out.addEventListener('click', () => leave());
    const side = el('aside', { class: 'acct-side' },
      el('div', { class: 'acct-me' }, el('span', { class: 'avatar', 'aria-hidden': 'true' }, initial), el('div', {}, el('b', {}, profile.name || user!.displayName || ''), el('small', {}, user!.email || ''))),
      el('a', { class: 'btn-a acct-new', href: links.start + '?new=1' }, icon('plus'), el('span', {}, c.nav.new)), nav, out);
    const panel = el('div', { class: 'acct-main' });
    view.replaceChildren(el('div', { class: 'acct' + (admin ? ' is-admin' : '') }, side, panel));
    shell = { copy: c, lang, user: user!, links, nav, panel, go: (h) => { location.hash = h; }, heading: (p) => heading(p, 'h1'), pill, timeline, thread, answers, titleOf };
  };

  // Panels.
  const overview = (panel: HTMLElement) => {
    const latest = mine.find((r) => r.status !== 'draft');
    const draft = mine.find((r) => r.status === 'draft');
    const unread = mine.filter((r) => unreadFor(r, 'client'));
    const first = (profile.name || user!.displayName || '').split(' ')[0];
    const cards: HTMLElement[] = [
      el('a', { class: 'acct-card acct-hero', href: links.start + '?new=1' },
        el('span', { class: 'glow', 'aria-hidden': 'true' }), el('h2', {}, c.overview.newTitle[0], el('em', {}, c.overview.newTitle[1])),
        el('p', {}, c.overview.newLead), el('span', { class: 'go' }, c.nav.new, el('span', { 'aria-hidden': 'true' }, ' →'))),
    ];
    for (const r of unread) cards.push(el('a', { class: 'acct-card note', href: '#request/' + r.id }, el('span', { class: 'dot-new', 'aria-hidden': 'true' }), el('b', {}, c.overview.unread), el('span', {}, titleOf(r)), el('span', { class: 'go' }, c.overview.open + ' →')));
    if (latest) cards.push(el('a', { class: 'acct-card', href: '#request/' + latest.id }, el('small', { class: 'kicker' }, c.overview.latest), el('b', {}, titleOf(latest)), pill(latest.status), timeline(latest), el('span', { class: 'go' }, c.overview.open + ' →')));
    if (draft) cards.push(el('a', { class: 'acct-card', href: links.start + '?id=' + draft.id }, el('small', { class: 'kicker' }, c.overview.draft), el('b', {}, titleOf(draft)), el('p', { class: 'soft clamp' }, draft.idea || ''), el('span', { class: 'go' }, c.overview.continue + ' →')));
    if (!mine.length) cards.push(el('div', { class: 'acct-card empty' }, el('p', {}, c.overview.empty)));
    cards.push(el('div', { class: 'acct-card explore' }, el('small', { class: 'kicker' }, c.overview.explore),
      el('a', { href: links.services }, c.overview.services, ' →'), el('a', { href: links.projects }, c.overview.projects, ' →')));
    panel.replaceChildren(heading([c.overview.hello, first || '', '']), el('p', { class: 'lede' }, c.overview.lead), el('div', { class: 'acct-cards' }, ...cards));
  };

  let filter = 'all';
  const requestsPanel = (panel: HTMLElement) => {
    const groups: Record<string, (r: Request) => boolean> = {
      all: () => true, active: (r) => FLOW.includes(r.status), drafts: (r) => r.status === 'draft', closed: (r) => ENDED.includes(r.status),
    };
    const bar = el('div', { class: 'filters' }, ...Object.keys(groups).map((k) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(filter === k) }, c.requests[k as 'all']);
      b.addEventListener('click', () => { filter = k; requestsPanel(panel); }); return b;
    }));
    const shown = mine.filter(groups[filter]);
    const list = el('div', { class: 'req-list' }, ...(shown.length ? shown.map((r) => {
      const isDraft = r.status === 'draft';
      const card = el('div', { class: 'req' },
        el('a', { class: 'req-main', href: isDraft ? links.start + '?id=' + r.id : '#request/' + r.id },
          el('span', { class: 'req-top' }, pill(r.status), unreadFor(r, 'client') ? el('span', { class: 'new' }, el('span', { class: 'dot-new', 'aria-hidden': 'true' }), c.requests.newMsg) : null,
            r.plan?.publishedAt && !r.acceptedAt ? el('span', { class: 'new calm' }, c.plan.title) : null),
          el('b', {}, titleOf(r)), r.idea ? el('p', { class: 'clamp' }, r.idea) : null,
          el('small', {}, `${isDraft ? c.requests.created : c.requests.updated} ${when(r.updatedAt || r.createdAt, lang)}`)));
      if (isDraft) {
        const drop = el('button', { type: 'button', class: 'link soft' }, c.requests.discard);
        drop.addEventListener('click', () => {
          const yes = el('button', { type: 'button', class: 'link danger' }, c.requests.yes), no = el('button', { type: 'button', class: 'link' }, c.requests.no);
          const ask = el('span', { class: 'ask' }, el('span', {}, c.requests.sure), yes, no);
          drop.replaceWith(ask); no.addEventListener('click', () => ask.replaceWith(drop));
          yes.addEventListener('click', async () => { await discard(r.id); mine = mine.filter((x) => x.id !== r.id); requestsPanel(panel); });
        });
        card.append(el('div', { class: 'req-actions' }, el('a', { class: 'link', href: links.start + '?id=' + r.id }, c.overview.continue), drop));
      }
      return card;
    }) : [el('p', { class: 'soft empty' }, c.requests.empty)]));
    panel.replaceChildren(heading(c.requests.title), el('p', { class: 'lede' }, c.requests.lead), bar, list);
  };

  const detail = (panel: HTMLElement, id: string) => {
    const r = mine.find((x) => x.id === id);
    if (!r) { location.hash = 'requests'; return; }
    if (unreadFor(r, 'client')) markRead(r.id, 'client').then(() => { r.clientReadAt = r.lastAt; }).catch(() => undefined);
    const back = el('a', { class: 'back', href: '#requests' }, icon('back'), c.detail.back);
    const ended = ENDED.includes(r.status) ? el('p', { class: 'ended' }, c.detail.ended[r.status] || '') : null;
    let action: HTMLElement | null = null;
    if (r.status === 'submitted' || r.status === 'reviewing') {
      const w = el('button', { type: 'button', class: 'link danger' }, c.detail.withdraw);
      w.addEventListener('click', () => {
        const yes = el('button', { type: 'button', class: 'link danger' }, c.detail.withdrawYes), no = el('button', { type: 'button', class: 'link' }, c.requests.no);
        const ask = el('span', { class: 'ask' }, el('span', {}, c.detail.withdrawSure), yes, no);
        w.replaceWith(ask); no.addEventListener('click', () => ask.replaceWith(w));
        yes.addEventListener('click', async () => { await withdraw(r.id); r.status = 'withdrawn'; detail(panel, id); });
      });
      action = w;
    }
    const rated = ['delivered', 'closed'].includes(r.status) && (r.status === 'delivered' || r.statusAt?.delivered);
    panel.replaceChildren(back,
      el('div', { class: 'detail-head' }, el('h1', {}, titleOf(r)), pill(r.status)),
      el('p', { class: 'soft' }, `${c.requests.sent} ${when(r.submittedAt || r.createdAt, lang)}`),
      ended || timeline(r),
      el('div', { class: 'acct-split' },
        el('div', { class: 'stack' },
          r.plan?.publishedAt ? planCard(r, panel) : null,
          el('section', { class: 'acct-card', 'aria-label': c.detail.chat }, el('h2', {}, c.detail.chat), el('p', { class: 'soft' }, c.detail.chatLead), thread(r, 'client', { me: c.detail.you, other: c.detail.him }))),
        el('div', { class: 'stack' },
          rated ? ratingCard(r, panel) : null,
          el('section', { class: 'acct-card', 'aria-label': c.detail.answers }, el('h2', {}, c.detail.answers), answers(r), action))));
  };

  const profilePanel = (panel: HTMLElement) => {
    const name = el('input', { type: 'text', value: profile.name || '', autocomplete: 'name', maxLength: 120 }) as HTMLInputElement;
    const email = el('input', { type: 'email', value: user!.email || '', readOnly: true }) as HTMLInputElement;
    let contact = profile.contact || c.profile.contacts[0];
    const choices = el('div', { class: 'choices', role: 'radiogroup', 'aria-label': c.profile.contact });
    const number = el('input', { type: 'tel', value: profile.contactValue || '', autocomplete: 'tel', placeholder: c.profile.number, maxLength: 200 }) as HTMLInputElement;
    const sync = () => { number.closest('label')!.hidden = contact === c.profile.contacts[0]; };
    for (const o of c.profile.contacts) {
      const b = el('button', { type: 'button', class: 'choice', role: 'radio', 'aria-checked': String(o === contact) }, o);
      b.addEventListener('click', () => { contact = o; choices.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-checked', String(x === b))); sync(); });
      choices.append(b);
    }
    let pref = profile.lang || lang;
    const langs = el('div', { class: 'choices', role: 'radiogroup', 'aria-label': c.profile.lang });
    for (const [k, label] of Object.entries(c.profile.langs)) {
      const b = el('button', { type: 'button', class: 'choice', role: 'radio', 'aria-checked': String(k === pref) }, label);
      b.addEventListener('click', () => { pref = k; langs.querySelectorAll('.choice').forEach((x) => x.setAttribute('aria-checked', String(x === b))); });
      langs.append(b);
    }
    const ok = el('span', { class: 'ok', role: 'status' }); const err = el('p', { class: 'err', role: 'alert' });
    const save = el('button', { type: 'submit', class: 'btn-a' }, c.profile.save);
    const form = el('form', { class: 'acct-form acct-card' },
      el('label', { class: 'field' }, el('span', {}, c.profile.name), name),
      el('label', { class: 'field' }, el('span', {}, c.profile.email), email),
      el('div', { class: 'field' }, el('span', {}, c.profile.contact), choices),
      el('label', { class: 'field' }, el('span', {}, c.profile.number), number),
      el('div', { class: 'field' }, el('span', {}, c.profile.lang), langs), err, el('p', { class: 'calls' }, save, ok));
    sync();
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); save.disabled = true; ok.textContent = ''; err.textContent = '';
      const data: Profile = { name: name.value.trim(), contact, contactValue: contact === c.profile.contacts[0] ? '' : number.value.trim(), lang: pref };
      try { await saveProfile(user!, data); profile = { ...profile, ...data }; ok.textContent = c.profile.saved; } catch { err.textContent = c.errors.generic; }
      save.disabled = false;
    });
    panel.replaceChildren(heading(c.profile.title), el('p', { class: 'lede' }, c.profile.lead), form);
  };

  const securityPanel = (panel: HTMLElement) => {
    const meta = user!.metadata;
    const fmt = (s?: string) => (s ? new Date(s).toLocaleString(lang === 'es' ? 'es-EC' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
    const rows = el('dl', { class: 'review' },
      el('div', {}, el('dt', {}, c.security.method), el('dd', {}, usesPassword(user!) ? c.security.password : c.security.google)),
      el('div', {}, el('dt', {}, c.security.created), el('dd', {}, fmt(meta.creationTime))),
      el('div', {}, el('dt', {}, c.security.last), el('dd', {}, fmt(meta.lastSignInTime))));
    let change: HTMLElement;
    if (usesPassword(user!)) {
      const ok = el('p', { class: 'ok', role: 'status' });
      const b = el('button', { type: 'button', class: 'btn-b' }, c.security.change);
      b.addEventListener('click', async () => { b.disabled = true; try { await resetPassword(user!.email || ''); ok.textContent = c.security.sent; } catch { ok.textContent = c.errors.generic; } b.disabled = false; });
      change = el('div', { class: 'acct-card' }, el('h2', {}, c.security.change), el('p', { class: 'soft' }, c.security.changeLead), el('p', { class: 'calls' }, b), ok);
    } else change = el('div', { class: 'acct-card' }, el('p', { class: 'soft' }, c.security.googleNote));
    const out = el('button', { type: 'button', class: 'btn-b' }, icon('out'), el('span', {}, c.security.out)); out.addEventListener('click', () => leave());
    panel.replaceChildren(heading(c.security.title), el('p', { class: 'lede' }, c.security.lead),
      el('div', { class: 'acct-split' }, el('div', { class: 'acct-card' }, rows, el('p', { class: 'calls' }, out)), change));
  };

  const route = () => {
    if (!user || !shell) return;
    stopThread?.(); stopThread = null;
    const hash = location.hash.slice(1) || 'overview';
    const panel = shell.panel;
    panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter');
    shell.nav.querySelectorAll('a').forEach((a) => a.toggleAttribute('aria-current', hash === a.dataset.route || hash.startsWith(a.dataset.route + '/') || (a.dataset.route === 'requests' && hash.startsWith('request/'))));
    if (hash === 'requests') requestsPanel(panel);
    else if (hash.startsWith('request/')) detail(panel, hash.slice(8));
    else if (hash === 'profile') profilePanel(panel);
    else if (hash === 'security') securityPanel(panel);
    else overview(panel);
    panel.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
  };
  addEventListener('hashchange', () => { route(); shell?.panel.querySelector<HTMLElement>('h1')?.focus({ preventScroll: false }); });

  watchUser(async (u) => {
    user = u; stopThread?.(); stopThread = null;
    if (!u) { shell = null; gate(); return; }
    if (next === 'start') { const ref = new URLSearchParams(location.search).get('ref'); location.replace(links.start + (ref ? '?ref=' + encodeURIComponent(ref) : '')); return; }
    view.replaceChildren(el('p', { class: 'acct-loading' }, c.loading));
    ensureProfile(u);
    const [p, list, admin, settings] = await Promise.all([loadProfile(u), myRequests(u.uid).catch(() => []), isAdmin(u).catch(() => false), loadSite()]);
    profile = p; mine = list; site = settings;
    if (admin) { location.replace(links.admin); return; }
    layout(false);
    route();
  });
}
