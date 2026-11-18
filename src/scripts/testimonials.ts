// Real clients' opinions on the Services page (his note of 2026-11-16: "necesariamente reales, de preferencia en sus
// palabras reales"). He chooses them in the console; the section stays hidden until at least one exists. One small
// public read over REST, without loading the Firebase SDK on this page.
import web from '../data/firebase-web.json';

type Field = { stringValue?: string; integerValue?: string };
type Doc = { fields?: Record<string, Field> };

export async function showTestimonials(section: HTMLElement) {
  const list = section.querySelector<HTMLElement>('[data-quotes]');
  if (!list) return;
  const emulated = import.meta.env.PUBLIC_ACCOUNTS_EMULATORS === '1';
  const url = emulated
    ? 'http://127.0.0.1:8080/v1/projects/demo-portfolio/databases/(default)/documents/testimonials'
    : `https://firestore.googleapis.com/v1/projects/${web.projectId}/databases/(default)/documents/testimonials?key=${web.apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const docs: Doc[] = ((await res.json()) as { documents?: Doc[] }).documents || [];
    const items = docs.map((d) => d.fields || {}).filter((f) => f.text?.stringValue);
    if (!items.length) return;
    list.replaceChildren(...items.map((f) => {
      const li = document.createElement('li');
      const stars = Math.max(1, Math.min(5, Number(f.stars?.integerValue || 5)));
      const s = document.createElement('p'); s.className = 'q-stars'; s.setAttribute('aria-label', `${stars}/5`); s.textContent = '★'.repeat(stars);
      const q = document.createElement('blockquote'); q.textContent = f.text!.stringValue!;
      const who = document.createElement('p'); who.className = 'q-who';
      const b = document.createElement('b'); b.textContent = f.name?.stringValue || '';
      const k = document.createElement('span'); k.textContent = f.kind?.stringValue || '';
      who.append(b, k); li.append(s, q, who);
      return li;
    }));
    section.hidden = false;
  } catch { /* offline or blocked: the page simply has no testimonials section */ }
}
