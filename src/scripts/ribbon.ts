// The first screen's one animation: a ribbon of light in his three colours, many fine threads that twist together
// and flow across the page behind his name. The pointer bends it toward itself and a press sends a wave along it.
// Plain 2D canvas, paused when not seen, still for reduced motion.

export function startRibbon(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let colors: string[] = [];
  const readColors = () => { const c = getComputedStyle(document.documentElement); colors = ['--ak-main', '--ak-second', '--ak-warm'].map((n) => c.getPropertyValue(n).trim()); };

  let w = 0, h = 0, dpr = 1;
  const size = () => { dpr = 1; /* thin threads stay soft at 1x and cost a quarter of a 2x canvas */ w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); };

  const pointer = { x: -1, y: -1, sx: -1, sy: -1, on: 0 };
  const waves: { x: number; t: number }[] = [];
  hero.addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; if (pointer.sx < 0) { pointer.sx = pointer.x; pointer.sy = pointer.y; } });
  hero.addEventListener('pointerleave', () => { pointer.x = -1; });
  hero.addEventListener('pointerdown', (e) => { const b = canvas.getBoundingClientRect(); waves.push({ x: e.clientX - b.left, t: 0 }); if (waves.length > 4) waves.shift(); kick(); });

  let visible = true, scheduled = false, last = performance.now(), t = 0;
  const kick = () => { if (!scheduled && visible && !document.hidden) { scheduled = true; requestAnimationFrame(frame); } };
  const frame = (now: number) => {
    scheduled = false; if (!visible || document.hidden) return;
    // Drawn on every frame the screen shows: at thirty a second its slow drift read as stutter, and a frame costs
    // well under a millisecond (measured 2026-11-18).
    const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20)); last = now; if (!reduce) t += dt;
    // The pointer's pull eases in and out; its position is followed smoothly.
    pointer.on += ((pointer.x >= 0 ? 1 : 0) - pointer.on) * Math.min(1, dt * 3);
    if (pointer.x >= 0) { pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 5); pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 5); }
    for (const wv of waves) wv.t += dt;
    while (waves.length && waves[0].t > 3) waves.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, colors[0]); grad.addColorStop(.55, colors[1]); grad.addColorStop(1, colors[2]);
    ctx.strokeStyle = grad; ctx.lineCap = 'round';
    const threads = w < 700 ? 18 : 30, step = w < 700 ? 16 : 20, amp = h * .16, mid = h * .5;
    for (let i = 0; i < threads; i++) {
      const k = i / (threads - 1), twist = (k - .5) * 2;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += step) {
        const u = x / w;
        // The ribbon: a slow travelling wave whose width breathes, so the threads cross and twist.
        const spine = mid + Math.sin(u * 3.1 + t * .35) * amp + Math.sin(u * 7.3 - t * .6) * amp * .25 - (u - .5) * h * .22;
        const width = h * .11 * Math.sin(u * 4.2 + t * .5 + 1.3);
        let y = spine + twist * width + Math.sin(u * 11 + t * 1.1 + i * .3) * 3;
        if (pointer.on > .01) { const d = (x - pointer.sx) / (w * .16); y += (pointer.sy - y) * .55 * pointer.on * Math.exp(-d * d); }
        for (const wv of waves) { const d = x - wv.x, front = wv.t * w * .45; y += Math.sin(d * .03 - wv.t * 9) * 26 * Math.exp(-((Math.abs(d) - front) ** 2) / 9000) * (1 - wv.t / 3); }
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      const edge = 1 - Math.abs(twist);
      ctx.globalAlpha = .14 + edge * .5; ctx.lineWidth = .7 + edge * 1.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!reduce) kick();
  };

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }, { threshold: .2 }).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); kick(); }).observe(canvas);
  new MutationObserver(() => { readColors(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  readColors(); size(); kick();
}
