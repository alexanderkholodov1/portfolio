// The Services page shows instead of telling. The opening jumps between universes of one idea; each tile below is a
// small live demo of an activity. Tiles animate only while on screen; the game jumps on a tap and counts points,
// the poster reshuffles, the 3D model follows the pointer.
export function startDemos() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = new IntersectionObserver((entries) => { for (const e of entries) e.target.classList.toggle('live', e.isIntersecting); }, { threshold: .15 });
  document.querySelectorAll('[data-demo]').forEach((el) => live.observe(el));

  // Verse jumps: a tap (or every few seconds while idle) moves the windows, shifts the colour field and glitches.
  const verse = document.querySelector<HTMLElement>('[data-verse]');
  if (verse) {
    const label = verse.querySelector('[data-u]');
    let v = 0, last = performance.now(), seen = true;
    const jump = () => {
      v = (v + 1 + Math.floor(Math.random() * 3)) % 5; verse.dataset.v = String(v); last = performance.now();
      if (label) label.textContent = String(Math.floor(Math.random() * 9000) + 2);
      if (!reduce) { verse.classList.remove('glitch'); void verse.offsetWidth; verse.classList.add('glitch'); }
    };
    verse.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a, button')) jump(); });
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(verse);
    if (!reduce) setInterval(() => { if (seen && !document.hidden && performance.now() - last > 6500) jump(); }, 1000);
    if (!reduce && matchMedia('(pointer: fine)').matches) verse.addEventListener('pointermove', (e) => {
      const r = verse.getBoundingClientRect();
      verse.style.setProperty('--px', String((e.clientX - r.left) / r.width - .5));
      verse.style.setProperty('--py', String((e.clientY - r.top) / r.height - .5));
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
