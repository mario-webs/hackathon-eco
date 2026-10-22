// La estación en 3D, recorrida con el scroll.
// Una sola fuente de tiempo: la posición de scroll. Se traduce en un punto
// entre dos pasos (.pstep), se suaviza y mueve cámara, furgoneta, camión y
// la batería en su carro. En el diagnóstico el pack se despieza.
// Sin WebGL o con "reducir movimiento" se queda el plano 2D y la lista.

import {
  THREE, canRender, createRenderer, createComposer, environment, mat, box, cyl, mesh, cable,
  floorLabel, screen, drawCycler, class9Label, hvWarning, canvasTexture, batteryPack,
  whenVisible, fontsReady, frameGovernor, mergeStatic, COLORS, FONT, MONO,
} from "./kit.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// ---------- Datos del recorrido (metros; x al este, z al sur) ----------
// Cámara y objetivo por paso, en el mismo orden que los .pstep del HTML
const CAM = [
  { p: [15, 19, 25], t: [0, 0, 1.5] }, // 00 la estación
  { p: [-1.5, 6.2, 21.5], t: [-9.5, 1, 10.4] }, // 01 llega la batería
  { p: [-5.4, 4.6, 7.4], t: [-10.4, 0.9, 4.4] }, // 02 recepción
  { p: [-6.7, 3.4, 6.4], t: [-7.9, 0.8, 2.4] }, // 03 inspección
  { p: [-4.4, 6.8, 0.6], t: [-9.6, 0.6, -4.8] }, // 04 cuarentena
  { p: [1.9, 2.7, -1.2], t: [-1.5, 1.15, -4.7] }, // 05 diagnóstico
  { p: [2.5, 19, 12], t: [3.5, 0, 0.6] }, // 06 decisión
  { p: [7.6, 4.4, 0.4], t: [3.9, 1.3, 5] }, // 07 reutilizar
  { p: [11.8, 4.6, -0.4], t: [7.6, 1, -4.9] }, // 08 reparar
  { p: [5.4, 5.2, 2.6], t: [10.2, 0.9, 5.4] }, // 09 reciclar
  { p: [25, 7.5, 16], t: [16.5, 1.2, 5] }, // 10 almacén y transporte
  { p: [-8.2, 2.3, 7.5], t: [-11.2, 1.4, 5.6] }, // 11 informe
  { p: [0.5, 8.5, 14.5], t: [-4.5, 0.8, 6] }, // 12 zona de demostración
];

// Dónde está el carro con la batería en cada paso y por dónde pasa para llegar
const BAT = [
  { at: [-9.5, 9.3] },
  { at: [-9.5, 9.3] },
  { at: [-9.5, 4.5], via: [[-9.5, 7.6]] },
  { at: [-7.6, 3.1], via: [[-8.6, 4.5]] },
  { at: [-9.5, -4.3], via: [[-7.6, 0], [-9.5, 0]] },
  { at: [-1.6, -4.4], via: [[-9.5, 0], [-1.6, 0]] },
  { at: [1.5, 0], via: [[-1.6, 0]] },
  { at: [4, 4.1], via: [[4, 0.35]] },
  { at: [7.5, -4.4], via: [[4, 0.35], [7.5, -0.35]] },
  { at: [10, 4.2], via: [[7.5, 0], [10, 0]] },
  { at: [12.9, 5], via: [[11.4, 5]] },
  { at: [12.9, 5] },
  { at: [12.9, 5] },
];

// Rutas pintadas en el suelo y pasos en los que se encienden
const ROUTES = [
  { pts: [[-9.5, 9.3], [-9.5, 7.6], [-9.5, 4.5], [-8.6, 4.5], [-7.6, 3.1], [-7.6, 0], [-1.6, 0], [-1.6, -4.4]], style: "solid", color: COLORS.accent, steps: [1, 2, 3, 5] },
  { pts: [[-7.6, 0], [-9.5, 0], [-9.5, -4.3]], style: "dash", color: COLORS.amber, steps: [4] },
  { pts: [[-1.6, 0], [1.5, 0]], style: "solid", color: COLORS.accent, steps: [5, 6] },
  { pts: [[1.5, 0.35], [4, 0.35], [4, 4.1]], style: "solid", color: COLORS.accent, steps: [6, 7] },
  { pts: [[1.5, -0.35], [7.5, -0.35], [7.5, -4.4]], style: "dash", color: COLORS.amber, steps: [6, 8] },
  { pts: [[1.5, 0], [10, 0], [10, 4.2], [12.9, 5]], style: "dot", color: COLORS.red, steps: [6, 9, 10] },
];

const ZONES = [
  { id: "recepcion", code: "Z1", name: "Recepción", r: [-13, -6, 1, 8] },
  { id: "cuarentena", code: "Z2", name: "Cuarentena", r: [-13, -6, -8, -1], tint: COLORS.amber },
  { id: "laboratorio", code: "Z3", name: "Laboratorio", r: [-6, 3, -8, -1] },
  { id: "reparacion", code: "Z4", name: "Reparación", r: [3, 13, -8, -1] },
  { id: "segunda-vida", code: "Z5", name: "Segunda vida", r: [1, 7, 1, 8] },
  { id: "almacen", code: "Z6", name: "Almacén de salida", r: [7, 13, 1, 8] },
  { id: "demo", code: "Z7", name: "Zona de demostración", r: [-6, 1, 1, 8] },
];

const WALL_H = 1.55;
const STILL = new URLSearchParams(location.search).has("still");
const WALL_T = 0.2;

async function init(wrap) {
  const stage = wrap.querySelector(".station__stage");
  const steps = [...wrap.querySelectorAll(".pstep")];
  if (!stage || steps.length !== CAM.length) return;
  await fontsReady();

  const canvas = document.createElement("canvas");
  canvas.className = "station__canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.prepend(canvas);

  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.Fog(COLORS.bg, 38, 95);
  environment(renderer, scene);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const post = createComposer(renderer, scene, camera, { bloom: 0.5 });
  const govern = frameGovernor(post);
  // Las sombras solo se recalculan cuando algo se mueve
  renderer.shadowMap.autoUpdate = false;

  // ---------- Luz ----------
  scene.add(new THREE.HemisphereLight(0xdfeee6, 0x0b0f0d, 0.32));
  const sun = new THREE.DirectionalLight(0xfff1de, 2.9);
  sun.position.set(-14, 26, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fd9bd, 0.5);
  fill.position.set(18, 10, -12);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  const add = (...o) => world.add(...o);

  // Se construye por tramos y se cede el hilo entre ellos: la página no se congela
  const breathe = () => new Promise((r) => setTimeout(r));
  buildGround(add);
  buildBuilding(add);
  const zoneFx = buildZones(add);
  await breathe();
  buildReception(add);
  buildQuarantine(add);
  buildLab(add);
  await breathe();
  buildRepair(add);
  buildSecondLife(add);
  buildStore(add);
  await breathe();
  buildDemo(add);
  buildCarport(add);
  buildSurroundings(add);
  buildDecisionMark(add);
  const routes = buildRoutes(add);
  // Todo lo anterior es fijo: se funde por material en pocas mallas (menos llamadas de dibujo)
  mergeStatic(world);
  await breathe();

  // Vehículos
  const van = buildVan();
  mergeStatic(van.group);
  add(van.group);
  const truck = buildTruck();
  mergeStatic(truck.group);
  add(truck.group);

  // Carro con la batería
  const cart = new THREE.Group();
  cart.add(box(1.75, 0.05, 0.95, "steel", 0, 0.78, 0, 0.01));
  for (const sx of [-0.82, 0.82]) for (const sz of [-0.42, 0.42]) {
    cart.add(cyl(0.018, 0.018, 0.72, "steel", sx, 0.41, sz, 8));
    cart.add(cyl(0.06, 0.06, 0.04, "rubber", sx, 0.06, sz, 14).rotateX(Math.PI / 2));
  }
  cart.add(box(1.75, 0.03, 0.95, "steel", 0, 0.2, 0, 0.01));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.016, 8, 24, Math.PI), mat("steel"));
  handle.position.set(-0.88, 0.95, 0);
  handle.rotation.y = Math.PI / 2;
  cart.add(handle);
  mergeStatic(cart);
  const pack = batteryPack({ lid: true });
  pack.group.position.y = 0.805;
  cart.add(pack.group);
  add(cart);

  // ---------- Recorrido ----------
  const vec2 = (a) => new THREE.Vector2(a[0], a[1]);
  const legs = BAT.map((b, i) => {
    const prev = i ? BAT[i - 1].at : b.at;
    const pts = [prev, ...(b.via || []), b.at].map(vec2);
    const lens = [0];
    for (let k = 1; k < pts.length; k++) lens.push(lens[k - 1] + pts[k].distanceTo(pts[k - 1]));
    return { pts, lens, total: lens[lens.length - 1] };
  });
  const along = (leg, m) => {
    if (!leg.total) return leg.pts[leg.pts.length - 1].clone();
    const d = m * leg.total;
    let k = 1;
    while (k < leg.lens.length - 1 && leg.lens[k] < d) k++;
    const t = (d - leg.lens[k - 1]) / (leg.lens[k] - leg.lens[k - 1] || 1);
    return leg.pts[k - 1].clone().lerp(leg.pts[k], t);
  };

  const data = steps.map((el) => ({
    el,
    zone: el.dataset.zone || "",
    state: el.dataset.state || "",
    name: el.dataset.name || "",
    status: el.dataset.status || "",
  }));

  // ---------- HUD y ficha que sigue a la batería ----------
  const hudN = wrap.querySelector("[data-hud-n]");
  const hudName = wrap.querySelector("[data-hud-name]");
  const hudBar = wrap.querySelector("[data-hud-bar]");
  const tag = wrap.querySelector("[data-bat-tag]");
  const tagText = tag?.querySelector("[data-bat-status]");
  const total = steps.length - 1;
  const pad = (n) => String(n).padStart(2, "0");

  document.documentElement.classList.add("has-3d");

  // ---------- Scroll → posición en el recorrido ----------
  let anchors = [];
  let focusY = 0.5;
  let desktop = true;
  const measure = () => {
    desktop = window.innerWidth >= 1024;
    const sr = stage.getBoundingClientRect();
    // Escritorio: el centro de la ficha cruza el centro de la pantalla.
    // Móvil: la parte alta de la ficha llega justo bajo el escenario.
    focusY = desktop ? 0.5 : ((parseFloat(getComputedStyle(stage).top) || 0) + sr.height + 24) / window.innerHeight;
    anchors = steps.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + (desktop ? Math.min(r.height, window.innerHeight) / 2 : 0);
    });
  };

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  const readF = () => {
    const y = window.scrollY + window.innerHeight * focusY;
    let i = 0;
    while (i < anchors.length - 1 && y > anchors[i + 1]) i++;
    const a = anchors[i];
    const b = anchors[Math.min(i + 1, anchors.length - 1)];
    const t = b > a ? clamp01((y - a) / (b - a)) : 0;
    // Pausa en cada parada: el movimiento ocurre en el tramo central
    return i + smooth(clamp01((t - 0.28) / 0.44));
  };

  // ---------- Estado activo ----------
  let active = -1;
  const setActive = (n) => {
    if (n === active) return;
    active = n;
    const d = data[n];
    steps.forEach((el, k) => el.classList.toggle("is-on", k === n));
    zoneFx.forEach((z) => (z.target = z.id === d.zone ? 1 : 0));
    routes.forEach((r) => (r.target = r.steps.includes(n) ? 1 : 0));
    pack.setState(d.state);
    if (hudN) hudN.textContent = `${pad(n)} / ${pad(total)}`;
    if (hudName) hudName.textContent = d.name;
    if (tagText) tagText.textContent = d.status;
    if (tag) tag.dataset.state = d.state;
  };

  // ---------- Encuadre ----------
  let W = 1;
  let H = 1;
  const resize = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    post.setSize(W, H);
    camera.aspect = W / H;
    // En escritorio la ficha ocupa la izquierda: se desplaza el centro de la imagen
    // ?still: encuadre centrado para generar imágenes fijas de la escena
    const left = desktop && !STILL ? Math.min(W * 0.4, 560) : 0;
    if (left) camera.setViewOffset(W, H, -left / 2, 0, W, H);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  // ---------- Fotograma ----------
  const cur = { f: 0 };
  const camPos = new THREE.Vector3();
  const camAt = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const proj = new THREE.Vector3();
  let first = true;

  const lerp3 = (a, b, t, out) => out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);

  const update = (dt) => {
    const target = readF();
    const k = first ? 1 : 1 - Math.exp(-dt * 4.2);
    first = false;
    const prevF = cur.f;
    const prevPtr = ptr.x + ptr.y;
    cur.f += (target - cur.f) * k;
    const f = cur.f;
    const i = Math.min(Math.floor(f), total);
    const m = f - i;
    const j = Math.min(i + 1, total);
    setActive(m < 0.5 ? i : j);

    // Cámara: interpola posición y objetivo; se eleva un poco a mitad de trayecto
    lerp3(CAM[i].p, CAM[j].p, m, tmpA);
    lerp3(CAM[i].t, CAM[j].t, m, tmpB);
    tmpA.y += Math.sin(Math.PI * m) * 2.2;
    // Pantallas verticales: la cámara se aleja para que quepa la escena
    if (camera.aspect < 1) tmpA.sub(tmpB).multiplyScalar(1 + (1 - camera.aspect) * 0.75).add(tmpB);
    camPos.copy(tmpA);
    camAt.copy(tmpB);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 3));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 3));
    camera.position.copy(camPos);
    camera.position.x += ptr.x * 0.5;
    camera.position.y += ptr.y * 0.3;
    camera.lookAt(camAt);

    // Furgoneta: llega por la calle entre el paso 0 y el 1
    van.place(smooth(clamp01(f)));
    // Camión: sale entre el paso 10 y el 11
    truck.place(smooth(clamp01(f - 10)));

    // Carro y batería
    const leg = legs[j];
    let p;
    if (f < 1) p = van.doorPoint();
    else p = along(legs[i + 1] || leg, i + 1 <= total ? m : 1);
    if (f >= total) p = vec2(BAT[total].at);
    cart.position.set(p.x, 0, p.y);
    // Orientación: mira hacia donde avanza
    const ahead = f < 1 ? null : along(legs[i + 1] || leg, Math.min(1, m + 0.02));
    if (ahead && ahead.distanceTo(p) > 1e-3) {
      const ang = Math.atan2(-(ahead.y - p.y), ahead.x - p.x);
      let d = ang - cart.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      cart.rotation.y += d * (1 - Math.exp(-dt * 6));
    }
    cart.visible = f > 0.55 && f < 10.35;
    pack.setExplode(clamp01(1 - Math.abs(f - 5) * 1.7));

    // Salas y rutas encendidas
    zoneFx.forEach((z) => {
      z.v += (z.target - z.v) * (1 - Math.exp(-dt * 5));
      z.mat.opacity = z.v * 0.07;
      z.edge.opacity = 0.18 + z.v * 0.7;
    });
    routes.forEach((r) => {
      r.v += (r.target - r.v) * (1 - Math.exp(-dt * 5));
      r.mat.opacity = 0.28 + r.v * 0.72;
      // La ruta activa pasa del umbral del brillo: se ve como pintura luminosa
      r.mat.color.copy(r.base).multiplyScalar(1 + r.v * 2.8);
    });
    const fading = zoneFx.some((z) => Math.abs(z.target - z.v) > 1e-3) || routes.some((r) => Math.abs(r.target - r.v) > 1e-3);
    const moved = Math.abs(cur.f - prevF) > 1e-5 || Math.abs(ptr.x + ptr.y - prevPtr) > 1e-4;

    // HUD
    if (hudBar) hudBar.style.transform = `scaleX(${(f / total).toFixed(4)})`;

    // Ficha sobre la batería
    if (tag) {
      proj.set(cart.position.x, 1.35, cart.position.z).project(camera);
      const show = cart.visible && proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
      tag.style.opacity = show ? "1" : "0";
      tag.style.transform = `translate(${((proj.x + 1) / 2) * W}px, ${((1 - proj.y) / 2) * H}px)`;
    }
    if (moved) renderer.shadowMap.needsUpdate = true;
    return moved || fading;
  };

  // ---------- Bucle ----------
  let raf = 0;
  let last = performance.now();
  let lastDraw = 0;
  let running = false;
  let force = true;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Escena quieta: no se repinta (el bucle sigue, pero casi no cuesta)
    if (!update(dt) && !force) return;
    force = false;
    post.render();
    if (lastDraw) govern((now - lastDraw) / 1000);
    lastDraw = now;
  };
  const start = () => {
    if (running) return;
    running = true;
    force = true;
    lastDraw = 0;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  if (window.matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ptr.ty = -((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener("pointerleave", () => (ptr.tx = ptr.ty = 0));
  }

  measure();
  resize();
  update(0);
  renderer.shadowMap.needsUpdate = true;
  // Shaders compilados en segundo plano antes del primer fotograma
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  post.render();
  wrap.classList.add("is-ready");

  new ResizeObserver(() => {
    measure();
    resize();
    force = true;
  }).observe(stage);
  // Si cambia la altura de lo que hay por encima (fuentes, imágenes), las paradas se vuelven a medir
  new ResizeObserver(measure).observe(document.body);
  window.addEventListener("load", measure, { once: true });
  whenVisible(wrap, (on) => (on ? start() : stop()), "200px");

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    if (!e.matches) return;
    stop();
    document.documentElement.classList.remove("has-3d");
    canvas.remove();
    renderer.dispose();
  });
}

// =====================================================================
// Construcción de la escena
// =====================================================================

function plane(w, d, material, x, y, z) {
  const m = mesh(new THREE.PlaneGeometry(w, d), material, x, y, z, { cast: false });
  m.rotation.x = -Math.PI / 2;
  return m;
}

function buildGround(add) {
  // Polígono: suelo exterior, calle con marcas, acera y acceso de camiones
  add(plane(220, 160, "asphalt", 0, 0, 0));
  add(plane(30, 4.6, "sidewalk", -8, 0.01, 10.3));
  const street = plane(220, 7, mat("asphalt").clone(), 0, 0.012, 15.9);
  street.material.color.setHex(0x1b201e);
  add(street);
  const dash = new THREE.MeshBasicMaterial({ color: 0x8e9a93, toneMapped: false });
  for (let x = -100; x < 100; x += 6) add(plane(3, 0.14, dash, x, 0.02, 15.9));
  add(plane(220, 0.12, dash, 0, 0.02, 12.6));
  add(plane(30, 6, mat("asphalt").clone(), 28, 0.006, 5));
  // Bordillo
  add(box(30, 0.14, 0.2, "sidewalk", -8, 0.07, 12.55, 0.02));
}

function buildBuilding(add) {
  // Solera de hormigón
  add(box(26.4, 0.16, 16.4, "concrete", 0, 0.0, 0, 0.04, { cast: false }));
  // Rejilla de juntas del hormigón
  const jt = canvasTexture(512, 512, (g, W) => {
    g.fillStyle = "#3b423e";
    g.fillRect(0, 0, W, W);
    g.strokeStyle = "rgba(0,0,0,.28)";
    g.lineWidth = 3;
    for (let k = 0; k <= W; k += W / 4) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k, W);
      g.moveTo(0, k);
      g.lineTo(W, k);
      g.stroke();
    }
    // Moteado del hormigón
    for (let n = 0; n < 2400; n++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.05})`;
      g.fillRect(Math.random() * W, Math.random() * W, 2, 2);
    }
  });
  jt.wrapS = jt.wrapT = THREE.RepeatWrapping;
  jt.repeat.set(26 / 6, 16 / 6);
  const floorMat = new THREE.MeshStandardMaterial({ map: jt, roughness: 0.88 });
  add(plane(26, 16, floorMat, 0, 0.082, 0));

  // Muros: [x1, z1, x2, z2] con huecos ya resueltos
  const W = [
    // Perímetro
    [-13, -8, 13, -8],
    [-13, -8, -13, 8],
    [-13, 8, -10.5, 8],
    [-8.5, 8, 13, 8],
    [13, -8, 13, 3.5],
    [13, 6.5, 13, 8],
    // Fila norte: frente al pasillo con puertas
    [-13, -1, -10.4, -1],
    [-8.6, -1, -3, -1],
    [0, -1, 6.5, -1],
    [8.5, -1, 13, -1],
    [-6, -8, -6, -1],
    [3, -8, 3, -1],
    // Fila sur
    [-13, 1, -10.4, 1],
    [-8.6, 1, -6, 1],
    [1, 1, 3, 1],
    [5, 1, 9, 1],
    [11, 1, 13, 1],
    [-6, 1, -6, 8],
    [1, 1, 1, 8],
    [7, 1, 7, 8],
  ];
  W.forEach(([x1, z1, x2, z2]) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const w = mesh(new THREE.BoxGeometry(x1 === x2 ? WALL_T : len + WALL_T, WALL_H, x1 === x2 ? len + WALL_T : WALL_T), "wall", (x1 + x2) / 2, WALL_H / 2 + 0.08, (z1 + z2) / 2);
    add(w);
    // Remate superior más claro: lectura del corte
    add(mesh(new THREE.BoxGeometry(x1 === x2 ? WALL_T + 0.02 : len + WALL_T + 0.02, 0.03, x1 === x2 ? len + WALL_T + 0.02 : WALL_T + 0.02), "wallTop", (x1 + x2) / 2, WALL_H + 0.095, (z1 + z2) / 2, { cast: false }));
  });

  // Muros cortafuegos de la cuarentena: franja ámbar
  const fire = new THREE.MeshStandardMaterial({ color: COLORS.amber, roughness: 0.5, emissive: 0x3a2400, emissiveIntensity: 0.4 });
  [[-13, -1, -10.4, -1], [-8.6, -1, -6, -1], [-6, -8, -6, -1]].forEach(([x1, z1, x2, z2]) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    add(mesh(new THREE.BoxGeometry(x1 === x2 ? WALL_T + 0.03 : len + 0.03, 0.18, x1 === x2 ? len + 0.03 : WALL_T + 0.03), fire, (x1 + x2) / 2, WALL_H - 0.2, (z1 + z2) / 2, { cast: false }));
  });

  // Puerta enrollable abierta del muelle y puerta de clientes
  add(box(0.3, 0.3, 3.2, "steelDark", 13, WALL_H + 0.05, 5, 0.03));
  add(box(2.1, 0.12, 0.3, "steelDark", -9.5, WALL_H + 0.02, 8, 0.02));
  // Rótulo de la estación sobre la entrada
  const sign = screen(3.2, 0.5, (g, w, h) => {
    g.fillStyle = "#0e1311";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3ddc84";
    g.fillRect(h * 0.32, h * 0.3, h * 0.42, h * 0.42);
    g.fillStyle = "#eef2ee";
    g.font = `400 ${h * 0.5}px ${FONT}`;
    g.textBaseline = "middle";
    g.fillText("Estación SegundaVida", h * 0.95, h * 0.54);
  }, 1024);
  sign.position.set(-9.5, WALL_H - 0.35, 8.13);
  add(sign);
}

function buildZones(add) {
  return ZONES.map((z) => {
    const [x0, x1, z0, z1] = z.r;
    const w = x1 - x0;
    const d = z1 - z0;
    const color = z.tint ?? COLORS.accent;
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const p = plane(w - 0.3, d - 0.3, m, (x0 + x1) / 2, 0.095, (z0 + z1) / 2);
    p.renderOrder = 1;
    add(p);
    // Contorno pintado de la sala
    const edge = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18, toneMapped: false });
    const pts = [[x0 + 0.25, z0 + 0.25], [x1 - 0.25, z0 + 0.25], [x1 - 0.25, z1 - 0.25], [x0 + 0.25, z1 - 0.25], [x0 + 0.25, z0 + 0.25]].map(([x, zz]) => new THREE.Vector3(x, 0.1, zz));
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edge));
    // Rótulo en el suelo, junto al pasillo
    const north = z1 <= -1;
    const lw = Math.min(3.8, w - 1.2);
    const lbl = floorLabel(z.code, z.name, { w: lw, tint: z.tint ? "#f2a93b" : "#3ddc84" });
    lbl.position.set((x0 + x1) / 2, 0.1, north ? z1 - 0.8 : z0 + 0.8);
    add(lbl);
    // Rayado de seguridad en el suelo de la cuarentena
    if (z.id === "cuarentena") {
      const hatch = canvasTexture(256, 256, (g, W2) => {
        g.clearRect(0, 0, W2, W2);
        g.strokeStyle = "rgba(242,169,59,.35)";
        g.lineWidth = 18;
        for (let k = -W2; k < W2 * 2; k += 64) {
          g.beginPath();
          g.moveTo(k, 0);
          g.lineTo(k + W2, W2);
          g.stroke();
        }
      });
      hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
      hatch.repeat.set(3, 1.2);
      const hp = plane(5.4, 1.2, new THREE.MeshBasicMaterial({ map: hatch, transparent: true, depthWrite: false, toneMapped: false }), -9.5, 0.097, -2.0);
      add(hp);
    }
    return { id: z.id, mat: m, edge, v: 0, target: 0 };
  });
}

function buildReception(add) {
  // Mostrador (deja libre el paso de la puerta al pasillo)
  add(box(2.4, 1.05, 0.7, "white", -11.2, 0.6, 5.9, 0.03));
  add(box(2.5, 0.05, 0.8, "steelDark", -11.2, 1.15, 5.9, 0.01));
  add(box(0.7, 1.05, 1.4, "white", -12.35, 0.6, 6.8, 0.03));
  // Pantalla con el pasaporte leído
  const mon = new THREE.Group();
  mon.add(box(0.62, 0.4, 0.03, "plasticDark", 0, 0, 0, 0.01));
  const sc = screen(0.58, 0.36, drawReport, 512);
  sc.position.z = 0.017;
  mon.add(sc);
  mon.add(cyl(0.02, 0.02, 0.22, "steelDark", 0, -0.3, -0.03, 8));
  mon.position.set(-11.2, 1.55, 5.65);
  add(mon);
  // Lector de QR
  add(box(0.08, 0.16, 0.12, "plasticDark", -10.3, 1.24, 5.75, 0.02));
  add(box(0.05, 0.02, 0.08, mat("led"), -10.3, 1.33, 5.72, 0.005));
  // Mesa de inspección con cámara térmica en trípode
  add(box(1.9, 0.06, 0.95, "steel", -7.6, 0.88, 1.95, 0.01));
  for (const sx of [-0.88, 0.88]) for (const sz of [-0.42, 0.42]) add(cyl(0.025, 0.025, 0.8, "steel", -7.6 + sx, 0.48, 1.95 + sz, 8));
  const tri = new THREE.Group();
  for (let a = 0; a < 3; a++) {
    const leg = cyl(0.012, 0.012, 1.5, "steelDark", 0, 0.72, 0, 6);
    leg.rotation.z = 0.25;
    const pivot = new THREE.Group();
    pivot.add(leg);
    pivot.rotation.y = (a * Math.PI * 2) / 3;
    tri.add(pivot);
  }
  tri.add(box(0.16, 0.12, 0.22, "plasticDark", 0, 1.48, 0, 0.02));
  tri.add(cyl(0.04, 0.04, 0.05, "glass", 0, 1.48, 0.13, 16).rotateX(Math.PI / 2));
  tri.position.set(-6.7, 0.08, 3.6);
  add(tri);
  // Banco de espera y estantería de embalajes
  add(box(1.8, 0.45, 0.45, "bench", -12.1, 0.3, 2.2, 0.03));
  for (let k = 0; k < 4; k++) add(box(0.5, 0.03, 2.2, "steel", -12.6, 0.3 + k * 0.42, 4.0, 0.005));
  for (const z of [2.95, 5.05]) add(box(0.5, 1.5, 0.04, "steel", -12.6, 0.83, z, 0.005));
  for (let k = 0; k < 3; k++) add(box(0.4, 0.28, 0.5, "wood", -12.6, 0.47 + k * 0.42, 3.3 + (k % 2) * 0.9, 0.02));
  addPerson(add, -11.2, 6.7, Math.PI, "overall");
}

function drawReport(g, W, H) {
  g.fillStyle = "#0b1210";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#3ddc84";
  g.fillRect(0, 0, W, H * 0.13);
  g.fillStyle = "#03140a";
  g.font = `500 ${H * 0.075}px ${MONO}`;
  g.fillText("PASAPORTE · LEÍDO", W * 0.04, H * 0.09);
  // QR esquemático
  const s = H * 0.42;
  g.fillStyle = "#eef2ee";
  g.fillRect(W * 0.05, H * 0.22, s, s);
  g.fillStyle = "#0b1210";
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i * 7 + j * 3) % 5 < 2) g.fillRect(W * 0.05 + (i * s) / 9, H * 0.22 + (j * s) / 9, s / 9, s / 9);
  g.fillStyle = "#b3bdb7";
  g.font = `400 ${H * 0.065}px ${FONT}`;
  ["Química", "Capacidad", "Historial", "Desmontaje"].forEach((t, i) => g.fillText(t, W * 0.5, H * (0.3 + i * 0.13)));
  g.fillStyle = "#3ddc84";
  for (let i = 0; i < 4; i++) g.fillRect(W * 0.82, H * (0.26 + i * 0.13), W * 0.12, H * 0.05);
  g.fillStyle = "#8b968f";
  g.font = `400 ${H * 0.055}px ${FONT}`;
  g.fillText("Datos de demostración", W * 0.05, H * 0.92);
}

function buildQuarantine(add) {
  // Contenedores ignífugos
  [-11.6, -9.5, -7.4].forEach((x, i) => {
    add(box(1.6, 1.0, 1.1, "amberPaint", x, 0.58, -6.7, 0.04));
    const lid = box(1.64, 0.08, 1.14, "steelDark", x, 1.12, -6.7, 0.02);
    if (i === 1) {
      lid.position.set(x, 1.5, -7.2);
      lid.rotation.x = -1.1;
    }
    add(lid);
    add(box(0.5, 0.18, 0.02, "white", x, 0.8, -6.14, 0.005));
  });
  // Extintor para litio y detector de temperatura y humo
  add(cyl(0.11, 0.11, 0.6, "redPaint", -6.55, 0.4, -1.55, 16));
  add(cyl(0.05, 0.05, 0.08, "steelDark", -6.55, 0.74, -1.55, 10));
  add(cyl(0.025, 0.025, 2.2, "steelDark", -12.7, 1.18, -1.4, 8));
  const det = cyl(0.14, 0.14, 0.06, "white", -12.7, 2.3, -1.4, 18);
  add(det);
  add(cyl(0.03, 0.03, 0.02, mat("led").clone(), -12.7, 2.27, -1.4, 8));
  // Termómetro de pared con pantalla
  const th = screen(0.5, 0.3, (g, W, H) => {
    g.fillStyle = "#1a1408";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#f2a93b";
    g.font = `500 ${H * 0.22}px ${MONO}`;
    g.fillText("TEMP · VIGILANCIA", W * 0.06, H * 0.3);
    g.strokeStyle = "#f2a93b";
    g.lineWidth = 4;
    g.beginPath();
    for (let x = 0; x < W; x += 6) g.lineTo(x, H * 0.75 - Math.exp(-x / (W * 0.3)) * H * 0.3);
    g.stroke();
  });
  th.position.set(-12.88, 1.15, -4.3);
  th.rotation.y = Math.PI / 2;
  add(th);
}

function buildLab(add) {
  // Equipos de carga y descarga contra el muro norte
  [-5.1, -4.0, -2.9, -1.8].forEach((x, i) => {
    add(box(0.95, 2.0, 0.75, "steelDark", x, 1.08, -7.4, 0.03));
    const s = screen(0.6, 0.38, drawCycler(i));
    s.position.set(x, 1.62, -7.02);
    add(s);
    for (let r = 0; r < 4; r++) add(box(0.7, 0.05, 0.02, "plasticDark", x, 0.45 + r * 0.18, -7.02, 0.005));
    add(box(0.06, 0.06, 0.02, mat("led"), x + 0.36, 1.98, -7.02, 0.01));
  });
  // Banco de pruebas junto al carro
  add(box(2.4, 0.06, 0.9, "steel", -1.6, 0.9, -6.1, 0.01));
  for (const sx of [-1.12, 1.12]) for (const sz of [-0.38, 0.38]) add(cyl(0.025, 0.025, 0.82, "steel", -1.6 + sx, 0.49, -6.1 + sz, 8));
  // Comprobador de aislamiento y portátil
  add(box(0.36, 0.16, 0.26, "amberPaint", -2.4, 1.01, -6.1, 0.02));
  const lap = new THREE.Group();
  lap.add(box(0.42, 0.02, 0.3, "plasticDark", 0, 0, 0, 0.005));
  const ls = screen(0.4, 0.26, drawCycler(4), 256);
  ls.position.set(0, 0.15, -0.15);
  ls.rotation.x = -0.25;
  lap.add(ls);
  lap.position.set(-0.9, 0.95, -6.1);
  add(lap);
  // Cables de medida del equipo al pack (naranja: alta tensión)
  [[-2.9, COLORS.hv], [-1.8, 0x111111]].forEach(([x, c]) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.6, -7.0),
      new THREE.Vector3(x + 0.2, 0.25, -6.3),
      new THREE.Vector3(-1.9, 0.6, -5.1),
      new THREE.Vector3(-1.75, 1.0, -4.62),
    ]);
    add(mesh(new THREE.TubeGeometry(curve, 40, 0.018, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), 0, 0, 0));
  });
  addPerson(add, -0.4, -5.5, -Math.PI / 2.4, "overall");
}

function buildRepair(add) {
  // Banco de trabajo con tablero de herramientas
  add(box(2.6, 0.08, 0.95, "wood", 7.5, 0.9, -6.3, 0.01));
  add(box(2.6, 0.8, 0.9, "bench", 7.5, 0.48, -6.3, 0.02));
  add(box(2.8, 0.5, 0.06, "steelDark", 7.5, 1.25, -7.82, 0.01));
  for (let i = 0; i < 9; i++) add(box(0.05, 0.2 + (i % 3) * 0.06, 0.04, i % 2 ? "steel" : "hv", 6.4 + i * 0.27, 1.25, -7.76, 0.01));
  // Soldadora de pletinas y piezas en la mesa
  add(box(0.4, 0.34, 0.36, "white", 6.6, 1.11, -6.2, 0.03));
  add(box(0.64, 0.11, 0.22, "alu", 7.9, 0.99, -6.1, 0.008));
  add(box(0.64, 0.11, 0.22, "alu", 8.1, 0.99, -6.45, 0.008));
  // Estantería de módulos de recambio
  for (let s = 0; s < 3; s++) {
    add(box(2.6, 0.04, 0.6, "steel", 11.2, 0.4 + s * 0.6, -7.4, 0.005));
    for (let k = 0; k < 3; k++) add(box(0.64, 0.11, 0.22, "alu", 10.4 + k * 0.78, 0.48 + s * 0.6, -7.4, 0.008));
  }
  for (const x of [9.92, 12.48]) add(box(0.04, 1.7, 0.6, "steel", x, 0.93, -7.4, 0.005));
  addPerson(add, 8.6, -5.6, -Math.PI / 1.6, "overall");
}

function buildSecondLife(add) {
  // Armarios de almacenamiento: blancos, con rejilla y tira LED
  [2.1, 3.25, 4.4, 5.55].forEach((x) => {
    // Zócalo, cuerpo de chapa y dos puertas con junta entre ellas
    add(box(0.98, 0.1, 0.76, "plasticDark", x, 0.13, 7.3, 0.01));
    add(box(1.0, 2.0, 0.8, "white", x, 1.18, 7.3, 0.025));
    add(box(0.006, 1.9, 0.01, "plasticDark", x, 1.18, 6.9, 0.002, { cast: false }));
    add(box(0.98, 0.006, 0.01, "plasticDark", x, 1.62, 6.9, 0.002, { cast: false }));
    // Tiradores verticales
    for (const s of [-1, 1]) add(box(0.02, 0.28, 0.03, "steel", x + s * 0.06, 1.2, 6.885, 0.008));
    // Rejillas de ventilación arriba y abajo
    for (const y0 of [0.38, 1.88]) for (let r = 0; r < 5; r++) add(box(0.78, 0.012, 0.012, "steelDark", x, y0 + r * 0.03, 6.894, 0.003, { cast: false }));
    // Pantalla de estado, tira LED y placa de características
    add(box(0.16, 0.1, 0.012, "plasticDark", x - 0.3, 1.75, 6.895, 0.004));
    add(box(0.12, 0.06, 0.004, mat("led"), x - 0.3, 1.75, 6.889, 0.002, { cast: false }));
    add(box(0.5, 0.02, 0.01, mat("led"), x + 0.15, 2.05, 6.896, 0.004, { cast: false }));
    add(box(0.12, 0.07, 0.004, "alu", x + 0.32, 0.62, 6.895, 0.002, { cast: false }));
  });
  // Bastidor con módulos agrupados por capacidad
  for (let r = 0; r < 4; r++) add(box(0.64, 0.11, 0.22, "alu", 3.25, 0.5 + r * 0.32, 6.95, 0.008));
}

function buildStore(add) {
  // Contenedores homologados para reciclaje, con etiqueta de clase 9
  const lbl = new THREE.MeshBasicMaterial({ map: class9Label(), transparent: true });
  [[9.2, 6.6], [10.9, 6.6]].forEach(([x, z]) => {
    add(box(1.4, 1.1, 1.1, "steel", x, 0.63, z, 0.03));
    add(box(1.44, 0.07, 1.14, "steelDark", x, 1.21, z, 0.02));
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), lbl);
    l.position.set(x, 0.75, z - 0.565);
    l.rotation.y = Math.PI;
    add(l);
  });
  // Huecos de almacenamiento pintados: distancia mínima entre baterías
  const lineM = new THREE.MeshBasicMaterial({ color: 0xeef2ee, transparent: true, opacity: 0.35, toneMapped: false });
  [[8.2, 3.2], [10.0, 3.2], [11.8, 3.2]].forEach(([x, z]) => {
    [[0, -0.6, 1.3, 0.05], [0, 0.6, 1.3, 0.05], [-0.65, 0, 0.05, 1.2], [0.65, 0, 0.05, 1.2]].forEach(([dx, dz, w, d]) => add(plane(w, d, lineM, x + dx, 0.1, z + dz)));
  });
  // Batería embalada lista para salir
  add(box(1.1, 0.5, 0.8, "wood", 8.2, 0.34, 3.2, 0.02));
  add(box(1.0, 0.36, 0.7, "plasticDark", 8.2, 0.75, 3.2, 0.02));
  // Transpalé
  add(box(0.5, 0.12, 1.2, "steelDark", 11.8, 0.14, 3.2, 0.02));
  add(cyl(0.02, 0.02, 1.0, "steelDark", 11.8, 0.65, 2.55, 6));
}

function buildDemo(add) {
  // Armario de demostración con frente transparente
  add(box(1.1, 2.0, 0.8, "white", -4.6, 1.08, 7.3, 0.03));
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd9bd, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 });
  add(mesh(new THREE.BoxGeometry(0.9, 1.6, 0.02), glass, -4.6, 1.1, 6.89, { cast: false }));
  for (let r = 0; r < 5; r++) add(box(0.64, 0.11, 0.22, "alu", -4.6, 0.5 + r * 0.28, 7.25, 0.008));
  add(box(0.5, 0.03, 0.02, mat("led"), -4.6, 1.95, 6.88, 0.005));
  // Conducto hacia las placas de la marquesina
  add(box(0.08, 2.3, 0.08, "steelDark", -5.6, 1.23, 7.82, 0.01));
  // Paneles explicativos y taburetes para visitas
  [-2.6, -1.0].forEach((x) => {
    add(box(1.2, 1.6, 0.05, "plasticDark", x, 1.0, 7.6, 0.01));
    const s = screen(1.1, 1.4, (g, W, H) => {
      g.fillStyle = "#121916";
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#3ddc84";
      g.fillRect(W * 0.08, H * 0.08, W * 0.2, W * 0.2);
      g.fillStyle = "#eef2ee";
      g.font = `400 ${W * 0.1}px ${FONT}`;
      g.fillText(x < -2 ? "Reutilizar" : "Segunda vida", W * 0.08, H * 0.42);
      g.fillStyle = "#8b968f";
      for (let k = 0; k < 6; k++) g.fillRect(W * 0.08, H * (0.52 + k * 0.06), W * (0.84 - (k % 3) * 0.18), H * 0.02);
    }, 256);
    s.position.set(x, 1.0, 7.57);
    s.rotation.y = Math.PI;
    add(s);
  });
  [[-3.6, 4.4], [-2.6, 4.9], [-1.6, 4.4]].forEach(([x, z]) => add(cyl(0.22, 0.2, 0.46, "bench", x, 0.31, z, 18)));
}

function buildCarport(add) {
  // Marquesina solar sobre el aparcamiento de la entrada
  [[-12.4, 9.1], [-6.6, 9.1], [-12.4, 11.6], [-6.6, 11.6]].forEach(([x, z]) => add(box(0.16, 3.4, 0.16, "steel", x, 1.7, z, 0.02)));
  const roof = new THREE.Group();
  roof.add(box(6.4, 0.1, 3.2, "steelDark", 0, 0, 0, 0.02));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const p = box(1.0, 0.04, 0.98, "pv", -2.6 + i * 1.04, 0.07, -1.03 + j * 1.03, 0.005);
    p.castShadow = true;
    roof.add(p);
  }
  roof.position.set(-9.5, 3.5, 10.35);
  roof.rotation.x = -0.12;
  add(roof);
}

function buildSurroundings(add) {
  // Naves vecinas del polígono, árboles y farolas
  [[-34, -18, 18, 7, 14], [0, -26, 26, 9, 12], [32, -16, 16, 6, 18], [-38, 30, 20, 8, 12], [34, 30, 18, 7, 12]].forEach(([x, z, w, h, d]) => {
    const b = box(w, h * 0.55, d, "steelDark", x, (h * 0.55) / 2, z, 0.1);
    b.material = b.material.clone();
    b.material.color.setHex(0x222a26);
    b.material.metalness = 0.2;
    add(b);
  });
  for (let x = -40; x <= 40; x += 9) {
    if (Math.abs(x + 9.5) < 4) continue;
    // Árbol: tronco, ramas y copa de masas con relieve irregular
    add(cyl(0.09, 0.16, 2.4, "trunk", x, 1.2, 20.2, 10));
    for (const a of [0.6, 2.4, 4.2]) {
      const br = cyl(0.03, 0.05, 1.1, "trunk", x + Math.cos(a) * 0.25, 2.3, 20.2 + Math.sin(a) * 0.25, 6);
      br.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
      add(br);
    }
    [[0, 3.0, 0, 1.1, "tree"], [0.65, 2.65, 0.35, 0.78, "tree2"], [-0.6, 2.7, -0.25, 0.82, "tree2"], [0.15, 3.65, -0.1, 0.72, "tree"], [-0.2, 2.5, 0.55, 0.6, "tree"]].forEach(([dx, y, dz, r, m]) =>
      add(mesh(foliage(r, x * 7 + dx * 13), m, x + dx, y, 20.2 + dz)));
  }
  for (let x = -36; x <= 36; x += 18) {
    add(cyl(0.06, 0.08, 6, "steelDark", x, 3, 12.9, 8));
    add(box(0.9, 0.08, 0.25, "steelDark", x + 0.4, 6, 12.9, 0.02));
    add(box(0.5, 0.02, 0.18, mat("led"), x + 0.55, 5.95, 12.9, 0.005));
  }
}

function foliage(r, seed) {
  // Vértices compartidos: así las normales se suavizan en lugar de quedar por cara
  const geo = mergeVertices(new THREE.IcosahedronGeometry(r, 4));
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const n = (x, y, z) => Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 - seed * 0.5) * Math.sin(z * 3.7 + seed * 0.3);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = 1 + n(v.x / r, v.y / r, v.z / r) * 0.16 + Math.sin((v.x + v.z) * 9 + seed) * 0.03;
    v.multiplyScalar(d);
    v.y *= 0.88;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildDecisionMark(add) {
  // Rombo de decisión pintado en el pasillo, con tres salidas
  const tex = canvasTexture(512, 512, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.translate(W / 2, W / 2);
    g.rotate(Math.PI / 4);
    g.strokeStyle = "#eef2ee";
    g.lineWidth = 14;
    g.strokeRect(-W * 0.22, -W * 0.22, W * 0.44, W * 0.44);
    g.rotate(-Math.PI / 4);
    g.fillStyle = "#eef2ee";
    g.font = `500 ${W * 0.09}px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("SoH", 0, 0);
  });
  const p = plane(1.7, 1.7, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }), 1.5, 0.1, 0);
  p.renderOrder = 3;
  add(p);
}

function buildRoutes(add) {
  return ROUTES.map((r) => {
    const m = new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false });
    const g = new THREE.Group();
    const y = 0.104;
    for (let k = 1; k < r.pts.length; k++) {
      const a = new THREE.Vector2(...r.pts[k - 1]);
      const b = new THREE.Vector2(...r.pts[k]);
      const len = a.distanceTo(b);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const put = (s, l, w) => {
        const c = a.clone().lerp(b, s);
        const seg = new THREE.Mesh(new THREE.PlaneGeometry(l, w), m);
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = -ang;
        seg.position.set(c.x, y, c.y);
        seg.renderOrder = 2;
        g.add(seg);
      };
      if (r.style === "solid") put(0.5, len + 0.1, 0.1);
      else if (r.style === "dash") for (let s = 0.2; s < len; s += 0.6) put(Math.min(s, len) / len, 0.34, 0.1);
      else for (let s = 0.1; s < len; s += 0.32) {
        const c = a.clone().lerp(b, s / len);
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), m);
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(c.x, y, c.y);
        dot.renderOrder = 2;
        g.add(dot);
      }
    }
    // Flecha al final
    const end = r.pts[r.pts.length - 1];
    const pre = r.pts[r.pts.length - 2];
    const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 3), m);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = -Math.atan2(end[1] - pre[1], end[0] - pre[0]);
    arrow.position.set(end[0], y + 0.001, end[1]);
    g.add(arrow);
    mergeStatic(g, { transparent: true });
    add(g);
    return { steps: r.steps, mat: m, base: m.color.clone(), v: 0, target: 0 };
  });
}

// ---------- Personas (plantilla de 3: casco, chaleco de alta visibilidad, botas) ----------
// Proporciones de un adulto de ~1,75 m: torso torneado y aplanado, cuello,
// piernas con rodilla, brazos con codo, manos y botas a escala.
const TORSO = new THREE.LatheGeometry(
  [[0.0, 0], [0.15, 0], [0.155, 0.08], [0.145, 0.2], [0.165, 0.36], [0.185, 0.46], [0.17, 0.53], [0.09, 0.58], [0.0, 0.59]].map(([x, y]) => new THREE.Vector2(x, y)),
  24
);
function segment(r1, r2, len, material) {
  // Miembro troncocónico con su extremo superior en el origen
  const m = mesh(new THREE.CylinderGeometry(r1, r2, len, 14), material, 0, -len / 2, 0);
  const g = new THREE.Group();
  g.add(m);
  g.add(mesh(new THREE.SphereGeometry(r2, 12, 8), material, 0, -len, 0));
  return g;
}
function addPerson(add, x, z, rot, suit = "overall") {
  const p = new THREE.Group();
  // Piernas: muslo y pierna con una ligera flexión de rodilla
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.095, 0.93, 0);
    const thigh = segment(0.075, 0.06, 0.43, suit);
    thigh.rotation.x = -0.06;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.set(0, -0.43, 0.02);
    const shin = segment(0.058, 0.048, 0.42, suit);
    shin.rotation.x = 0.08;
    knee.add(shin);
    hip.add(knee);
    p.add(hip);
    p.add(box(0.1, 0.085, 0.25, "boot", s * 0.095, 0.045, 0.045, 0.035));
  }
  // Pelvis, torso aplanado (más ancho que profundo) y chaleco encima
  const pelvis = mesh(new THREE.CylinderGeometry(0.155, 0.15, 0.16, 20), suit, 0, 0.95, 0);
  pelvis.scale.set(1, 1, 0.72);
  p.add(pelvis);
  const torso = mesh(TORSO, suit, 0, 0.98, 0);
  torso.scale.set(1, 1, 0.66);
  p.add(torso);
  const vest = mesh(TORSO, "vest", 0, 0.99, 0);
  vest.scale.set(1.06, 0.86, 0.72);
  p.add(vest);
  for (const y of [1.17, 1.3]) {
    const band = mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.03, 24, 1, true), "reflect", 0, y, 0, { cast: false });
    band.scale.set(1.04, 1, 0.74);
    p.add(band);
  }
  // Brazos: hombro, codo ligeramente doblado y mano
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.2, 1.45, 0);
    sh.rotation.z = s * 0.1;
    sh.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), "vest", 0, 0, 0));
    const upper = segment(0.055, 0.045, 0.3, suit);
    sh.add(upper);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.3, 0);
    elbow.rotation.x = -0.35;
    elbow.add(segment(0.044, 0.036, 0.27, suit));
    const hand = mesh(new THREE.SphereGeometry(0.042, 12, 10), "skin", 0, -0.31, 0.01);
    hand.scale.set(0.8, 1.2, 0.6);
    elbow.add(hand);
    sh.add(elbow);
    p.add(sh);
  }
  // Cuello, cabeza ovalada y casco con visera
  p.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.09, 12), "skin", 0, 1.6, 0));
  const head = mesh(new THREE.SphereGeometry(0.095, 20, 16), "skin", 0, 1.7, 0.01);
  head.scale.set(0.88, 1.12, 1);
  p.add(head);
  p.add(mesh(new THREE.SphereGeometry(0.108, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), "helmet", 0, 1.74, 0));
  p.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 24, 1, false, -Math.PI / 2, Math.PI), "helmet", 0, 1.745, 0.02));
  p.position.set(x, 0.08, z);
  p.rotation.y = rot;
  add(p);
}

// Rueda con neumático redondeado y llanta
function wheel(r, w) {
  const g = new THREE.Group();
  const tire = mesh(new THREE.TorusGeometry(r * 0.72, r * 0.28, 14, 32), "rubber", 0, 0, 0);
  tire.scale.z = w / (r * 0.56);
  g.add(tire);
  g.add(cyl(r * 0.5, r * 0.5, w * 0.8, "steel", 0, 0, 0, 24).rotateX(Math.PI / 2));
  g.add(cyl(r * 0.16, r * 0.16, w * 0.86, "steelDark", 0, 0, 0, 16).rotateX(Math.PI / 2));
  return g;
}

// Cuerpo de vehículo: perfil lateral extruido con biselado (lectura de chapa)
function profileBody(points, width, material, bevel = 0.06) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16 });
  geo.translate(0, 0, -(width - bevel * 2) / 2);
  return mesh(geo, material);
}

// Perfil con pasos de rueda: arcos recortados en la línea inferior
function withArches(top, bottomY, arches, r) {
  const pts = [...top];
  const front = top[top.length - 1][0];
  const rear = top[0][0];
  // De delante hacia atrás por la parte de abajo
  pts.push([front, bottomY]);
  [...arches].sort((a, b) => b - a).forEach((ax) => {
    pts.push([ax + r, bottomY]);
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI;
      pts.push([ax + Math.cos(a) * r, bottomY + Math.sin(a) * r]);
    }
  });
  pts.push([rear, bottomY]);
  return pts;
}

// ---------- Furgoneta de la estación ----------
function buildVan() {
  const g = new THREE.Group();
  const top = [
    [-2.6, 0.62], [-2.62, 2.05], [-2.5, 2.25], [1.15, 2.25], [1.35, 2.18],
    [2.05, 1.35], [2.55, 1.18], [2.68, 1.0], [2.7, 0.62],
  ];
  const ARCH = [-1.7, 1.75];
  g.add(profileBody(withArches(top, 0.36, ARCH, 0.46), 1.96, "vanPaint", 0.07));
  // Lunas: parabrisas inclinado y ventanillas de cabina
  const glass = mat("glass");
  // Parabrisas: plano orientado según la normal del tramo inclinado del perfil
  const ws = mesh(new THREE.PlaneGeometry(1.72, 1.04), glass, 1.7 + 0.76 * 0.08, 1.77 + 0.64 * 0.08, 0, { cast: false });
  ws.lookAt(ws.position.x + 0.76, ws.position.y + 0.64, 0);
  g.add(ws);
  for (const s of [-1, 1]) {
    const win = mesh(new THREE.PlaneGeometry(0.75, 0.55), glass, 1.25, 1.82, s * 0.985, { cast: false });
    if (s < 0) win.rotation.y = Math.PI;
    g.add(win);
  }
  // Rotulación de la estación en los costados
  const livery = canvasTexture(1024, 256, (c, W, H) => {
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#3ddc84";
    c.fillRect(0, H * 0.62, W, H * 0.16);
    c.fillStyle = "#0a0d0c";
    c.font = `400 ${H * 0.26}px ${FONT}`;
    c.fillText("Estación SegundaVida", W * 0.05, H * 0.42);
  });
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshStandardMaterial({ map: livery, transparent: true, roughness: 0.4 }));
    l.position.set(-0.85, 1.3, s * 0.992);
    if (s < 0) l.rotation.y = Math.PI;
    g.add(l);
  }
  // Puerta lateral corredera (lado del edificio), tirador y raíl
  g.add(box(1.25, 1.45, 0.02, "steelDark", 0.15, 1.2, -0.99, 0.01));
  g.add(box(2.4, 0.03, 0.03, "plasticDark", -0.4, 1.95, -0.995, 0.005));
  // Faros, pilotos, parachoques y espejos
  for (const s of [-1, 1]) {
    g.add(box(0.06, 0.12, 0.3, "ledWarm", 2.66, 1.02, s * 0.62, 0.02));
    g.add(box(0.05, 0.3, 0.12, "ledRed", -2.63, 1.4, s * 0.82, 0.02));
    g.add(box(0.12, 0.16, 0.06, "plasticDark", 1.6, 1.72, s * 1.08, 0.02));
  }
  g.add(box(0.2, 0.22, 1.98, "plasticDark", 2.72, 0.6, 0, 0.06));
  g.add(box(0.16, 0.2, 1.98, "plasticDark", -2.66, 0.55, 0, 0.05));
  g.add(box(0.1, 0.2, 1.4, "plasticDark", 2.71, 0.85, 0, 0.03));
  const wheels = [];
  for (const x of ARCH) for (const z of [-0.84, 0.84]) {
    const w = wheel(0.37, 0.24);
    w.userData.dynamic = true;
    w.position.set(x, 0.37, z);
    wheels.push(w);
    g.add(w);
  }
  // Trayectoria: por la calle hasta el aparcamiento bajo la marquesina
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-58, 0, 14.6),
    new THREE.Vector3(-26, 0, 14.6),
    new THREE.Vector3(-15.5, 0, 13.9),
    new THREE.Vector3(-11.6, 0, 11.2),
    new THREE.Vector3(-9.2, 0, 10.5),
  ]);
  const len = path.getLength();
  let lastU = -1;
  const door = new THREE.Vector2();
  return {
    group: g,
    place(u) {
      const p = path.getPointAt(u);
      const t = path.getTangentAt(Math.min(0.999, u));
      g.position.copy(p);
      g.rotation.y = Math.atan2(-t.z, t.x);
      if (lastU >= 0) wheels.forEach((w) => (w.rotation.z -= ((u - lastU) * len) / 0.37));
      lastU = u;
      door.set(p.x + 0.2, p.z - 1.25);
    },
    doorPoint() {
      return door.clone();
    },
  };
}

// ---------- Camión de transporte homologado ----------
function buildTruck() {
  const g = new THREE.Group();
  // Cabina: perfil extruido
  const cab = profileBody(
    [[-0.9, 0.7], [-0.9, 2.55], [0.5, 2.55], [0.75, 2.35], [0.95, 1.4], [1.0, 0.7]],
    2.3,
    "vanPaint",
    0.08
  );
  cab.position.x = 2.5;
  g.add(cab);
  g.add(box(0.25, 0.32, 2.36, "plasticDark", 3.55, 0.78, 0, 0.05));
  g.add(box(0.06, 0.5, 1.5, "plasticDark", 3.55, 1.2, 0, 0.02));
  for (let k = 0; k < 5; k++) g.add(box(0.02, 0.025, 1.4, "steel", 3.59, 1.0 + k * 0.1, 0, 0.005, { cast: false }));
  for (const s of [-1, 1]) {
    g.add(box(0.012, 1.55, 0.01, "plasticDark", 2.0, 1.55, s * 1.165, 0.002, { cast: false }));
    g.add(box(0.012, 1.55, 0.01, "plasticDark", 3.05, 1.55, s * 1.165, 0.002, { cast: false }));
    g.add(box(0.5, 0.06, 0.1, "steel", 2.55, 0.6, s * 1.2, 0.01));
    g.add(box(0.03, 0.03, 0.32, "plasticDark", 3.2, 2.15, s * 1.3, 0.01));
    g.add(box(0.06, 0.32, 0.16, "plasticDark", 3.2, 2.0, s * 1.47, 0.02));
    g.add(box(0.012, 0.06, 0.18, "steel", 2.7, 1.55, s * 1.168, 0.004, { cast: false }));
  }
  const ws = mesh(new THREE.PlaneGeometry(2.05, 0.92), mat("glass"), 3.35 + 0.98 * 0.1, 1.9 + 0.2 * 0.1, 0, { cast: false });
  ws.lookAt(ws.position.x + 0.98, ws.position.y + 0.2, 0);
  g.add(ws);
  // Caja de carga con perfiles de aluminio
  g.add(box(5.2, 2.6, 2.4, "white", -1.25, 1.95, 0, 0.05));
  for (const x of [-3.8, -2.5, -1.25, 0, 1.3]) g.add(box(0.05, 2.62, 2.42, "alu", x, 1.95, 0, 0.01));
  g.add(box(5.5, 0.22, 2.2, "steelDark", 0, 0.55, 0, 0.02));
  // Paneles de la caja con juntas y guardabarros/defensa lateral
  for (let k = 0; k < 9; k++) for (const s of [-1, 1]) g.add(box(0.012, 2.4, 0.01, "steelDark", -3.6 + k * 0.6, 1.95, s * 1.206, 0.003, { cast: false }));
  for (const s of [-1, 1]) g.add(box(3.2, 0.08, 0.05, "steel", -1.0, 0.72, s * 1.12, 0.01));
  // Puertas traseras con barras de cierre y bisagras
  g.add(box(0.012, 2.4, 0.01, "steelDark", -3.865, 1.95, 0, 0.002, { cast: false }));
  for (const z of [-0.6, -0.25, 0.25, 0.6]) g.add(cyl(0.015, 0.015, 2.3, "steel", -3.88, 1.95, z, 8));
  for (const y of [1.0, 1.95, 2.9]) for (const s of [-1, 1]) g.add(box(0.04, 0.08, 0.12, "steelDark", -3.88, y, s * 1.12, 0.01));
  // Placas naranjas de mercancías peligrosas delante y detrás, bien visibles
  const adr = canvasTexture(256, 192, (c, W, H) => {
    c.fillStyle = "#ff6a13";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = "#111";
    c.lineWidth = 10;
    c.strokeRect(5, 5, W - 10, H - 10);
    c.beginPath();
    c.moveTo(5, H / 2);
    c.lineTo(W - 5, H / 2);
    c.stroke();
  });
  const adrMat = new THREE.MeshStandardMaterial({ map: adr, roughness: 0.5 });
  const plate = (x, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), adrMat);
    m.position.set(x, 0.85, 0);
    m.rotation.y = ry;
    g.add(m);
  };
  plate(3.62, Math.PI / 2);
  plate(-3.9, -Math.PI / 2);
  const lbl = new THREE.MeshBasicMaterial({ map: class9Label(), transparent: true });
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), lbl);
    l.position.set(-1.25, 1.9, s * 1.215);
    if (s < 0) l.rotation.y = Math.PI;
    g.add(l);
    g.add(box(0.06, 0.12, 0.3, "ledWarm", 3.48, 0.95, s * 0.82, 0.02));
  }
  const wheels = [];
  for (const x of [-2.7, -1.75, 2.45]) for (const z of [-1.0, 1.0]) {
    const w = wheel(0.46, 0.3);
    w.userData.dynamic = true;
    w.position.set(x, 0.46, z);
    wheels.push(w);
    g.add(w);
  }
  g.position.set(17, 0, 5);
  return {
    group: g,
    place(u) {
      const x = 17 + u * u * 40;
      wheels.forEach((w) => (w.rotation.z -= (x - g.position.x) / 0.46));
      g.position.x = x;
    },
  };
}

// Arranque al final: los datos de arriba ya están definidos.
// La maquetación 3D (.has-3d) se fija ya, para que la página no salte; la escena
// pesada se construye cuando la sección se acerca y el navegador está libre.
const wrap = document.querySelector("[data-station]");
if (wrap && canRender()) {
  document.documentElement.classList.add("has-3d");
  // Si la escena falla al construirse, vuelve el plano 2D con la lista
  const go = () => init(wrap).catch(() => document.documentElement.classList.remove("has-3d"));
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      near.disconnect();
      if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1200 });
      else setTimeout(go, 200);
    },
    { rootMargin: "150% 0px" }
  );
  near.observe(wrap);
}
