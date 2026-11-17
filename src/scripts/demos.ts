// The Services page shows instead of telling: each tile is a small live demo of something he makes.
// Tiles animate only while on screen; the game jumps on a tap, the poster reshuffles, the cube follows the pointer,
// and the floating shapes of the first screen lean away from the pointer.
export function startDemos() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = new IntersectionObserver((entries) => { for (const e of entries) e.target.classList.toggle('live', e.isIntersecting); }, { threshold: .15 });
  document.querySelectorAll('[data-demo]').forEach((el) => live.observe(el));

  const game = document.querySelector<HTMLElement>('[data-game]');
  const jump = () => { if (!game || game.classList.contains('jump')) return; game.classList.add('jump'); setTimeout(() => game.classList.remove('jump'), 620); };
  game?.addEventListener('pointerdown', jump);
  game?.querySelector('button')?.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); jump(); } });

  const design = document.querySelector<HTMLElement>('[data-design]');
  let v = 0; const shuffle = () => { if (!design) return; v = (v + 1) % 4; design.dataset.v = String(v); };
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

  const shapes = document.querySelector<HTMLElement>('[data-shapes]');
  if (shapes && !reduce && matchMedia('(pointer: fine)').matches) shapes.addEventListener('pointermove', (e) => {
    const r = shapes.getBoundingClientRect();
    shapes.style.setProperty('--px', String((e.clientX - r.left) / r.width - .5));
    shapes.style.setProperty('--py', String((e.clientY - r.top) / r.height - .5));
  });
}
