// The one sign-in card of the site: Google or email, a new account, or a password reset. Every way into an account
// goes through it (his note of 2026-11-17: one unified sign-in page).
import { resetPassword, signIn, signInGoogle, signUp } from '../lib/accounts';
import { el, icon } from '../lib/dom';

export type SigninCopy = Record<'titleIn' | 'titleUp' | 'titleReset' | 'google' | 'or' | 'name' | 'email' | 'password' | 'passwordNew' | 'show' | 'hide' | 'in' | 'up' | 'toUp' | 'toIn' | 'forgot' | 'resetLead' | 'resetSend' | 'resetSent' | 'back', string>;
export type ErrorCopy = Record<'generic' | 'email' | 'inUse' | 'weak' | 'wrong' | 'popup' | 'tooMany' | 'required', string>;

export function errorText(e: unknown, c: ErrorCopy) {
  const code = (e as { code?: string })?.code || '';
  if (code.includes('invalid-email') || code.includes('missing-email')) return c.email;
  if (code.includes('email-already-in-use')) return c.inUse;
  if (code.includes('weak-password')) return c.weak;
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return c.wrong;
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return c.popup;
  if (code.includes('too-many-requests')) return c.tooMany;
  return c.generic;
}

export function signinCard(c: SigninCopy, errors: ErrorCopy, start: 'in' | 'up' = 'in') {
  let mode: 'in' | 'up' | 'reset' = start;
  const card = el('div', { class: 'auth-card' });
  const field = (label: string, input: HTMLInputElement, extra?: Node) => el('label', { class: 'field' }, el('span', {}, label), extra ? el('span', { class: 'with-btn' }, input, extra) : input);

  const render = () => {
    const err = el('p', { class: 'err', role: 'alert' });
    const ok = el('p', { class: 'ok', role: 'status' });
    const name = el('input', { type: 'text', name: 'name', autocomplete: 'name', required: true }) as HTMLInputElement;
    const email = el('input', { type: 'email', name: 'email', autocomplete: 'email', required: true }) as HTMLInputElement;
    const pass = el('input', { type: 'password', name: 'password', autocomplete: mode === 'up' ? 'new-password' : 'current-password', required: true, minLength: 6 }) as HTMLInputElement;
    const peek = el('button', { type: 'button', class: 'peek', 'aria-pressed': 'false' }, icon('eye'), el('span', {}, c.show));
    peek.addEventListener('click', () => {
      const showing = pass.type === 'text'; pass.type = showing ? 'password' : 'text';
      peek.setAttribute('aria-pressed', String(!showing)); peek.querySelector('span:last-child')!.textContent = showing ? c.show : c.hide;
    });
    const title = el('h2', {}, mode === 'in' ? c.titleIn : mode === 'up' ? c.titleUp : c.titleReset);

    if (mode === 'reset') {
      const send = el('button', { type: 'submit', class: 'btn-a' }, c.resetSend, el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'));
      const form = el('form', { class: 'acct-form', noValidate: true }, field(c.email, email), err, ok, send);
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); err.textContent = ''; ok.textContent = '';
        if (!email.value.trim()) { err.textContent = errors.email; return; }
        send.disabled = true;
        try { await resetPassword(email.value.trim()); ok.textContent = c.resetSent; }
        catch (x) { const code = (x as { code?: string })?.code || ''; if (code.includes('user-not-found')) ok.textContent = c.resetSent; else err.textContent = errorText(x, errors); }
        send.disabled = false;
      });
      const back = el('button', { type: 'button', class: 'link' }, '← ' + c.back); back.addEventListener('click', () => { mode = 'in'; render(); });
      card.replaceChildren(title, el('p', { class: 'lede' }, c.resetLead), form, back);
      email.focus({ preventScroll: true });
      return;
    }

    const submit = el('button', { type: 'submit', class: 'btn-a' }, mode === 'up' ? c.up : c.in, el('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'));
    const form = el('form', { class: 'acct-form', noValidate: true },
      mode === 'up' ? field(c.name, name) : null, field(c.email, email), field(mode === 'up' ? c.passwordNew : c.password, pass, peek), err, submit);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = '';
      if ((mode === 'up' && !name.value.trim()) || !email.value.trim() || !pass.value) { err.textContent = errors.required; return; }
      submit.disabled = true;
      try { if (mode === 'up') await signUp(name.value.trim(), email.value.trim(), pass.value); else await signIn(email.value.trim(), pass.value); }
      catch (x) { err.textContent = errorText(x, errors); submit.disabled = false; }
    });
    const google = el('button', { type: 'button', class: 'btn-google' }, el('span', { class: 'g', 'aria-hidden': 'true' }, 'G'), c.google);
    google.addEventListener('click', async () => { err.textContent = ''; try { await signInGoogle(); } catch (x) { err.textContent = errorText(x, errors); } });
    const swap = el('button', { type: 'button', class: 'link' }, mode === 'up' ? c.toIn : c.toUp);
    swap.addEventListener('click', () => { mode = mode === 'up' ? 'in' : 'up'; render(); });
    const forgot = mode === 'in' ? el('button', { type: 'button', class: 'link soft' }, c.forgot) : null;
    forgot?.addEventListener('click', () => { mode = 'reset'; render(); });
    card.replaceChildren(title, google, el('p', { class: 'or' }, c.or), form, el('p', { class: 'auth-swap' }, swap, forgot));
  };
  render();
  return card;
}
