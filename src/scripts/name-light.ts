// The first screen is his alone: his name, written in the page's real heading, gathers out of scattered light and
// stays alive. The pointer parts it, a tap scatters it and it comes back together; a few warm sparks drift around it.
// The heading keeps its text for readers and for pages without JavaScript; the light is drawn exactly over it.

const rgba = (hex: string, a: number) => { const m = hex.match(/^#([0-9a-f]{6})$/i); if (!m) return hex; const v = parseInt(m[1], 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };

type Dot = { x: number; y: number; hx: number; hy: number; vx: number; vy: number; c: number; r: number; seed: number };

export function startNameLight(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('canvas');
  const parts = [...hero.querySelectorAll<HTMLElement>('[data-light]')];
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !parts.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = () => getComputedStyle(document.documentElement);
  let colors: string[] = [];
  const readColors = () => { const c = css(); colors = ['--ak-text', '--ak-main', '--ak-warm', '--ak-second'].map((n) => c.getPropertyValue(n).trim()); };

  let dots: Dot[] = [], sparks: Dot[] = [], w = 0, h = 0, dpr = 1;
  const pointer = { x: -1e4, y: -1e4 };

  // Sample the heading's own glyphs, where they sit on screen, into points of light.
  const sample = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect(); w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const off = document.createElement('canvas'); off.width = Math.ceil(w); off.height = Math.ceil(h);
    const o = off.getContext('2d', { willReadFrequently: true })!;
    const marks: { x: number; y: number; part: number }[] = [];
    parts.forEach((el, k) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      o.clearRect(0, 0, off.width, off.height);
      o.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      // CSS centres the font's ascent and descent in the line box; draw on the same baseline.
      o.textBaseline = 'alphabetic'; o.fillStyle = '#000';
      const m = o.measureText(el.textContent || ''), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      const top = r.top + parseFloat(s.paddingTop), inner = r.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
      o.fillText(el.textContent || '', r.left - box.left + parseFloat(s.paddingLeft), top - box.top + (inner - asc - desc) / 2 + asc);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const size = parseFloat(s.fontSize), step = Math.max(2.6, size / (w < 700 ? 16 : 30));
      for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) { const jx = x + (Math.random() - .5) * step, jy = y + (Math.random() - .5) * step, ix = Math.round(jx), iy = Math.round(jy); if (ix >= 0 && iy >= 0 && ix < off.width && iy < off.height && data[(iy * off.width + ix) * 4 + 3] > 110) marks.push({ x: jx, y: jy, part: k }); }
    });
    const old = dots;
    dots = marks.map((m, i) => {
      const prev = old[i];
      const c = m.part === 0 ? (Math.random() < .08 ? 1 : 0) : (Math.random() < .1 ? 2 : Math.random() < .06 ? 3 : 1);
      return { x: prev?.x ?? Math.random() * w, y: prev?.y ?? (reduce ? m.y : h * (1.1 + Math.random() * .4)), hx: m.x, hy: m.y, vx: 0, vy: 0, c, r: (w < 700 ? .9 : 1.25) + Math.random() * .8, seed: Math.random() * 6.28 };
    });
    if (reduce) for (const d of dots) { d.x = d.hx; d.y = d.hy; }
    sparks = Array.from({ length: w < 700 ? 12 : 22 }, (_, i) => ({ x: 0, y: 0, hx: 0, hy: 0, vx: 0, vy: 0, c: i % 5 === 0 ? 3 : 2, r: 1 + Math.random() * 1.6, seed: Math.random() * 100 }));
    hero.classList.add('lit');
  };

  canvas.addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; });
  canvas.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; });
  canvas.addEventListener('pointerdown', (e) => {
    if (reduce) return;
    const b = canvas.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
    for (const d of dots) { const dx = d.x - px, dy = d.y - py, dist = Math.hypot(dx, dy) + 20; d.vx += dx / dist * 5200 / Math.sqrt(dist); d.vy += dy / dist * 5200 / Math.sqrt(dist); }
  });

  let visible = true, scheduled = false, last = performance.now(), t = 0;
  const kick = () => { if (!scheduled && visible && !document.hidden) { scheduled = true; requestAnimationFrame(frame); } };
  const frame = (now: number) => {
    scheduled = false; if (!visible || document.hidden) return;
    const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20)); last = now; t += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      if (!reduce) {
        const tx = d.hx + Math.sin(t * 1.3 + d.seed) * .7, ty = d.hy + Math.cos(t * 1.1 + d.seed) * .7;
        const dx = d.x - pointer.x, dy = d.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const dist = Math.sqrt(d2) + 1, f = (1 - dist / 95) * 3400; d.vx += dx / dist * f * dt; d.vy += dy / dist * f * dt; }
        d.vx += ((tx - d.x) * 34 - d.vx * 7.5) * dt; d.vy += ((ty - d.y) * 34 - d.vy * 7.5) * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
      }
      const speed = Math.min(1, Math.hypot(d.vx, d.vy) / 600);
      ctx.fillStyle = speed > .25 && d.c === 0 ? colors[1] : colors[d.c];
      ctx.globalAlpha = .92;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 + speed * .8), 0, 6.283); ctx.fill();
    }
    // Warm sparks that wander around the name, each leaving a short trail.
    if (!reduce) for (const s of sparks) {
      const a = t * (.15 + (s.seed % 1) * .2) + s.seed, rx = w * (.28 + (s.seed % .3)), ry = h * (.22 + (s.seed % .2));
      const x = w / 2 + Math.cos(a) * rx + Math.sin(a * 2.3 + s.seed) * 30, y = h * .45 + Math.sin(a * 1.4) * ry;
      const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 5);
      g.addColorStop(0, rgba(colors[s.c], 1)); g.addColorStop(.35, rgba(colors[s.c], .5)); g.addColorStop(1, rgba(colors[s.c], 0));
      ctx.globalAlpha = .5 + .4 * Math.sin(t * 2 + s.seed); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s.r * 5, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduce) kick();
  };

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  let resizeTimer = 0;
  new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { sample(); kick(); }, 120); }).observe(hero);
  new MutationObserver(() => { readColors(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  readColors();
  document.fonts.ready.then(() => { sample(); kick(); });
}
