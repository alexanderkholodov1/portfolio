// The Services page shows instead of telling. The opening types an idea and builds its result; each tile below is a
// small live demo of an activity. Tiles animate only while on screen; the game jumps on a tap and counts points,
// the poster reshuffles, the 3D model follows the pointer.
export function startDemos() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = new IntersectionObserver((entries) => { for (const e of entries) e.target.classList.toggle('live', e.isIntersecting); }, { threshold: .15 });
  document.querySelectorAll('[data-demo]').forEach((el) => live.observe(el));

  // The opening builder: an idea is typed, then its result builds itself; it moves on to the next idea every few
  // seconds, or to the one the visitor picks. The window leans toward the pointer.
  const builder = document.querySelector<HTMLElement>('[data-builder]');
  if (builder) {
    const typed = builder.querySelector<HTMLElement>('[data-typed]')!;
    const scenes = [...builder.querySelectorAll<HTMLElement>('[data-scene]')];
    const ideas = [...builder.querySelectorAll<HTMLButtonElement>('[data-idea]')];
    const DWELL = 8000;
    builder.style.setProperty('--dwell', `${DWELL}ms`);
    let current = -1, timer = 0, typing = 0, seen = true;
    const show = (i: number) => {
      current = i; clearTimeout(timer); clearInterval(typing);
      ideas.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); const bar = b.querySelector('i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; } });
      scenes.forEach((s) => s.classList.remove('on'));
      const text = ideas[i].dataset.prompt || '';
      if (reduce) { typed.textContent = text; scenes[i].classList.add('on'); return; }
      typed.textContent = ''; let n = 0;
      typing = window.setInterval(() => { n++; typed.textContent = text.slice(0, n); if (n >= text.length) { clearInterval(typing); scenes[i].classList.add('on'); } }, 28);
      timer = window.setTimeout(() => { if (seen && !document.hidden) show((current + 1) % ideas.length); else timer = window.setTimeout(() => show((current + 1) % ideas.length), DWELL); }, DWELL);
    };
    ideas.forEach((b, k) => b.addEventListener('click', () => show(k)));
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(builder);
    show(0);
    if (!reduce && matchMedia('(pointer: fine)').matches) builder.addEventListener('pointermove', (e) => {
      const r = builder.getBoundingClientRect();
      builder.style.setProperty('--px', String((e.clientX - r.left) / r.width - .5));
      builder.style.setProperty('--py', String((e.clientY - r.top) / r.height - .5));
    });
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
