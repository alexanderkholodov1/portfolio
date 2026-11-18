// The home's project showcase: a spotlight with one project's purpose and actions, beside a grid of all of them.
// It moves on by itself every few seconds (a bar shows the time) and pauses while the visitor is on it; hovering or
// tapping a tile brings that project into the spotlight, with a soft crossfade.
export function startShowcase(root: HTMLElement) {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const bar = root.querySelector<HTMLElement>('.spot-bar i');
  if (!slides.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL = 6500;
  let current = 0, timer = 0, paused = false, seen = true;

  const spot = root.querySelector<HTMLElement>('[data-spot]');
  // Screen readers hear the spotlight only when the visitor picks a project, never on the automatic turns.
  const show = (i: number, picked = false) => {
    if (spot) spot.setAttribute('aria-live', picked ? 'polite' : 'off');
    if (i === current) return;
    slides[current].classList.remove('in'); slides[current].hidden = true;
    current = i; slides[i].hidden = false; void slides[i].offsetWidth; slides[i].classList.add('in');
    picks.forEach((p, k) => p.setAttribute('aria-pressed', String(k === i)));
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = paused || reduce ? 'none' : ''; }
    if (!paused && !reduce) timer = window.setTimeout(() => { if (seen && !document.hidden) show((current + 1) % slides.length); else restart(); }, DWELL);
  };
  root.style.setProperty('--dwell', `${DWELL}ms`);
  slides[0].classList.add('in');
  picks.forEach((p, k) => {
    p.addEventListener('click', () => show(k, true));
    p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(k, true); });
    p.addEventListener('focus', () => show(k, true));
  });
  const area = root.querySelector('.sc-grid')!;
  area.addEventListener('pointerenter', () => { paused = true; restart(); });
  area.addEventListener('pointerleave', () => { paused = false; restart(); });
  new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(root);
  restart();
}
