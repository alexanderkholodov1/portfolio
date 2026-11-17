// The home's first screen: five pieces, one per field of his work, each in the material that field speaks with
// (glass for AI, brushed metal for science, soft matte for games, a lacquered knot for design, a printed vase for 3D).
// They float, can be dragged and thrown, come back on a spring, and a tap opens the place where that work lives.
// Colors come from the page's own CSS variables, so the scene follows his identity and the theme.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

type PieceInfo = { id: string; label: string; detail: string; href: string };

export function startHero(canvas: HTMLCanvasElement, tag: HTMLElement) {
  const info: PieceInfo[] = JSON.parse(canvas.dataset.pieces || '[]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.hidden = true; // No WebGL: the first screen stays whole with its words alone.
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  const key = new THREE.DirectionalLight(0xffd2b8, 2.2); key.position.set(-5, 9, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd6ff, 0.9); fill.position.set(6, -4, 3); scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const css = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => new THREE.Color((css.getPropertyValue(name).trim() || fallback));
  const main = color('--ak-main', '#056ad6'), second = color('--ak-second', '#bd1f27'), warm = color('--ak-warm', '#ff8e52');

  type Piece = { id: string; group: THREE.Group; mesh: THREE.Mesh; home: THREE.Vector3; pos: THREE.Vector3; vel: THREE.Vector3; spin: THREE.Vector2; phase: number };
  const pieces: Piece[] = [];
  const add = (id: string, mesh: THREE.Mesh) => {
    mesh.userData.id = id;
    const group = new THREE.Group(); group.add(mesh); scene.add(group);
    pieces.push({ id, group, mesh, home: new THREE.Vector3(), pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: new THREE.Vector2(Math.random() - .5, Math.random() - .5).multiplyScalar(.6), phase: Math.random() * 6.28 });
  };
  { // AI: a glass orb with a thought inside.
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 48), new THREE.MeshPhysicalMaterial({ color: 0xeef4ff, transparent: true, opacity: .32, roughness: .03, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide }));
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.46, 3), new THREE.MeshStandardMaterial({ color: main, emissive: main, emissiveIntensity: .7, roughness: .25 }));
    orb.add(core); orb.userData.core = core; orb.renderOrder = 2; add('ai', orb);
  }
  { // Science: a detector capsule crossed by a particle track.
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 1.3, 8, 24), new THREE.MeshStandardMaterial({ color: 0xc9d0dc, metalness: 1, roughness: .32 }));
    const track = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 3.1, 8), new THREE.MeshStandardMaterial({ color: second, emissive: second, emissiveIntensity: .8 }));
    track.rotation.z = .9; cap.add(track); cap.rotation.z = -.5; add('science', cap);
  }
  { // Games: a matte planet with a thin ring.
    const planet = new THREE.Mesh(new THREE.SphereGeometry(.85, 48, 32), new THREE.MeshPhysicalMaterial({ color: warm, roughness: .62, sheen: 1, sheenColor: new THREE.Color(0xffd7c2) }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, .045, 12, 96), new THREE.MeshStandardMaterial({ color: main, metalness: .4, roughness: .25 }));
    ring.rotation.x = 1.25; ring.rotation.y = .3; planet.add(ring); add('games', planet);
  }
  { // Design: a lacquered knot.
    add('design', new THREE.Mesh(new THREE.TorusKnotGeometry(.55, .19, 160, 24, 2, 3), new THREE.MeshPhysicalMaterial({ color: second, roughness: .18, clearcoat: 1, clearcoatRoughness: .08 })));
  }
  { // 3D: a printed vase with its layer lines.
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 60; i++) { const y = i / 60; pts.push(new THREE.Vector2(.42 + .22 * Math.sin(y * 3.4 + .4) + (i % 2 ? .012 : 0), y * 1.7 - .85)); }
    const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ color: 0xf6efe8, roughness: .78, side: THREE.DoubleSide }));
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.25, .14, 1.25, 3, .05), new THREE.MeshStandardMaterial({ color: warm, roughness: .5 }));
    base.position.y = -.92; vase.add(base); add('print', vase);
  }

  const wide: Record<string, [number, number, number]> = { ai: [3.0, .9, 1.2], science: [5.9, 2.4, -2.2], games: [5.5, -1.5, -.6], design: [2.4, 2.9, -1.6], print: [2.5, -2.3, .4] };
  const narrow: Record<string, [number, number, number]> = { ai: [0, 1.95, .8], design: [-1.1, 2.55, -.6], science: [1.1, 2.6, -.8], games: [1.0, 1.2, 0], print: [-1.0, 1.2, -.2] };
  let isNarrow = false;
  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    isNarrow = w < 760;
    for (const p of pieces) { p.home.set(...(isNarrow ? narrow : wide)[p.id]); p.group.scale.setScalar(isNarrow ? (p.id === 'ai' ? .5 : .42) : (p.id === 'ai' ? 1.15 : .9)); }
    camera.position.x = isNarrow ? 0 : 1.2;
  };
  new ResizeObserver(layout).observe(canvas); layout();
  for (const p of pieces) p.pos.copy(p.home);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  let drag: Piece | null = null, moved = 0, lastT = 0;
  const toNdc = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  const pick = (e: PointerEvent) => { toNdc(e); const hits = ray.intersectObjects(pieces.map((p) => p.mesh), true); if (!hits.length) return null; let o: THREE.Object3D | null = hits[0].object; while (o && !o.userData.id) o = o.parent; return pieces.find((p) => p.id === o?.userData.id) || null; };
  const show = (p: Piece, e: PointerEvent) => { const i = info.find((x) => x.id === p.id); if (!i) return; tag.innerHTML = ''; const b = document.createElement('b'); b.textContent = i.label; const s = document.createElement('small'); s.textContent = i.detail; tag.append(b, s); tag.style.left = e.clientX + 'px'; tag.style.top = e.clientY + 'px'; tag.dataset.on = ''; };
  canvas.addEventListener('pointermove', (e) => {
    if (drag) { toNdc(e); plane.constant = -drag.pos.z; ray.ray.intersectPlane(plane, hit); const now = performance.now(); drag.vel.copy(hit).sub(drag.pos).divideScalar(Math.max(16, now - lastT) / 1000).clampLength(0, 30); drag.pos.copy(hit); lastT = now; moved++; show(drag, e); return; }
    const p = pick(e); canvas.style.cursor = p ? 'grab' : ''; if (p) show(p, e); else delete tag.dataset.on;
  });
  canvas.addEventListener('pointerdown', (e) => { const p = pick(e); if (!p) return; drag = p; moved = 0; lastT = performance.now(); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointerup', () => { if (!drag) return; const p = drag; drag = null; canvas.style.cursor = 'grab'; if (moved < 3) { const i = info.find((x) => x.id === p.id); if (i) location.href = i.href; } });
  canvas.addEventListener('pointerleave', () => { if (!drag) delete tag.dataset.on; });

  const clock = new THREE.Clock(); let running = !document.hidden;
  const look = new THREE.Vector2(); addEventListener('pointermove', (e) => look.set(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5));
  const loop = () => {
    if (!running) return; requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 1 / 30), t = clock.elapsedTime;
    for (const p of pieces) {
      if (p !== drag) { const target = p.home.clone(); if (!reduce) target.y += Math.sin(t * .6 + p.phase) * .12; p.vel.addScaledVector(target.sub(p.pos).multiplyScalar(26).addScaledVector(p.vel, -6.5), dt); p.pos.addScaledVector(p.vel, dt); }
      p.group.position.copy(p.pos);
      if (!reduce) { p.mesh.rotation.x += p.spin.x * dt * .5 + p.vel.y * dt * .05; p.mesh.rotation.y += p.spin.y * dt * .5 + p.vel.x * dt * .05; }
      const core = p.mesh.userData.core as THREE.Mesh | undefined; if (core) (core.material as THREE.MeshStandardMaterial).emissiveIntensity = .45 + .25 * Math.sin(t * 1.8);
    }
    if (!reduce) { camera.rotation.y = -look.x * .04; camera.rotation.x = -look.y * .03; }
    renderer.render(scene, camera);
  };
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });
  loop();
}
