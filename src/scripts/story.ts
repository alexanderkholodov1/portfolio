// The home as one story (his note of 2026-11-18): the side rail follows the chapter in view, looping drawings run only
// while their chapter is on screen, the community stickers can be dragged around the board, and the impact cards turn
// from the problem to the project that solved it, one after another.
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function startStory() {
  const chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const links = rail ? [...rail.querySelectorAll<HTMLAnchorElement>('a[data-to]')] : [];

  // Chapters on screen are 'in-view': their loops run; the rest are paused.
  const live = new IntersectionObserver((entries) => {
    for (const e of entries) {
      e.target.classList.toggle('in-view', e.isIntersecting);
      e.target.dispatchEvent(new CustomEvent(e.isIntersecting ? 'story:on' : 'story:off'));
    }
  }, { rootMargin: '10% 0px' });
  chapters.forEach((c) => live.observe(c));

  // The rail: shown once the hero has left, the current chapter marked.
  if (rail && hero) new IntersectionObserver(([e]) => rail.classList.toggle('on', !e.isIntersecting), { threshold: 0.15 }).observe(hero);
  if (links.length) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) links.forEach((a) => a.toggleAttribute('aria-current', a.dataset.to === e.target.id));
    }, { rootMargin: '-45% 0px -50% 0px' });
    chapters.forEach((c) => spy.observe(c));
  }

  board();
  flips();
  plane();
}

// Stickers: slapped on when the board first shows, then free to drag inside it (they stay where they are dropped).
function board() {
  const b = document.querySelector<HTMLElement>('[data-board]');
  if (!b) return;
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { b.classList.add('in'); o.disconnect(); } }, { threshold: 0.2 }).observe(b);
  let top = 10;
  for (const s of b.querySelectorAll<HTMLElement>('.stk')) {
    let id = -1, sx = 0, sy = 0, bx = 0, by = 0, moved = false;
    let lim = { l: 0, r: 0, t: 0, b: 0 };
    s.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      id = e.pointerId; s.setPointerCapture(id);
      sx = e.clientX; sy = e.clientY; moved = false;
      bx = parseFloat(s.style.getPropertyValue('--tx')) || 0; by = parseFloat(s.style.getPropertyValue('--ty')) || 0;
      const br = b.getBoundingClientRect(), r = s.getBoundingClientRect();
      lim = { l: br.left - r.left + 6, r: br.right - r.right - 6, t: br.top - r.top + 6, b: br.bottom - r.bottom - 6 };
      s.classList.add('drag'); s.style.zIndex = String(++top);
    });
    s.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const dx = Math.min(lim.r, Math.max(lim.l, e.clientX - sx)), dy = Math.min(lim.b, Math.max(lim.t, e.clientY - sy));
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      s.style.setProperty('--tx', `${bx + dx}px`); s.style.setProperty('--ty', `${by + dy}px`);
      s.style.setProperty('--dr', `${Math.max(-12, Math.min(12, (e.movementX || 0) * 1.2))}deg`);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1; s.classList.remove('drag'); s.style.setProperty('--dr', '0deg');
      if (!moved && !still()) { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
    };
    s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
    s.addEventListener('animationend', () => s.classList.remove('pop'));
  }
}

// Impact cards: when the chapter shows, they turn one after another (the problem, then the project that solved it),
// then one at a time; a card under the pointer or focused turns on its own and the sequence waits.
function flips() {
  const wrap = document.querySelector<HTMLElement>('[data-flips]');
  const cards = wrap ? [...wrap.querySelectorAll<HTMLElement>('[data-flip]')] : [];
  if (!wrap || !cards.length) return;
  let timers: number[] = [], k = 0, hold = false, waved = false;
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  const show = (j: number) => cards.forEach((c, i) => c.classList.toggle('on', i === j));
  const cycle = () => { if (!hold) { show(k); k = (k + 1) % cards.length; } at(2600, cycle); };
  const run = () => {
    clear(); if (still()) return;
    if (!waved) {
      waved = true;
      cards.forEach((c, i) => { at(500 + i * 200, () => c.classList.add('on')); at(2600 + i * 200, () => c.classList.remove('on')); });
      at(3400 + cards.length * 200, cycle);
    } else at(800, cycle);
  };
  wrap.addEventListener('story:on', run);
  wrap.addEventListener('story:off', clear);
  const pause = () => { hold = true; show(-1); }, resume = () => { hold = false; };
  wrap.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse') pause(); });
  wrap.addEventListener('pointerleave', resume);
  wrap.addEventListener('focusin', pause); wrap.addEventListener('focusout', resume);
}

// The paper plane flies along its route (SVG animateMotion) only while the closing chapter is on screen.
function plane() {
  const scene = document.querySelector<HTMLElement>('#contact');
  const svg = scene?.querySelector<SVGSVGElement>('svg.flight');
  if (!scene || !svg) return;
  svg.pauseAnimations();
  scene.addEventListener('story:on', () => { if (!still()) svg.unpauseAnimations(); });
  scene.addEventListener('story:off', () => svg.pauseAnimations());
}
