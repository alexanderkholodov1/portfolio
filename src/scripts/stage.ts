// The home's first screen is his work. One field of light changes into each project in turn: Farpoint HORIZON's
// planet and probe, the Collective Galaxy's arms, MunHub Lab's cosmic rays falling onto a detector, the Galápagos
// soundscape of Dragon Ocean Analyzer, ZKVote's sealed proof, and the knowledge graph of the TCS internship.
// The pointer pushes the light, a drag turns the shape, a tap scatters it and it gathers again.
// Plain 2D canvas: smooth on a phone, paused when not seen, still for reduced motion.

type V = { x: number; y: number; z: number; c: number };
type Shape = { points: (n: number) => V[]; move?: (i: number, p: V, t: number, o: V) => void; tilt: number; spin: number };

const TAU = Math.PI * 2;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const fib = (i: number, n: number, r: number): V => {
  const y = 1 - (2 * (i + .5)) / n, s = Math.sqrt(1 - y * y), a = i * 2.39996;
  return { x: Math.cos(a) * s * r, y: y * r, z: Math.sin(a) * s * r, c: 0 };
};

const rays = Array.from({ length: 11 }, () => ({ x: rnd(-1.6, 1.6), z: rnd(-1.1, 1.1), dx: rnd(-.6, .6), dz: rnd(-.4, .4) }));

const shapes: Record<string, Shape> = {
  // A planet lit from one side, its ring, and a probe on its way out with a trail behind it.
  'farpoint-horizon': {
    tilt: .35, spin: .12,
    points: (n) => Array.from({ length: n }, (_, i) => {
      const k = i / n;
      if (k < .55) { const p = fib(i, n * .55, 1.05); p.c = p.x - p.y > .35 ? 1 : 0; return p; }
      if (k < .88) { const a = rnd(0, TAU), r = rnd(1.5, 2.05); return { x: Math.cos(a) * r, y: rnd(-.02, .02), z: Math.sin(a) * r, c: r > 1.9 ? 1 : 0 }; }
      return { x: 0, y: 0, z: 0, c: 2 };
    }),
    move: (i, p, t, o) => {
      o.x = p.x; o.y = p.y; o.z = p.z;
      if (p.c === 2) { const s = (i * .618) % 1, a = t * .5 - s * 1.4, r = 2.55 + s * .35; o.x = Math.cos(a) * r; o.z = Math.sin(a) * r; o.y = .55 - s * .5 + Math.sin(a) * .3; }
      else if (Math.abs(p.y) < .03 && Math.hypot(p.x, p.z) > 1.45) { const a = Math.atan2(p.z, p.x) + t * .12, r = Math.hypot(p.x, p.z); o.x = Math.cos(a) * r; o.z = Math.sin(a) * r; }
    },
  },
  // Three arms, a warm core, and stars that turn faster near the centre.
  galaxy: {
    tilt: .9, spin: 0,
    points: (n) => Array.from({ length: n }, (_, i) => {
      if (i < n * .14) { const p = fib(i, n * .14, rnd(.05, .42)); p.y *= .6; p.c = 1; return p; }
      const arm = i % 3, r = Math.pow(rnd(), .7) * 2.3 + .2, a = arm * TAU / 3 + Math.log(r + .1) * 2.6 + rnd(-.32, .32) / (r * .5 + .4);
      return { x: Math.cos(a) * r, y: rnd(-.06, .06) * (2.4 - r), z: Math.sin(a) * r, c: rnd() < .12 ? 2 : r < .9 ? 1 : 0 };
    }),
    move: (_i, p, t, o) => { const r = Math.hypot(p.x, p.z), a = Math.atan2(p.z, p.x) + t * .55 / (r + .35); o.x = Math.cos(a) * r; o.z = Math.sin(a) * r; o.y = p.y; },
  },
  // Cosmic rays come down in straight tracks and light the detector plate where they land.
  'munhub-lab': {
    tilt: .38, spin: .1,
    points: (n) => Array.from({ length: n }, (_, i) => {
      if (i < n * .4) { const g = Math.ceil(Math.sqrt(n * .4 * 1.4)), u = (i % g) / g, v = Math.floor(i / g) / Math.ceil(n * .4 / g); return { x: (u - .5) * 3.8, y: -1.2, z: (v - .5) * 2.6, c: 0 }; }
      const tr = rays[i % rays.length]; return { x: tr.x, y: 0, z: tr.z, c: i % 4 === 0 ? 2 : 1 };
    }),
    move: (i, p, t, o) => {
      if (p.y < -1.1) { const hit = rays.reduce((m, r) => Math.max(m, Math.exp(-((p.x - r.x) ** 2 + (p.z - r.z) ** 2) * 9) * Math.max(0, Math.sin(t * 2.2 + r.x * 3))), 0); o.x = p.x; o.z = p.z; o.y = p.y + hit * .12; o.c = hit > .35 ? 1 : 0; return; }
      const tr = rays[i % rays.length], s = (i * .618 + t * .32 + tr.x) % 1;
      o.x = tr.x + tr.dx * (1 - s); o.z = tr.z + tr.dz * (1 - s); o.y = -1.15 + (1 - s) * 3.3;
    },
  },
  // The soundscape of San Cristóbal Bay as a moving spectrogram surface.
  'dragon-ocean-analyzer': {
    tilt: -.5, spin: .05,
    points: (n) => { const cols = Math.round(Math.sqrt(n * 1.5)), rows = Math.ceil(n / cols); return Array.from({ length: n }, (_, i) => ({ x: ((i % cols) / cols - .5) * 4.4, y: 0, z: (Math.floor(i / cols) / rows - .5) * 3, c: 0 })); },
    move: (_i, p, t, o) => {
      const h = Math.sin(p.x * 2.1 + t * 1.3) * .22 + Math.sin(p.z * 3.3 - t * .9) * .14 + Math.exp(-((p.x - Math.sin(t * .4) * 1.4) ** 2) * 3) * Math.max(0, Math.sin(p.z * 9 + t * 4)) * .55;
      o.x = p.x; o.z = p.z; o.y = h - .2; o.c = h > .34 ? 2 : h > .1 ? 1 : 0;
    },
  },
  // A sealed lattice holding a secret that pulses but never leaves.
  zkvote: {
    tilt: .5, spin: .22,
    points: (n) => Array.from({ length: n }, (_, i) => {
      if (i < n * .18) { const p = fib(i, n * .18, .48); p.c = 2; return p; }
      const e = Math.floor(rnd(0, 12)), s = rnd(-1, 1), a = [-1, 1][i % 2], b = [-1, 1][(i >> 1) % 2], k = 1.05;
      const v = e < 4 ? { x: s, y: a, z: b } : e < 8 ? { x: a, y: s, z: b } : { x: a, y: b, z: s };
      const f = rnd() < .35 ? rnd(.55, .98) : 1; return { x: v.x * k * f, y: v.y * k * f, z: v.z * k * f, c: f < 1 ? 0 : 1 };
    }),
    move: (_i, p, t, o) => { const g = p.c === 2 ? 1 + Math.sin(t * 2.2) * .12 : 1; o.x = p.x * g; o.y = p.y * g; o.z = p.z * g; },
  },
  // Ontologies and data: nodes, their links, and signals running along them.
  'tcs-ai': {
    tilt: .2, spin: .16,
    points: (n) => {
      const nodes = Array.from({ length: 34 }, (_, i) => fib(i, 34, rnd(1.2, 1.8)));
      const links: [V, V][] = []; nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => { if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.25) links.push([a, b]); }));
      return Array.from({ length: n }, (_, i) => {
        if (i < n * .22) { const c = nodes[i % nodes.length]; return { x: c.x + rnd(-.07, .07), y: c.y + rnd(-.07, .07), z: c.z + rnd(-.07, .07), c: 1 }; }
        const [a, b] = links[i % links.length], s = rnd(); return { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, z: a.z + (b.z - a.z) * s, c: i % 9 === 0 ? 2 : 0 };
      });
    },
    move: (i, p, t, o) => { o.x = p.x; o.y = p.y; o.z = p.z; if (p.c === 2) { const k = .5 + .5 * Math.sin(t * 3 + i); o.x *= .9 + k * .1; o.y *= .9 + k * .1; o.z *= .9 + k * .1; } },
  },
};

export function startStage(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const ctx = canvas.getContext('2d');
  if (!ctx || !tabs.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const N = small ? 450 : 850;

  const css = getComputedStyle(document.documentElement);
  const hex = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  const tint = (c: string, w: number) => { const m = c.match(/^#?([0-9a-f]{6})$/i); if (!m) return c; const v = parseInt(m[1], 16); const ch = [v >> 16, (v >> 8) & 255, v & 255].map((x) => Math.round(x + (255 - x) * w)); return `rgb(${ch.join(',')})`; };
  const palette = [tint(hex('--ak-main', '#056ad6'), .38), tint(hex('--ak-warm', '#ff8e52'), .05), tint(hex('--ak-second', '#bd1f27'), .22)];
  const sprites = palette.map((c) => {
    const s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d')!;
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(.18, c); r.addColorStop(.45, c.replace('rgb', 'rgba').replace(')', ',.35)')); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32); return s;
  });

  // Every particle keeps where it is in the shape, and a push on screen (o, v) that springs back to zero.
  const P = Array.from({ length: N }, () => ({ x: rnd(-4, 4), y: rnd(-3, 3), z: rnd(-3, 3), c: 0, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0, delay: rnd(0, .5), size: rnd(.55, 1.15) }));
  let base: V[] = [], from: V[] = [], shape = shapes[tabs[0].dataset.shape!] ?? shapes.galaxy, morph = 1;
  const tmp: V = { x: 0, y: 0, z: 0, c: 0 };

  let current = -1, timer = 0, paused = false, yaw = 0, yawVel = 0, pitch = 0, visible = true;
  const DWELL = 9;
  const select = (i: number, user = false) => {
    if (i === current) return;
    current = i; timer = 0;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; if (k === i) { p.classList.remove('in'); void p.offsetWidth; p.classList.add('in'); } });
    from = P.map((p) => ({ x: p.x, y: p.y, z: p.z, c: p.c }));
    shape = shapes[tabs[i].dataset.shape!] ?? shapes.galaxy;
    base = shape.points(N); morph = reduce ? 1 : 0;
    root.style.setProperty('--stage-hue', String(i));
    if (user) paused = true;
    kick();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, true));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); const k = (i + d + tabs.length) % tabs.length; select(k, true); tabs[k].focus(); }
    });
  });
  root.addEventListener('pointerenter', () => { paused = true; });
  root.addEventListener('pointerleave', () => { paused = false; });

  let w = 0, h = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 1.25); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); };
  size();

  const pointer = { x: -1e4, y: -1e4, down: false, lx: 0, dragged: 0 };
  const local = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (pointer.down) { const dx = x - pointer.lx; yawVel = dx * .004; yaw += dx * .006; pointer.dragged += Math.abs(dx); pointer.lx = x; }
    pointer.x = x; pointer.y = y; pitch = (y / h - .5) * .25;
  });
  canvas.addEventListener('pointerdown', (e) => { const [x] = local(e); pointer.down = true; pointer.lx = x; pointer.dragged = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => {
    pointer.down = false;
    if (pointer.dragged < 6 && !reduce) for (const p of P) { const dx = p.sx - pointer.x, dy = p.sy - pointer.y, d = Math.hypot(dx, dy) + 30; p.vx += dx / d * 9000 / Math.sqrt(d); p.vy += dy / d * 9000 / Math.sqrt(d); }
    kick();
  });
  canvas.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; pitch = 0; });

  // One loop at most; it stops when the stage is off screen or the tab is hidden, and draws once for reduced motion.
  let scheduled = false, last = performance.now(), t = 0;
  const kick = () => { if (!scheduled && visible && !document.hidden) { scheduled = true; requestAnimationFrame(frame); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }, { threshold: .2 }).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { size(); kick(); }).observe(canvas);

  const frame = (now: number) => {
    scheduled = false;
    if (!visible || document.hidden) return;
    // Thirty frames a second while nobody touches it; full rate while the pointer is on the light.
    if (pointer.x < -1000 && morph >= 1 && now - last < 30 && !reduce) { scheduled = true; requestAnimationFrame(frame); return; }
    const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20)); last = now; t += reduce ? 0 : dt;
    if (!paused && !reduce) { timer += dt; if (timer > DWELL) select((current + 1) % tabs.length); }
    // Only the active tab's bar changes; setting a variable on the whole stage restyled it every frame.
    const bar = tabs[current]?.querySelector('i'); if (bar) bar.style.transform = `scaleX(${reduce ? 0 : Math.min(timer / DWELL, 1)})`;
    morph = Math.min(1, morph + dt * .75);
    if (!pointer.down) { yaw += (shape.spin + yawVel) * dt; yawVel *= .94; }

    const scale = Math.min(w * (small ? .27 : .2), h * .27), cx = w * (small ? .5 : .64), cy = h * (small ? .34 : .47);
    const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), tl = shape.tilt + pitch, cp = Math.cos(tl), sp = Math.sin(tl);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const p = P[i], b = base[i];
      tmp.c = b.c;
      if (shape.move) shape.move(i, b, t, tmp); else { tmp.x = b.x; tmp.y = b.y; tmp.z = b.z; }
      const k = Math.max(0, Math.min(1, (morph - p.delay * .5) / .75)), e = k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, f = from[i] ?? tmp;
      p.x = f.x + (tmp.x - f.x) * e; p.y = f.y + (tmp.y - f.y) * e; p.z = f.z + (tmp.z - f.z) * e; p.c = tmp.c;
      // Rotate (yaw, then tilt) and project.
      const x1 = p.x * cy0 - p.z * sy0, z1 = p.x * sy0 + p.z * cy0, y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
      const persp = 5.5 / (5.5 + z2), tx = cx + x1 * scale * persp, ty = cy - y2 * scale * persp;
      // The pointer pushes; a spring brings each particle back to its place in the shape.
      if (!reduce) {
        const dx = tx + p.ox - pointer.x, dy = ty + p.oy - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) + 1, force = (1 - d / 120) * 2600; p.vx += dx / d * force * dt; p.vy += dy / d * force * dt; }
        p.vx += (-p.ox * 28 - p.vx * 7) * dt; p.vy += (-p.oy * 28 - p.vy * 7) * dt; p.ox += p.vx * dt; p.oy += p.vy * dt;
      }
      p.sx = tx + p.ox; p.sy = ty + p.oy;
      const s = (small ? 9 : 12) * p.size * persp * (p.c === 2 ? 1.25 : 1), a = Math.max(.15, Math.min(1, .55 + (1 - z2 / 3) * .35));
      ctx.globalAlpha = a; ctx.drawImage(sprites[p.c] ?? sprites[0], p.sx - s / 2, p.sy - s / 2, s, s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!reduce) kick();
  };
  select(0);
  kick();
}
