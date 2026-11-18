// Motion shared by every page: sections rise into view as they are reached, cards lean toward the pointer with a
// light that follows it, and buttons lean toward the pointer before they are pressed.
// Without JavaScript or with reduced motion, everything is simply there.
export function startMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  root.classList.add('motion');

  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  document.querySelectorAll('[data-reveal]').forEach((el) => seen.observe(el));

  // Loops run only where the visitor is looking: every section's animations pause while it is off screen, so the
  // page never spends frames on motion nobody sees.
  const inView = new IntersectionObserver((entries) => {
    for (const e of entries) (e.target as HTMLElement).dataset.zone = e.isIntersecting ? 'on' : 'off';
  }, { rootMargin: '120px 0px' });
  document.querySelectorAll<HTMLElement>('main section, main > *, footer').forEach((el) => { el.dataset.zone = 'off'; inView.observe(el); });

  const fine = matchMedia('(pointer: fine)').matches;
  if (!fine) return;
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
      el.style.setProperty('--ry', `${(x - .5) * 7}deg`); el.style.setProperty('--rx', `${(.5 - y) * 7}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
  });
  document.querySelectorAll<HTMLElement>('.btn-a, .btn-b, .btn-c').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * .12}px ${(e.clientY - r.top - r.height / 2) * .22}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
}
