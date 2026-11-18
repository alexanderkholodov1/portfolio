// The Services page shows instead of telling. The opening builds four ideas at once; each tile below is a
// small live demo of an activity. Tiles animate only while on screen; the game jumps on a tap and counts points,
// the poster reshuffles, the 3D model follows the pointer.
export function startDemos() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = new IntersectionObserver((entries) => { for (const e of entries) e.target.classList.toggle('live', e.isIntersecting); }, { threshold: .15 });
  document.querySelectorAll('[data-demo]').forEach((el) => live.observe(el));

  // The opening shows four ideas at once (his note: the whole panorama at first sight). In each window the idea is
  // typed and its result builds itself; they start one after another and begin again every few seconds.
  const builder = document.querySelector<HTMLElement>('[data-builder]');
  if (builder) {
    const wins = [...builder.querySelectorAll<HTMLElement>('[data-build]')];
    let seen = true;
    // Each card is always alive (never empty); only the idea above it is typed again now and then.
    wins.forEach((w) => w.querySelector('.sc')?.classList.add('on'));
    const run = (w: HTMLElement, delay: number, first = false) => {
      const typed = w.querySelector<HTMLElement>('[data-typed]')!; const text = typed.dataset.text || '';
      if (first || reduce) { typed.textContent = text; return; }
      window.setTimeout(() => { let n = 0; typed.textContent = ''; const id = window.setInterval(() => { n++; typed.textContent = text.slice(0, n); if (n >= text.length) clearInterval(id); }, 26); }, delay);
    };
    const cycle = () => wins.forEach((w, k) => run(w, k * 450));
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(builder);
    wins.forEach((w) => run(w, 0, true));
    if (!reduce) window.setInterval(() => { if (seen && !document.hidden) cycle(); }, 11000);
    // The fan follows the pointer with an eased lag, never a jump.
    if (matchMedia('(pointer: fine)').matches && !reduce) {
      let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      const step = () => { x += (tx - x) * .08; y += (ty - y) * .08; builder.style.setProperty('--sx', x.toFixed(3)); builder.style.setProperty('--sy', y.toFixed(3)); raf = Math.abs(tx - x) + Math.abs(ty - y) > .002 ? requestAnimationFrame(step) : 0; };
      const go = () => { if (!raf) raf = requestAnimationFrame(step); };
      builder.addEventListener('pointermove', (e) => { const r = builder.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; go(); });
      builder.addEventListener('pointerleave', () => { tx = 0; ty = 0; go(); });
    }
  }

  const game = document.querySelector<HTMLElement>('[data-game]');
  const score = game?.querySelector('[data-score]');
  let points = 0;
  const jump = () => {
    if (!game || game.classList.contains('jump')) return;
    game.classList.add('jump'); points += 10; if (score) score.textContent = String(points);
    setTimeout(() => game.classList.remove('jump'), 620);
  };
  game?.addEventListener('pointerdown', jump);
  game?.querySelector('button')?.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); jump(); } });

  const design = document.querySelector<HTMLElement>('[data-design]');
  let look = 0; const shuffle = () => { if (!design) return; look = (look + 1) % 4; design.dataset.v = String(look); };
  design?.addEventListener('pointerdown', shuffle);
  if (design && !reduce) setInterval(() => { if (design.classList.contains('live') && !document.hidden) shuffle(); }, 2600);

  const model = document.querySelector<HTMLElement>('[data-model]');
  model?.addEventListener('pointermove', (e) => {
    const r = model.getBoundingClientRect();
    model.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 140}deg`);
    model.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 100}deg`);
    model.classList.add('held');
  });
  model?.addEventListener('pointerleave', () => model.classList.remove('held'));
}
