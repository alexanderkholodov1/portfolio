// His name's letters as soft physical things: they lean gently away from the pointer, can be grabbed and dragged,
// and spring back to their place with a little wobble when released. Springs, not jumps; the loop only runs while
// something is moving. Reduced motion leaves the letters still.
type L = { el: HTMLElement; x: number; y: number; r: number; vx: number; vy: number; vr: number; tx: number; ty: number; tr: number; cx: number; cy: number };

export function startLetters(hero: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const letters: L[] = [...hero.querySelectorAll<HTMLElement>('.name .ch')].map((el) => ({ el, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, tx: 0, ty: 0, tr: 0, cx: 0, cy: 0 }));
  if (!letters.length) return;
  // Let the entrance animation finish before the springs own the transform.
  let ready = false;
  setTimeout(() => { for (const l of letters) l.el.style.animation = 'none'; ready = true; }, 1800);

  const pointer = { x: -1e4, y: -1e4 };
  let held: L | null = null, grabX = 0, grabY = 0, running = false, last = 0;
  const centres = () => { for (const l of letters) { const r = l.el.getBoundingClientRect(); l.cx = r.left + r.width / 2 - l.x; l.cy = r.top + r.height / 2 - l.y; } };

  const frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60); last = now;
    let moving = false;
    for (const l of letters) {
      if (l === held) {
        l.tx = pointer.x - grabX - l.cx; l.ty = pointer.y - grabY - l.cy; l.tr = Math.max(-25, Math.min(25, l.vx * .02));
      } else {
        // A soft lean away from the pointer, strongest for the nearest letters.
        const dx = l.cx + l.x - pointer.x, dy = l.cy + l.y - pointer.y, d = Math.hypot(dx, dy);
        const f = Math.max(0, 1 - d / 160);
        l.tx = f * (dx / (d || 1)) * 10; l.ty = -f * 14 + f * (dy / (d || 1)) * 4; l.tr = f * (dx > 0 ? 6 : -6);
        l.el.classList.toggle('near', f > .35);
      }
      const k = l === held ? 260 : 90, c = l === held ? 26 : 9; // stiffer while held, looser (wobbly) on release
      l.vx += ((l.tx - l.x) * k - l.vx * c) * dt; l.vy += ((l.ty - l.y) * k - l.vy * c) * dt; l.vr += ((l.tr - l.r) * k - l.vr * c) * dt;
      l.x += l.vx * dt; l.y += l.vy * dt; l.r += l.vr * dt;
      if (Math.abs(l.x - l.tx) + Math.abs(l.y - l.ty) + Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.r - l.tr) > .05) moving = true;
      l.el.style.transform = `translate(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px) rotate(${l.r.toFixed(2)}deg)`;
    }
    running = moving || held !== null;
    if (running) requestAnimationFrame(frame);
  };
  const kick = () => { if (!ready || running) return; running = true; last = performance.now(); centres(); requestAnimationFrame(frame); };

  hero.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; kick(); });
  hero.addEventListener('pointerleave', () => { if (!held) { pointer.x = pointer.y = -1e4; kick(); } });
  for (const l of letters) {
    l.el.addEventListener('pointerdown', (e) => {
      if (!ready) return;
      e.preventDefault(); centres(); held = l; l.el.classList.add('held'); l.el.setPointerCapture(e.pointerId);
      pointer.x = e.clientX; pointer.y = e.clientY; grabX = e.clientX - (l.cx + l.x); grabY = e.clientY - (l.cy + l.y); kick();
    });
    const release = () => { if (held !== l) return; held = null; l.el.classList.remove('held'); kick(); };
    l.el.addEventListener('pointerup', release); l.el.addEventListener('pointercancel', release);
  }
  addEventListener('scroll', () => { if (!running) return; centres(); }, { passive: true });
}
