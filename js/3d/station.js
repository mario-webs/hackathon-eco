// La estación en 3D, recorrida con el scroll.
// Cada paso (.pstep) se divide en tomas: una de transporte (la cámara sigue al
// carro con la batería por el pasillo y las puertas) y una por cada acción de
// la ficha, dentro del taller y a la altura de los ojos. La acción que se ve se
// resalta en la ficha. Todo depende solo de la posición de scroll: se puede ir
// hacia delante y hacia atrás y la escena siempre está en el mismo estado.
// Sin WebGL se queda el plano 2D y la lista.

import {
  THREE, canRender, LITE, createRenderer, createComposer, environment, mat, box, cyl, mesh, cable,
  floorLabel, screen, drawCycler, class9Label, hvWarning, canvasTexture, batteryPack, qrTexture,
  whenVisible, fontsReady, frameGovernor, mergeStatic, COLORS, FONT, MONO,
} from "./kit.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const WALL_H = 3.2;
const DOOR_H = 2.4;
const WALL_T = 0.2;
const STILL = new URLSearchParams(location.search).has("still");

// ---------- Trayectos del carro (metros; x al este, z al sur) ----------
// Todos pasan por el centro de las puertas.
const LEGS = {
  out: [[-9.5, 10.4], [-9.5, 9.3]],
  toDoor: [[-9.5, 9.3], [-9.5, 8.6]],
  rec: [[-9.5, 8.6], [-9.5, 7.2], [-9.5, 4.6]],
  insp: [[-9.5, 4.6], [-8.7, 3.7], [-7.8, 3.2]],
  quar: [[-7.8, 3.2], [-9.5, 2.3], [-9.5, 0], [-9.5, -1.8], [-9.5, -4.4]],
  lab: [[-9.5, -4.4], [-9.5, -1.6], [-9.5, 0], [-1.5, 0], [-1.5, -1.8], [-1.5, -4.4]],
  dec: [[-1.5, -4.4], [-1.5, 0], [1.5, 0]],
  ok: [[1.5, 0], [4, 0], [4, 2], [4, 4.2]],
  weak: [[4, 4.2], [4, 0], [7.5, 0], [7.5, -2], [7.5, -4.4]],
  bad: [[7.5, -4.4], [7.5, 0], [10, 0], [10, 2], [10, 4.2]],
};
// Dónde arranca la cámara que sigue al carro: un punto libre detrás de él
const FOLLOW_CAM0 = {
  rec: [-7.4, 8.95],
  insp: [-10.4, 5.3],
  quar: [-6.5, 4.4],
  lab: [-9.5, -5.9],
  dec: [-1.5, -5.6],
  ok: [-0.5, 0],
  weak: [4, 5.6],
  bad: [7.5, -5.6],
};

// ---------- Tomas ----------
// cam: [posición, objetivo] · follow: la cámara sigue al carro por ese trayecto ·
// leg: el carro se mueve con la cámara quieta · via: puntos de paso de la cámara
// (para no atravesar muros) · routes: rutas encendidas · live: hay animación continua
const SHOTS = [];
const shot = (step, name, o = {}) => SHOTS.push({ step, name, ...o });

shot(0, "ov", { cam: [[16, 21, 26], [0, 0, 1]] });
// 01 Llega la batería
shot(1, "arr.in", { cam: [[-2.5, 2.3, 17], [-11, 1.4, 11.2]] });
shot(1, "arr.a1", { cam: [[-5.9, 1.75, 12.9], [-9.6, 1.35, 10.2]] });
shot(1, "arr.a2", { cam: [[-6.7, 3.0, 8.6], [-9.5, 0.8, 9.6]], leg: "out" });
shot(1, "arr.a3", { cam: [[-6.2, 1.9, 9.0], [-9.5, 1.3, 8.0]], leg: "toDoor" });
// 02 Recepción
shot(2, "rec.in", { follow: "rec" });
shot(2, "rec.a1", { cam: [[-7.6, 1.8, 5.7], [-9.9, 1.1, 5.0]] });
shot(2, "rec.a2", { cam: [[-10.6, 1.7, 7.45], [-11.2, 1.5, 5.65]] });
shot(2, "rec.a3", { cam: [[-11.7, 1.65, 7.4], [-11.2, 1.5, 5.65]] });
shot(2, "rec.a4", { cam: [[-8.5, 1.95, 3.8], [-9.5, 0.95, 4.6]] });
shot(2, "rec.a5", { cam: [[-8.0, 1.7, 5.6], [-9.5, 1.0, 4.6]] });
// 03 Inspección de seguridad
shot(3, "ins.in", { follow: "insp" });
shot(3, "ins.a1", { cam: [[-6.3, 1.7, 4.7], [-7.8, 0.95, 3.2]] });
shot(3, "ins.a2", { cam: [[-6.1, 1.9, 2.0], [-7.8, 1.0, 3.2]] });
shot(3, "ins.a3", { cam: [[-6.9, 0.95, 4.5], [-7.8, 0.55, 3.2]] });
// 04 Cuarentena
shot(4, "qua.in", { follow: "quar" });
shot(4, "qua.a1", { cam: [[-10.9, 1.85, -2.3], [-9.5, 0.8, -6.0]] });
shot(4, "qua.a2", { cam: [[-11.0, 1.5, -2.6], [-12.6, 2.45, -1.4]], live: true });
shot(4, "qua.a3", { cam: [[-11.3, 1.45, -4.0], [-12.88, 1.15, -4.3]] });
shot(4, "qua.a4", { cam: [[-7.3, 2.1, -2.4], [-6.1, 1.6, -5.2]] });
shot(4, "qua.a5", { cam: [[-6.9, 3.4, -1.6], [-10.5, 0.6, -6.0]] });
// 05 Diagnóstico
shot(5, "lab.in", { follow: "lab" });
shot(5, "lab.a1", { cam: [[0.6, 1.8, -3.0], [-3.4, 1.4, -7.2]], live: true });
shot(5, "lab.a2", { cam: [[1.9, 2.6, -1.4], [-1.5, 1.15, -4.7]], live: true });
shot(5, "lab.a3", { cam: [[0.2, 1.55, -4.9], [-0.9, 1.05, -6.1]] });
shot(5, "lab.a4", { cam: [[-2.9, 1.7, -3.3], [-1.5, 1.15, -4.5]] });
shot(5, "lab.a5", { cam: [[-3.5, 1.55, -4.6], [-2.4, 1.0, -6.1]], live: true });
// 06 Decisión
shot(6, "dec.in", { follow: "dec" });
shot(6, "dec.a1", { cam: [[2.4, 12, 8.5], [3.5, 0, 0.8]], routes: ["ok"] });
shot(6, "dec.a2", { cam: [[2.4, 12, 8.5], [4.5, 0, 0.2]], routes: ["weak"] });
shot(6, "dec.a3", { cam: [[2.4, 12, 8.5], [5.5, 0, 0.8]], routes: ["bad"] });
// 07 Reutilizar
shot(7, "ok.in", { follow: "ok" });
shot(7, "ok.a1", { cam: [[5.5, 1.7, 3.0], [3.25, 1.2, 6.9]] });
shot(7, "ok.a2", { cam: [[3.9, 1.6, 5.3], [4.15, 1.5, 6.9]] });
shot(7, "ok.a3", { cam: [[2.6, 1.5, 5.4], [3.25, 1.0, 6.95]] });
shot(7, "ok.a4", { cam: [[2.8, 2.3, 4.4], [2.7, 2.3, 7.2]] });
shot(7, "ok.a5", { cam: [[6.3, 2.0, 2.0], [3.6, 1.2, 7.0]], live: true });
// 08 Reparar
shot(8, "rep.in", { follow: "weak" });
shot(8, "rep.a1", { cam: [[9.0, 1.8, -3.1], [7.5, 1.0, -4.6]] });
shot(8, "rep.a2", { cam: [[9.0, 1.6, -5.0], [7.9, 1.0, -6.3]] });
shot(8, "rep.a3", { cam: [[6.0, 1.8, -3.0], [7.5, 1.0, -4.6]], live: true });
// 09 Reciclar
shot(9, "rcy.in", { follow: "bad" });
shot(9, "rcy.a1", { cam: [[8.4, 1.7, 3.0], [10, 1.0, 4.2]] });
shot(9, "rcy.a2", { cam: [[8.2, 1.9, 4.2], [10, 0.9, 6.2]] });
shot(9, "rcy.a3", { cam: [[10.4, 1.25, 5.0], [10, 0.8, 6.05]] });
shot(9, "rcy.a4", { cam: [[8.0, 2.6, 1.8], [10.6, 0.8, 6.2]] });
// 10 Almacén de salida y transporte
shot(10, "out.in", { cam: [[8.6, 2.0, 2.2], [11, 0.8, 5.6]] });
shot(10, "out.a1", { cam: [[8.8, 2.1, 2.4], [10.6, 0.7, 6.2]] });
shot(10, "out.a2", { cam: [[10, 6.5, 1.4], [10, 0, 4.4]] });
shot(10, "out.a3", { cam: [[8.9, 2.5, 3.0], [13.2, 1.0, 5.2]] });
shot(10, "out.a4", { cam: [[25, 7.5, 16], [16.5, 1.2, 5]] });
// 11 Informe al cliente
shot(11, "inf.in", { cam: [[-10.6, 1.7, 7.45], [-11.2, 1.5, 5.65]], via: [[2, 16, 14], [-9, 8, 9.2]] });
shot(11, "inf.a1", { cam: [[-10.8, 1.65, 7.2], [-11.2, 1.5, 5.65]] });
shot(11, "inf.a2", { cam: [[-11.0, 1.62, 7.0], [-11.2, 1.5, 5.65]] });
shot(11, "inf.a3", { cam: [[-11.2, 1.6, 6.8], [-11.2, 1.5, 5.65]] });
// 12 Zona de demostración
shot(12, "dem.in", { cam: [[-0.6, 1.8, 1.7], [-4.6, 1.2, 7.0]], via: [[-7.5, 6.5, 4.5]] });
shot(12, "dem.a1", { cam: [[-1.0, 9.5, 13.0], [-5.5, 1.0, 7.2]], live: true });
shot(12, "dem.a2", { cam: [[-0.8, 1.7, 3.0], [-3.0, 1.2, 7.4]], live: true });

const IDX = Object.fromEntries(SHOTS.map((s, i) => [s.name, i]));

// Rutas pintadas en el suelo y pasos en los que se encienden
const ROUTES = [
  { id: "main", pts: [[-9.5, 9.3], [-9.5, 4.6], [-8.7, 3.7], [-7.8, 3.2], [-9.5, 2.3], [-9.5, 0], [-1.5, 0], [-1.5, -4.4]], style: "solid", color: COLORS.accent, steps: [1, 2, 3, 5] },
  { id: "quar", pts: [[-9.5, 0], [-9.5, -4.4]], style: "dash", color: COLORS.amber, steps: [4] },
  { id: "dec", pts: [[-1.5, 0], [1.5, 0]], style: "solid", color: COLORS.accent, steps: [5, 6] },
  { id: "ok", pts: [[1.5, 0.35], [4, 0.35], [4, 4.2]], style: "solid", color: COLORS.accent, steps: [7] },
  { id: "weak", pts: [[1.5, -0.35], [7.5, -0.35], [7.5, -4.4]], style: "dash", color: COLORS.amber, steps: [8] },
  { id: "bad", pts: [[1.5, 0], [10, 0], [10, 4.2], [12.9, 5]], style: "dot", color: COLORS.red, steps: [9, 10] },
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

// Puertas: centro, ancho y muro en el que están (x: muro que corre a lo largo de x)
const DOORS = [
  { x: -9.5, z: 8, w: 2, along: "x" },
  { x: -9.5, z: 1, w: 1.8, along: "x" },
  { x: -9.5, z: -1, w: 1.8, along: "x", fire: true },
  { x: -1.5, z: -1, w: 3, along: "x" },
  { x: 7.5, z: -1, w: 2, along: "x" },
  { x: 4, z: 1, w: 2, along: "x" },
  { x: 10, z: 1, w: 2, along: "x" },
  { x: 13, z: 5, w: 3, along: "z" },
];

// Objetos que las tomas animan; los rellenan los constructores
const R = {};

// ---------- Utilidades de trayectos ----------
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);
const bell = (u) => Math.sin(Math.PI * clamp01(u));

function poly(pts) {
  const v = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  const lens = [0];
  for (let k = 1; k < v.length; k++) lens.push(lens[k - 1] + v[k].distanceTo(v[k - 1]));
  return { v, lens, L: lens[lens.length - 1] };
}
function along(pl, d, out = new THREE.Vector2()) {
  if (pl.L <= 0) return out.copy(pl.v[pl.v.length - 1]);
  d = Math.min(pl.L, Math.max(0, d));
  let k = 1;
  while (k < pl.lens.length - 1 && pl.lens[k] < d) k++;
  const t = (d - pl.lens[k - 1]) / (pl.lens[k] - pl.lens[k - 1] || 1);
  return out.copy(pl.v[k - 1]).lerp(pl.v[k], t);
}

const LEG = Object.fromEntries(Object.entries(LEGS).map(([k, pts]) => [k, poly(pts)]));
const CAMLEG = Object.fromEntries(Object.entries(FOLLOW_CAM0).map(([k, c]) => [k, poly([c, ...LEGS[k]])]));

// Pose de la cámara que sigue al carro en el trayecto `leg`, avance s (0..1)
const _a = new THREE.Vector2();
const _b = new THREE.Vector2();
function followPose(leg, s, outP, outT) {
  const pl = LEG[leg];
  const d = s * pl.L;
  along(CAMLEG[leg], d, _a);
  along(pl, Math.min(pl.L, d + 2.6), _b);
  // Algo por encima y mirando por delante del carro: se ve hacia dónde va
  outP.set(_a.x, 2.15, _a.y);
  outT.set(_b.x, 0.85, _b.y);
}

// Pose fija o final de cada toma, y dónde queda el carro al acabarla
const END_P = [];
const END_T = [];
const CART_END = [];
{
  let cart = new THREE.Vector2(-9.5, 10.4);
  SHOTS.forEach((s, i) => {
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    if (s.follow) followPose(s.follow, 1, p, t);
    else {
      p.set(...s.cam[0]);
      t.set(...s.cam[1]);
    }
    END_P[i] = p;
    END_T[i] = t;
    const leg = s.follow || s.leg;
    if (leg) cart = LEG[leg].v[LEG[leg].v.length - 1].clone();
    CART_END[i] = cart.clone();
  });
}
// Curvas de cámara con puntos de paso (evitan atravesar muros)
const VIA = SHOTS.map((s, i) =>
  s.via && i > 0 ? new THREE.CatmullRomCurve3([END_P[i - 1].clone(), ...s.via.map((v) => new THREE.Vector3(...v)), END_P[i].clone()]) : null
);

async function init(wrap) {
  const stage = wrap.querySelector(".station__stage");
  const steps = [...wrap.querySelectorAll(".pstep")];
  if (!stage || steps.length !== 13) return;
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

  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 200);
  const post = createComposer(renderer, scene, camera, { bloom: 0.5 });
  const govern = frameGovernor(post);
  // Las sombras solo se recalculan cuando algo se mueve
  renderer.shadowMap.autoUpdate = false;

  // ---------- Luz ----------
  scene.add(new THREE.HemisphereLight(0xdfeee6, 0x0b0f0d, 0.38));
  const sun = new THREE.DirectionalLight(0xfff1de, 2.6);
  sun.position.set(-14, 26, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fd9bd, 0.45);
  fill.position.set(18, 10, -12);
  scene.add(fill);
  // Luz de cada sala, bajo sus luminarias (en equipos modestos, solo la ambiental)
  if (!LITE) {
    ZONES.forEach((z) => {
      const [x0, x1, z0, z1] = z.r;
      const l = new THREE.PointLight(0xfff4e4, 14, 10, 2);
      l.position.set((x0 + x1) / 2, 2.85, (z0 + z1) / 2);
      scene.add(l);
    });
  }

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
  buildInspection(add);
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

  // Piezas que se animan (no se funden)
  const dyn = new THREE.Group();
  scene.add(dyn);
  buildDynamic((...o) => dyn.add(...o));

  // Vehículos
  const van = buildVan();
  mergeStatic(van.group);
  dyn.add(van.group);
  const truck = buildTruck();
  mergeStatic(truck.group);
  dyn.add(truck.group);
  R.van = van;
  R.truck = truck;

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
  dyn.add(cart);

  const data = steps.map((el) => ({
    el,
    zone: el.dataset.zone || "",
    state: el.dataset.state || "",
    name: el.dataset.name || "",
    status: el.dataset.status || "",
    items: [...el.querySelectorAll(".pcard__actions > li, .pcard__dest > li")],
  }));
  const FIRST = steps.map((_, s) => SHOTS.findIndex((x) => x.step === s));

  // ---------- HUD y ficha que sigue a la batería ----------
  const hudN = wrap.querySelector("[data-hud-n]");
  const hudName = wrap.querySelector("[data-hud-name]");
  const hudBar = wrap.querySelector("[data-hud-bar]");
  // Subtítulo del escenario (móvil): paso y acción que se están viendo
  const capStep = wrap.querySelector("[data-caption-step]");
  const capText = wrap.querySelector("[data-caption-text]");
  const actionText = (li) => [...li.childNodes].filter((n) => !(n.classList && n.classList.contains("visually-hidden"))).map((n) => n.textContent).join("").replace(/\s+/g, " ").trim();
  const tag = wrap.querySelector("[data-bat-tag]");
  const tagText = tag?.querySelector("[data-bat-status]");
  const total = steps.length - 1;
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Scroll → posición en el recorrido ----------
  // Cada paso mide lo mismo por toma: la toma j de un paso con n tomas se centra
  // en (j + 0,5) / n de su altura.
  let anchors = [];
  let focusY = 0.5;
  let desktop = true;
  const measure = () => {
    desktop = window.innerWidth >= 1024;
    const sr = stage.getBoundingClientRect();
    focusY = desktop ? 0.5 : ((parseFloat(getComputedStyle(stage).top) || 0) + sr.height + 24) / window.innerHeight;
    anchors = [];
    steps.forEach((el, s) => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const n = SHOTS.filter((x) => x.step === s).length;
      for (let j = 0; j < n; j++) anchors.push(top + (r.height * (j + (desktop ? 0.5 : 0.15))) / n);
    });
  };
  const scrollTop = () => {
    const v = window.SV?.lenis?.animatedScroll;
    return Number.isFinite(v) ? v : window.scrollY;
  };
  const readG = () => {
    const y = scrollTop() + window.innerHeight * focusY;
    if (y <= anchors[0]) return 0;
    let i = 0;
    while (i < anchors.length - 1 && y > anchors[i + 1]) i++;
    if (i >= anchors.length - 1) return anchors.length - 1;
    return i + clamp01((y - anchors[i]) / Math.max(1e-3, anchors[i + 1] - anchors[i]));
  };

  // ---------- Estado activo (paso, acción, salas y rutas) ----------
  let activeShot = -1;
  let activeStep = -1;
  const setActive = (j) => {
    if (j === activeShot) return;
    activeShot = j;
    const sh = SHOTS[j];
    const local = j - FIRST[sh.step] - 1;
    if (sh.step !== activeStep) {
      activeStep = sh.step;
      const d = data[sh.step];
      steps.forEach((el, k) => el.classList.toggle("is-on", k === sh.step));
      zoneFx.forEach((z) => (z.target = z.id === d.zone ? 1 : 0));
      if (hudN) hudN.textContent = `${pad(sh.step)} / ${pad(total)}`;
      if (hudName) hudName.textContent = d.name;
      if (tagText) tagText.textContent = d.status;
      if (tag) tag.dataset.state = d.state;
    }
    data.forEach((d, k) => d.items.forEach((li, n) => li.classList.toggle("is-now", k === sh.step && n === local)));
    if (capStep) capStep.textContent = data[sh.step].el.querySelector("h3")?.textContent || "";
    if (capText) {
      const li = data[sh.step].items[local];
      capText.textContent = li ? actionText(li) : data[sh.step].el.querySelector(".pcard__lead")?.textContent || "";
    }
    routes.forEach((r) => (r.target = (sh.routes ? sh.routes.includes(r.id) : r.steps.includes(sh.step)) ? 1 : 0));
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
    const left = desktop && !STILL ? Math.min(W * 0.4, 560) : 0;
    if (left) camera.setViewOffset(W, H, -left / 2, 0, W, H);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  // ---------- Pose de cámara y carro para una posición g ----------
  const camP = new THREE.Vector3();
  const camT = new THREE.Vector3();
  const fP = new THREE.Vector3();
  const fT = new THREE.Vector3();
  const cartXY = new THREE.Vector2();
  const ahead = new THREE.Vector2();
  let cartHeading = Math.PI / 2;

  const pose = (g) => {
    const N = SHOTS.length - 1;
    const k = Math.min(Math.floor(g), N);
    const t = g - k;
    const j = Math.min(k + 1, N);
    const next = SHOTS[j];
    // Carro
    cartXY.copy(CART_END[k]);
    const leg = j > k ? next.follow || next.leg : null;
    let s = 0;
    if (leg) {
      s = smooth(clamp01((t - 0.15) / 0.75));
      along(LEG[leg], s * LEG[leg].L, cartXY);
      along(LEG[leg], Math.min(LEG[leg].L, s * LEG[leg].L + 0.3), ahead);
      if (ahead.distanceToSquared(cartXY) > 1e-6) cartHeading = Math.atan2(-(ahead.y - cartXY.y), ahead.x - cartXY.x);
    }
    // Cámara
    if (j === k) {
      camP.copy(END_P[k]);
      camT.copy(END_T[k]);
    } else if (next.follow) {
      followPose(next.follow, s, fP, fT);
      const w = smooth(clamp01(t / 0.3));
      camP.copy(END_P[k]).lerp(fP, w);
      camT.copy(END_T[k]).lerp(fT, w);
    } else {
      const w = smooth(clamp01((t - 0.1) / 0.75));
      if (VIA[j]) VIA[j].getPoint(w, camP);
      else {
        camP.copy(END_P[k]).lerp(END_P[j], w);
        // Desplazamientos largos: un ligero arco para leer el cambio de sitio
        camP.y += Math.sin(Math.PI * w) * Math.min(2, END_P[k].distanceTo(END_P[j]) * 0.12);
      }
      camT.copy(END_T[k]).lerp(END_T[j], w);
    }
  };

  // ---------- Fotograma ----------
  const cur = { g: 0 };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const proj = new THREE.Vector3();
  let first = true;
  let time = 0;

  const update = (dt) => {
    time += dt;
    const raw = readG();
    // Un valor no válido (medidas a mitad de un cambio de tamaño) no debe atascar la escena
    const target = Number.isFinite(raw) ? Math.min(SHOTS.length - 1, Math.max(0, raw)) : cur.g;
    // Con scroll suave (Lenis) basta un suavizado ligero; sin él, algo más
    const k = first ? 1 : 1 - Math.exp(-dt * (window.SV?.lenis ? 14 : 7));
    first = false;
    const prevG = cur.g;
    const prevPtr = ptr.x + ptr.y;
    cur.g += (target - cur.g) * k;
    if (Math.abs(target - cur.g) < 1e-4) cur.g = target;
    const g = cur.g;
    const near = Math.min(SHOTS.length - 1, Math.round(g));
    setActive(near);

    pose(g);
    ptr.x += (ptr.tx - ptr.x) * (1 - Math.exp(-dt * 3));
    ptr.y += (ptr.ty - ptr.y) * (1 - Math.exp(-dt * 3));
    camera.position.copy(camP);
    camera.position.x += ptr.x * 0.25;
    camera.position.y += ptr.y * 0.15;
    camera.lookAt(camT);

    cart.position.set(cartXY.x, 0, cartXY.y);
    cart.rotation.y = cartHeading;

    const live = applyFx(g, time, { pack, cart, data, near });

    // Salas y rutas encendidas
    zoneFx.forEach((z) => {
      z.v += (z.target - z.v) * (1 - Math.exp(-dt * 5));
      z.mat.opacity = z.v * 0.07;
      z.edge.opacity = 0.18 + z.v * 0.7;
    });
    routes.forEach((r) => {
      r.v += (r.target - r.v) * (1 - Math.exp(-dt * 5));
      r.mat.opacity = 0.28 + r.v * 0.72;
      r.mat.color.copy(r.base).multiplyScalar(1 + r.v * 2.8);
    });
    const fading = zoneFx.some((z) => Math.abs(z.target - z.v) > 1e-3) || routes.some((r) => Math.abs(r.target - r.v) > 1e-3);
    const moved = Math.abs(cur.g - prevG) > 1e-5 || Math.abs(ptr.x + ptr.y - prevPtr) > 1e-4;

    // HUD
    if (hudBar) hudBar.style.transform = `scaleX(${(g / (SHOTS.length - 1)).toFixed(4)})`;

    // Ficha sobre la batería
    if (tag) {
      proj.set(cart.position.x, 1.35, cart.position.z).project(camera);
      const show = cart.visible && pack.group.visible && proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      tag.style.opacity = show ? "1" : "0";
      tag.style.transform = `translate(${((proj.x + 1) / 2) * W}px, ${((1 - proj.y) / 2) * H}px)`;
    }
    if (moved) renderer.shadowMap.needsUpdate = true;
    return moved || fading || live;
  };

  // ---------- Bucle ----------
  let raf = 0;
  let last = performance.now();
  let lastDraw = 0;
  let running = false;
  let force = true;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    // El sello de requestAnimationFrame puede ser anterior a la última medida: nunca negativo
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
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
  await post.compile(scene, camera);
  post.render();
  wrap.classList.add("is-ready");

  new ResizeObserver(() => {
    measure();
    resize();
    force = true;
  }).observe(stage);
  // Si cambia la altura de lo que hay por encima (fuentes, imágenes), las tomas se vuelven a medir
  new ResizeObserver(measure).observe(document.body);
  window.addEventListener("load", measure, { once: true });
  whenVisible(wrap, (on) => (on ? start() : stop()), "200px");
}

// =====================================================================
// Animaciones de cada toma. Dependen solo de g (posición en el recorrido):
// P(nombre) va de 0 a 1 mientras se llega a esa toma y vale 1 al estar en ella.
// =====================================================================
function applyFx(g, time, { pack, cart, data, near }) {
  const P = (name) => clamp01(g - IDX[name] + 1);
  const after = (name) => g >= IDX[name] - 0.5;
  const inRange = (a, b) => g >= IDX[a] - 0.5 && g < IDX[b] + 0.5;
  const shotNow = SHOTS[near];
  let live = !!shotNow.live;

  // Furgoneta: llega por la calle y abre la puerta lateral
  R.van.place(smooth(P("arr.in")));
  R.van.setDoor(smooth(P("arr.a1")));

  // Carro: aparece al abrirse la furgoneta
  cart.visible = g > IDX["arr.a2"] - 0.85;

  // Estado de la batería (color de la tira) según el paso, con la reparación terminada en verde
  let state = data[shotNow.step].state;
  if (inRange("rep.a3", "rep.a3") && P("rep.a3") > 0.6) state = "ok";
  pack.setState(state);

  // Recepción: lector de QR, pantalla, etiqueta y foto
  R.beam.visible = inRange("rec.a1", "rec.a1");
  R.beam.material.opacity = 0.35 + 0.5 * bell(P("rec.a1"));
  let screenState = "idle";
  if (g >= IDX["rec.a1"] - 0.5) screenState = "pasaporte";
  if (inRange("rec.a2", "rec.a2")) screenState = "registro";
  if (inRange("rec.a3", "rec.a3")) screenState = "manual";
  if (g >= IDX["inf.in"] - 0.5) screenState = "informe";
  if (inRange("inf.a2", "inf.a2")) screenState = "web";
  if (inRange("inf.a3", "inf.a3")) screenState = "plazo";
  R.monitor(screenState);
  pack.setLabel(smooth(clamp01((g - IDX["rec.a4"] + 0.6) / 0.5)));
  const flash = inRange("rec.a5", "rec.a5") ? Math.max(0, 1 - Math.abs(P("rec.a5") - 0.85) * 8) : 0;
  R.flash.intensity = flash * 40;
  R.flashBulb.visible = flash > 0.05;

  // Inspección: medida con polímetro, cámara térmica y linterna
  R.probes.visible = inRange("ins.a2", "ins.a2");
  R.thermal.material.color.setScalar(inRange("ins.a2", "ins.a2") ? 1.6 : 0.85);
  R.lamp.visible = inRange("ins.a3", "ins.a3");

  // Cuarentena: la batería entra en el contenedor ignífugo y se cierra la tapa;
  // vuelve al carro al salir hacia el laboratorio
  const inQ = smooth(P("qua.a1")) * (1 - smooth(clamp01(P("lab.in") * 2.5)));
  const lidQ = smooth(clamp01((P("qua.a1") - 0.65) / 0.35)) * (1 - smooth(clamp01(P("lab.in") * 4)));
  // Reciclaje: la batería entra en el contenedor homologado y ya no vuelve
  const inB = smooth(P("rcy.a2"));
  const lidB = smooth(clamp01((P("rcy.a2") - 0.65) / 0.35));
  const into = Math.max(inQ, inB);
  pack.group.position.set(into * 2.05, 0.805 + Math.sin(Math.PI * into) * 0.75 - into * 0.45, 0);
  pack.group.visible = into < 0.98;
  // Tapas con bisagra en el borde trasero: abiertas hasta que la batería está dentro
  R.lidQ.rotation.x = -1.9 * (1 - lidQ);
  R.lidB.rotation.x = 1.9 * (1 - lidB);
  R.detector.emissiveIntensity = inRange("qua.a2", "qua.a2") ? (Math.sin(time * 7) > 0 ? 6 : 0.3) : 1.5;
  R.fireBand.emissiveIntensity = 0.4 + 2.2 * bell(P("qua.a4")) * (inRange("qua.a4", "qua.a4") ? 1 : 0);

  // Laboratorio: cables conectados, curvas que avanzan, despiece, BMS, sondas y aislamiento
  const inLab = data[shotNow.step].zone === "laboratorio";
  R.labCables.visible = g >= IDX["lab.a1"] - 0.6 && g < IDX["dec.in"] - 0.3;
  if (inLab) R.cyclerTex.forEach((t, i) => (t.offset.x = (time * (0.04 + i * 0.01)) % 1));
  const explodeLab = smooth(P("lab.a2")) * (1 - smooth(P("lab.a5")));
  const explodeRep = smooth(P("rep.a1")) * (1 - smooth(clamp01((P("rep.a3") - 0.2) / 0.6))) * 0.35;
  pack.setExplode(Math.max(explodeLab, explodeRep));
  R.labProbes.visible = inRange("lab.a4", "lab.a4");
  R.tester.emissiveIntensity = inRange("lab.a5", "lab.a5") ? (Math.sin(time * 5) > 0 ? 5 : 0.4) : 0.4;

  // Reparación: el módulo con la celda que falla sale y entra el nuevo
  const rep = P("rep.a1");
  pack.setLift(inRange("rep.a1", "rep.a1") ? bell(rep) : 0);
  pack.setFixed(shotNow.step === 8 && (g > IDX["rep.a1"] || rep > 0.5));

  // Segunda vida: armario abierto, módulos que entran, cableado y ensayo
  R.cabDoor.rotation.y = 1.6 * smooth(clamp01(P("ok.a1") * 1.5)) * (1 - smooth(P("rep.in")));
  const filled = Math.round(smooth(P("ok.a1")) * R.rackMods.length);
  R.rackMods.forEach((m, i) => (m.visible = i < filled));
  R.qrPlate.material.color.setScalar(inRange("ok.a2", "ok.a2") ? 1.8 : 0.9);
  R.cabCables.visible = g >= IDX["ok.a4"] - 0.5;
  R.cabLed.emissiveIntensity = inRange("ok.a5", "ok.a5") ? 2 + 5 * (0.5 + 0.5 * Math.sin(time * 4)) : 4;

  // Reciclaje: descarga controlada, embalaje y etiqueta de clase 9
  R.discharge.visible = g >= IDX["rcy.in"] - 0.2;
  R.dischargeBar.scale.x = Math.max(0.04, 1 - smooth(P("rcy.a1")) * 0.9);
  R.c9.scale.setScalar(Math.max(1e-3, smooth(clamp01((g - IDX["rcy.a3"] + 0.6) / 0.5))));

  // Almacén y transporte: el contenedor va al camión y el camión sale
  const lift = smooth(P("out.a1"));
  const load = smooth(P("out.a3"));
  const leave = smooth(P("out.a4"));
  along(R.crateLeg, load * R.crateLeg.L, _a);
  R.crate.position.set(_a.x, 0.05 * lift, _a.y);
  // Dentro del camión ya no se ve
  R.crate.visible = load < 0.97;
  R.spots.color.setScalar(inRange("out.a2", "out.a2") ? 2.2 : 1);
  R.truck.place(leave);
  R.truck.setDoors(bell(clamp01(P("out.a3") * 1.15)));

  // Demostración: energía de las placas al armario
  R.flow.visible = g >= IDX["dem.in"] - 0.5;
  if (R.flow.visible) {
    R.flowTex.offset.x = -(time * 0.6) % 1;
    live = true;
  }
  return live;
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





function buildBuilding(add) {
  // Solera de hormigón
  add(box(26.4, 0.16, 16.4, "concrete", 0, 0.0, 0, 0.04, { cast: false }));
  // Suelo epoxi con juntas: satinado, recoge reflejos de las luminarias
  const jt = canvasTexture(512, 512, (g, W) => {
    g.fillStyle = "#59625c";
    g.fillRect(0, 0, W, W);
    g.strokeStyle = "rgba(0,0,0,.25)";
    g.lineWidth = 3;
    for (let k = 0; k <= W; k += W / 4) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k, W);
      g.moveTo(0, k);
      g.lineTo(W, k);
      g.stroke();
    }
    for (let n = 0; n < 2400; n++) {
      g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.04})`;
      g.fillRect(Math.random() * W, Math.random() * W, 2, 2);
    }
  });
  jt.wrapS = jt.wrapT = THREE.RepeatWrapping;
  jt.repeat.set(26 / 6, 16 / 6);
  const floorMat = new THREE.MeshPhysicalMaterial({ map: jt, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, envMapIntensity: 0.6 });
  add(plane(26, 16, floorMat, 0, 0.082, 0));

  // Muros a altura real: [x1, z1, x2, z2] con los huecos de las puertas ya resueltos
  const W = [
    [-13, -8, 13, -8],
    [-13, -8, -13, 8],
    [-13, 8, -10.5, 8],
    [-8.5, 8, 13, 8],
    [13, -8, 13, 3.5],
    [13, 6.5, 13, 8],
    [-13, -1, -10.4, -1],
    [-8.6, -1, -3, -1],
    [0, -1, 6.5, -1],
    [8.5, -1, 13, -1],
    [-6, -8, -6, -1],
    [3, -8, 3, -1],
    [-13, 1, -10.4, 1],
    [-8.6, 1, -6, 1],
    [1, 1, 3, 1],
    [5, 1, 9, 1],
    [11, 1, 13, 1],
    [-6, 1, -6, 8],
    [1, 1, 1, 8],
    [7, 1, 7, 8],
  ];
  const wallBox = (x1, z1, x2, z2, h, y0, material = "wall") => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const alongX = z1 === z2;
    add(mesh(new THREE.BoxGeometry(alongX ? len + WALL_T : WALL_T, h, alongX ? WALL_T : len + WALL_T), material, (x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2));
  };
  W.forEach(([x1, z1, x2, z2]) => {
    wallBox(x1, z1, x2, z2, WALL_H, 0.08);
    // Zócalo oscuro y remate superior
    const len = Math.hypot(x2 - x1, z2 - z1);
    const alongX = z1 === z2;
    add(mesh(new THREE.BoxGeometry(alongX ? len + WALL_T + 0.02 : WALL_T + 0.02, 0.12, alongX ? WALL_T + 0.02 : len + WALL_T + 0.02), "plasticGrey", (x1 + x2) / 2, 0.14, (z1 + z2) / 2, { cast: false }));
    add(mesh(new THREE.BoxGeometry(alongX ? len + WALL_T + 0.02 : WALL_T + 0.02, 0.04, alongX ? WALL_T + 0.02 : len + WALL_T + 0.02), "wallTop", (x1 + x2) / 2, WALL_H + 0.1, (z1 + z2) / 2, { cast: false }));
  });

  // Puertas: dintel sobre el hueco y marco de acero
  DOORS.forEach((d) => {
    const top = d.z === 5 ? 3.0 : DOOR_H;
    const half = d.w / 2;
    if (d.along === "x") {
      wallBox(d.x - half, d.z, d.x + half, d.z, WALL_H - top, top + 0.08);
      add(box(d.w + 0.16, 0.08, 0.28, "steelDark", d.x, top + 0.08, d.z, 0.01));
      for (const s of [-1, 1]) add(box(0.08, top, 0.28, "steelDark", d.x + s * (half + 0.04), top / 2 + 0.08, d.z, 0.01));
    } else {
      wallBox(d.x, d.z - half, d.x, d.z + half, WALL_H - top, top + 0.08);
      add(box(0.28, 0.08, d.w + 0.16, "steelDark", d.x, top + 0.08, d.z, 0.01));
      for (const s of [-1, 1]) add(box(0.28, top, 0.08, "steelDark", d.x, top / 2 + 0.08, d.z + s * (half + 0.04), 0.01));
    }
  });

  // Muros cortafuegos de la cuarentena: franja ámbar a media altura
  const fire = new THREE.MeshStandardMaterial({ color: COLORS.amber, roughness: 0.5, emissive: 0x3a2400, emissiveIntensity: 0.4 });
  R.fireBand = fire;
  [[-13, -1, -10.4, -1], [-8.6, -1, -6, -1], [-6, -8, -6, -1]].forEach(([x1, z1, x2, z2]) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const alongX = z1 === z2;
    for (const off of [-1, 1]) {
      add(mesh(new THREE.BoxGeometry(alongX ? len : 0.02, 0.2, alongX ? 0.02 : len), fire, (x1 + x2) / 2 + (alongX ? 0 : off * (WALL_T / 2 + 0.01)), 1.35, (z1 + z2) / 2 + (alongX ? off * (WALL_T / 2 + 0.01) : 0), { cast: false }));
    }
  });

  // Luminarias colgadas: dos por sala y una fila en el pasillo
  const fixture = (x, z, len = 2.2) => {
    add(box(len, 0.07, 0.22, "steelDark", x, 2.96, z, 0.02, { cast: false }));
    add(box(len - 0.1, 0.012, 0.17, "ledWarm", x, 2.92, z, 0.004, { cast: false }));
    for (const s of [-1, 1]) add(cyl(0.006, 0.006, 0.26, "steelDark", x + s * (len / 2 - 0.2), 3.12, z, 4, { cast: false }));
  };
  ZONES.forEach((zn) => {
    const [x0, x1, z0, z1] = zn.r;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    for (const s of [-1, 1]) fixture(cx, cz + s * 1.6, Math.min(2.4, x1 - x0 - 1.6));
  });
  for (let x = -11; x <= 11; x += 4.4) fixture(x, 0, 2.2);
  // Bandeja de cables a lo largo del pasillo
  add(box(26, 0.06, 0.3, "steel", 0, 3.02, -0.6, 0.005, { cast: false }));
  for (let x = -12; x <= 12; x += 3) add(cyl(0.008, 0.008, 0.2, "steel", x, 3.12, -0.6, 4, { cast: false }));
  // Líneas amarillas de paso peatonal en el pasillo
  const walk = new THREE.MeshStandardMaterial({ color: 0xd8b13a, roughness: 0.6 });
  for (const z of [-0.85, 0.85]) add(plane(25.6, 0.08, walk, 0, 0.087, z));

  // Rótulos de sala sobre cada puerta, del lado del pasillo
  const plate = (text, code, x, y, z, ry, tint = "#3ddc84") => {
    const s = screen(1.4, 0.32, (g, w, h) => {
      g.fillStyle = "#0e1311";
      g.fillRect(0, 0, w, h);
      g.fillStyle = tint;
      g.font = `500 ${h * 0.42}px ${MONO}`;
      g.textBaseline = "middle";
      g.fillText(code, h * 0.3, h * 0.54);
      g.fillStyle = "#eef2ee";
      g.font = `400 ${h * 0.5}px ${FONT}`;
      g.fillText(text, h * 1.3, h * 0.56);
    }, 512);
    s.position.set(x, y, z);
    s.rotation.y = ry;
    add(s);
  };
  plate("Recepción", "Z1", -9.5, 2.75, 0.89, Math.PI);
  plate("Cuarentena", "Z2", -9.5, 2.75, -0.89, 0, "#f2a93b");
  plate("Laboratorio", "Z3", -1.5, 2.75, -0.89, 0);
  plate("Reparación", "Z4", 7.5, 2.75, -0.89, 0);
  plate("Segunda vida", "Z5", 4, 2.75, 0.89, Math.PI);
  plate("Almacén", "Z6", 10, 2.75, 0.89, Math.PI);
  // Señales de alta tensión junto al laboratorio y al taller
  const warnMat = new THREE.MeshStandardMaterial({ map: hvWarning(), transparent: true, roughness: 0.5 });
  [[-3.6, -0.89], [5.9, -0.89]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), warnMat);
    w.position.set(x, 1.65, z);
    add(w);
  });
  // Extintores junto a cada puerta, por dentro de la sala
  [[-8.3, 1.4], [-8.3, -1.4], [0.4, -1.4], [8.9, -1.4], [5.4, 1.4], [11.4, 1.4]].forEach(([x, z]) => {
    add(cyl(0.09, 0.09, 0.5, "redPaint", x, 0.35, z, 14));
    add(cyl(0.035, 0.035, 0.06, "steelDark", x, 0.63, z, 8));
  });

  // Puerta enrollable abierta del muelle y rótulo de la estación sobre la entrada
  add(box(0.32, 0.32, 3.2, "steelDark", 13.1, 3.0, 5, 0.03));
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
  sign.position.set(-9.5, 2.85, 8.13);
  add(sign);
}

function buildReception(add) {
  // Mostrador (deja libre el paso de la puerta al pasillo)
  add(box(2.4, 1.05, 0.7, "white", -11.2, 0.6, 5.9, 0.03));
  add(box(2.5, 0.05, 0.8, "steelDark", -11.2, 1.15, 5.9, 0.01));
  add(box(0.7, 1.05, 1.4, "white", -12.35, 0.6, 6.8, 0.03));
  // Pantalla: su contenido cambia con cada acción (pasaporte, registro, informe…)
  const mon = new THREE.Group();
  mon.add(box(0.62, 0.4, 0.03, "plasticDark", 0, 0, 0, 0.01));
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 318;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.36), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  sc.material.color.setScalar(0.9);
  sc.position.z = 0.017;
  mon.add(sc);
  mon.add(cyl(0.02, 0.02, 0.22, "steelDark", 0, -0.3, -0.03, 8));
  mon.position.set(-11.2, 1.55, 5.65);
  add(mon);
  let shown = "";
  R.monitor = (state) => {
    if (state === shown) return;
    shown = state;
    drawMonitor(c.getContext("2d"), c.width, c.height, state);
    tex.needsUpdate = true;
  };
  R.monitor("idle");
  // Lector de QR, impresora de etiquetas y teclado
  add(box(0.08, 0.16, 0.12, "plasticDark", -10.3, 1.24, 5.75, 0.02));
  add(box(0.05, 0.02, 0.08, mat("led"), -10.3, 1.33, 5.72, 0.005));
  add(box(0.22, 0.14, 0.26, "white", -10.75, 1.25, 6.0, 0.02));
  add(box(0.42, 0.02, 0.14, "plasticDark", -11.25, 1.185, 6.05, 0.005));
  // Banco de espera y estantería de embalajes
  add(box(1.8, 0.45, 0.45, "bench", -12.1, 0.3, 2.2, 0.03));
  for (let k = 0; k < 4; k++) add(box(0.5, 0.03, 2.2, "steel", -12.6, 0.3 + k * 0.42, 4.0, 0.005));
  for (const z of [2.95, 5.05]) add(box(0.5, 1.5, 0.04, "steel", -12.6, 0.83, z, 0.005));
  for (let k = 0; k < 3; k++) add(box(0.4, 0.28, 0.5, "wood", -12.6, 0.47 + k * 0.42, 3.3 + (k % 2) * 0.9, 0.02));
  addPerson(add, -11.9, 6.7, Math.PI, "overall");
}

// Pantalla de recepción: un estado por acción (datos de demostración)
function drawMonitor(g, W, H, state) {
  g.fillStyle = "#0b1210";
  g.fillRect(0, 0, W, H);
  const head = {
    idle: "RECEPCIÓN · EN ESPERA",
    pasaporte: "PASAPORTE · LEÍDO",
    registro: "REGISTRO DEL CLIENTE",
    manual: "SIN PASAPORTE · REGISTRO MANUAL",
    informe: "INFORME AL CLIENTE",
    web: "CONSULTA DESDE LA WEB",
    plazo: "PLAZO DEL PROCESO",
  }[state];
  g.fillStyle = state === "manual" ? "#f2a93b" : "#3ddc84";
  g.fillRect(0, 0, W, H * 0.14);
  g.fillStyle = "#03140a";
  g.font = `500 ${H * 0.075}px ${MONO}`;
  g.fillText(head, W * 0.04, H * 0.095);
  g.font = `400 ${H * 0.065}px ${FONT}`;
  const rows = (labels, x = W * 0.06) =>
    labels.forEach((t, i) => {
      g.fillStyle = "#b3bdb7";
      g.fillText(t, x, H * (0.3 + i * 0.13));
      g.fillStyle = "#25302b";
      g.fillRect(W * 0.52, H * (0.25 + i * 0.13), W * 0.4, H * 0.06);
    });
  if (state === "idle") {
    g.fillStyle = "#8b968f";
    g.fillText("Escanee el QR del pasaporte", W * 0.06, H * 0.5);
  } else if (state === "pasaporte") {
    const s = H * 0.42;
    g.fillStyle = "#eef2ee";
    g.fillRect(W * 0.05, H * 0.22, s, s);
    g.fillStyle = "#0b1210";
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i * 7 + j * 3) % 5 < 2) g.fillRect(W * 0.05 + (i * s) / 9, H * 0.22 + (j * s) / 9, s / 9, s / 9);
    g.fillStyle = "#b3bdb7";
    ["Química", "Capacidad", "Historial", "Desmontaje"].forEach((t, i) => g.fillText(t, W * 0.5, H * (0.3 + i * 0.13)));
    g.fillStyle = "#3ddc84";
    for (let i = 0; i < 4; i++) g.fillRect(W * 0.82, H * (0.26 + i * 0.13), W * 0.12, H * 0.05);
  } else if (state === "registro") rows(["Nombre", "Contacto", "Vehículo", "Estado al llegar"]);
  else if (state === "manual") rows(["Marca y modelo", "Tipo de batería", "Año", "Observaciones"]);
  else if (state === "informe") rows(["Diagnóstico", "Estado de salud", "Destino", "Pasaporte"]);
  else if (state === "web") {
    g.fillStyle = "#18211d";
    g.fillRect(W * 0.06, H * 0.24, W * 0.88, H * 0.5);
    g.fillStyle = "#eef2ee";
    g.fillText("segundavida / mi-bateria", W * 0.1, H * 0.36);
    g.fillStyle = "#3ddc84";
    g.fillRect(W * 0.1, H * 0.48, W * 0.5, H * 0.07);
  } else if (state === "plazo") {
    g.fillStyle = "#25302b";
    g.fillRect(W * 0.08, H * 0.5, W * 0.84, H * 0.03);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i < 6 ? "#3ddc84" : "#25302b";
      g.beginPath();
      g.arc(W * (0.08 + i * 0.14), H * 0.515, H * 0.03, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#b3bdb7";
    g.fillText("Menos de una semana", W * 0.08, H * 0.36);
  }
  g.fillStyle = "#8b968f";
  g.font = `400 ${H * 0.055}px ${FONT}`;
  g.fillText("Datos de demostración", W * 0.05, H * 0.93);
}

function buildInspection(add) {
  // Mesa de inspección, cámara térmica en trípode con su pantalla, polímetro
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
  tri.add(cyl(0.04, 0.04, 0.05, "glass", 0, 1.48, -0.13, 16).rotateX(Math.PI / 2));
  tri.position.set(-6.7, 0.08, 3.9);
  tri.rotation.y = 0.6;
  add(tri);
  // Pantalla de la cámara térmica: la batería en falso color
  const th = screen(0.5, 0.32, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, "#1a0b3a");
    gr.addColorStop(0.35, "#6a1b8a");
    gr.addColorStop(0.6, "#e0601a");
    gr.addColorStop(0.8, "#f6d04a");
    gr.addColorStop(1, "#6a1b8a");
    g.fillStyle = "#0a0614";
    g.fillRect(0, 0, W, H);
    g.fillStyle = gr;
    g.fillRect(W * 0.12, H * 0.25, W * 0.76, H * 0.5);
    g.fillStyle = "#eef2ee";
    g.font = `500 ${H * 0.1}px ${MONO}`;
    g.fillText("TÉRMICA", W * 0.05, H * 0.15);
  }, 256);
  th.position.set(-8.25, 1.12, 1.6);
  th.rotation.x = -0.35;
  add(th);
  add(box(0.54, 0.36, 0.03, "plasticDark", -8.25, 1.12, 1.585, 0.01).rotateX(-0.35));
  R.thermal = th;
  // Polímetro sobre la mesa
  add(box(0.12, 0.05, 0.2, "amberPaint", -7.2, 0.94, 2.05, 0.01));
  add(box(0.08, 0.004, 0.06, "glass", -7.2, 0.966, 2.0, 0.002));
}

function buildQuarantine(add) {
  // Contenedores ignífugos (el del centro tiene la tapa animada aparte)
  [-11.6, -9.5, -7.4].forEach((x, i) => {
    add(box(1.6, 1.0, 1.1, "amberPaint", x, 0.58, -6.7, 0.04));
    if (i !== 1) add(box(1.64, 0.08, 1.14, "steelDark", x, 1.12, -6.7, 0.02));
    add(box(0.5, 0.18, 0.02, "white", x, 0.8, -6.14, 0.005));
  });
  // Extintor para litio, rociador y detector de temperatura y humo
  add(cyl(0.11, 0.11, 0.6, "redPaint", -6.55, 0.4, -1.55, 16));
  add(cyl(0.05, 0.05, 0.08, "steelDark", -6.55, 0.74, -1.55, 10));
  add(box(5.6, 0.05, 0.05, "redPaint", -9.5, 3.0, -4.5, 0.01, { cast: false }));
  for (const x of [-11.5, -9.5, -7.5]) add(cyl(0.04, 0.025, 0.12, "steel", x, 2.92, -4.5, 8, { cast: false }));
  add(cyl(0.025, 0.025, 2.2, "steelDark", -12.7, 1.18, -1.4, 8));
  add(cyl(0.14, 0.14, 0.06, "white", -12.7, 2.3, -1.4, 18));
  const detMat = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 1.5, roughness: 0.4 });
  R.detector = detMat;
  add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), detMat, -12.7, 2.265, -1.4, { cast: false }));
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
  // Cartel de zona restringida en la puerta
  const sign = screen(0.6, 0.3, (g, W, H) => {
    g.fillStyle = "#f2a93b";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#1a1408";
    g.font = `600 ${H * 0.3}px ${FONT}`;
    g.fillText("CUARENTENA", W * 0.07, H * 0.6);
  }, 256);
  sign.position.set(-10.9, 1.7, -0.89);
  add(sign);
}

function buildLab(add) {
  // Equipos de carga y descarga contra el muro norte; las curvas avanzan
  R.cyclerTex = [];
  [-5.1, -4.0, -2.9, -1.8].forEach((x, i) => {
    add(box(0.95, 2.0, 0.75, "steelDark", x, 1.08, -7.4, 0.03));
    const s = screen(0.6, 0.38, drawCycler(i));
    s.material.map.wrapS = THREE.RepeatWrapping;
    R.cyclerTex.push(s.material.map);
    s.position.set(x, 1.62, -7.02);
    add(s);
    for (let r = 0; r < 4; r++) add(box(0.7, 0.05, 0.02, "plasticDark", x, 0.45 + r * 0.18, -7.02, 0.005));
    add(box(0.06, 0.06, 0.02, mat("led"), x + 0.36, 1.98, -7.02, 0.01));
  });
  // Banco de pruebas, cuadro eléctrico y comprobador de aislamiento con su piloto
  add(box(2.4, 0.06, 0.9, "steel", -1.6, 0.9, -6.1, 0.01));
  for (const sx of [-1.12, 1.12]) for (const sz of [-0.38, 0.38]) add(cyl(0.025, 0.025, 0.82, "steel", -1.6 + sx, 0.49, -6.1 + sz, 8));
  add(box(0.8, 1.0, 0.25, "plasticGrey", 1.9, 1.6, -7.8, 0.02));
  add(box(0.36, 0.16, 0.26, "amberPaint", -2.4, 1.01, -6.1, 0.02));
  const tester = new THREE.MeshStandardMaterial({ color: COLORS.amber, emissive: COLORS.amber, emissiveIntensity: 0.4, roughness: 0.4 });
  R.tester = tester;
  add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.05), tester, -2.3, 1.1, -6.0, { cast: false }));
  // Portátil con el registro del BMS
  const lap = new THREE.Group();
  lap.add(box(0.42, 0.02, 0.3, "plasticDark", 0, 0, 0, 0.005));
  const ls = screen(0.4, 0.26, (g, W, H) => {
    g.fillStyle = "#06100b";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#3ddc84";
    g.font = `500 ${H * 0.1}px ${MONO}`;
    g.fillText("BMS · REGISTRO", W * 0.05, H * 0.15);
    g.fillStyle = "#b3bdb7";
    g.font = `400 ${H * 0.075}px ${MONO}`;
    ["módulo 1 .. ok", "módulo 2 .. ok", "módulo 6 .. aviso", "errores ...... 1"].forEach((t, i) => g.fillText(t, W * 0.05, H * (0.32 + i * 0.15)));
    g.fillStyle = "#8b968f";
    g.fillText("demostración", W * 0.05, H * 0.94);
  }, 256);
  ls.position.set(0, 0.15, -0.15);
  ls.rotation.x = -0.25;
  lap.add(ls);
  lap.position.set(-0.9, 0.95, -6.1);
  add(lap);
  addPerson(add, -0.4, -5.5, -Math.PI / 2.4, "overall");
}

function buildSecondLife(add) {
  // Armarios de almacenamiento; el segundo es hueco y se abre en el montaje
  const led = mat("led").clone();
  R.cabLed = led;
  [2.1, 3.25, 4.4, 5.55].forEach((x, i) => {
    add(box(0.98, 0.1, 0.76, "plasticDark", x, 0.13, 7.3, 0.01));
    if (i === 1) {
      // Carcasa hueca: fondo, laterales, techo y suelo, con bastidor interior
      add(box(1.0, 2.0, 0.04, "white", x, 1.18, 7.68, 0.01));
      for (const s of [-1, 1]) add(box(0.04, 2.0, 0.8, "white", x + s * 0.48, 1.18, 7.3, 0.01));
      add(box(1.0, 0.04, 0.8, "white", x, 2.16, 7.3, 0.01));
      add(box(1.0, 0.04, 0.8, "white", x, 0.2, 7.3, 0.01));
      for (let r = 0; r < 6; r++) add(box(0.9, 0.015, 0.7, "steel", x, 0.38 + r * 0.29, 7.3, 0.003, { cast: false }));
    } else {
      add(box(1.0, 2.0, 0.8, "white", x, 1.18, 7.3, 0.025));
      add(box(0.006, 1.9, 0.01, "plasticDark", x, 1.18, 6.9, 0.002, { cast: false }));
      for (const s of [-1, 1]) add(box(0.02, 0.28, 0.03, "steel", x + s * 0.06, 1.2, 6.885, 0.008));
      for (const y0 of [0.38, 1.88]) for (let r = 0; r < 5; r++) add(box(0.78, 0.012, 0.012, "steelDark", x, y0 + r * 0.03, 6.894, 0.003, { cast: false }));
      add(box(0.16, 0.1, 0.012, "plasticDark", x - 0.3, 1.75, 6.895, 0.004));
      add(box(0.12, 0.06, 0.004, mat("led"), x - 0.3, 1.75, 6.889, 0.002, { cast: false }));
    }
    add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.01), led, x + 0.15, 2.05, 6.89, { cast: false }));
  });
  // Placa del pasaporte nuevo (QR) en el lateral del armario abierto
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: qrTexture(), toneMapped: false }));
  qr.position.set(4.15, 1.5, 6.888);
  qr.rotation.y = Math.PI;
  qr.material.color.setScalar(0.9);
  add(qr);
  R.qrPlate = qr;
}

function buildStore(add) {
  // Segundo contenedor homologado (el primero se mueve y está en las piezas animadas)
  add(box(1.4, 1.1, 1.1, "steel", 11.7, 0.63, 6.6, 0.03));
  add(box(1.44, 0.07, 1.14, "steelDark", 11.7, 1.21, 6.6, 0.02));
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: class9Label(), transparent: true }));
  lbl.position.set(11.7, 0.75, 6.035);
  lbl.rotation.y = Math.PI;
  add(lbl);
  // Huecos de almacenamiento pintados: distancia mínima entre baterías
  const lineM = new THREE.MeshBasicMaterial({ color: 0xeef2ee, transparent: true, opacity: 0.4, toneMapped: false });
  R.spots = lineM;
  [[8.2, 3.0], [12.0, 3.0]].forEach(([x, z]) => {
    [[0, -0.6, 1.3, 0.05], [0, 0.6, 1.3, 0.05], [-0.65, 0, 0.05, 1.2], [0.65, 0, 0.05, 1.2]].forEach(([dx, dz, w, d]) => add(plane(w, d, lineM, x + dx, 0.1, z + dz)));
  });
  // Batería embalada lista para salir y transpalé
  add(box(1.1, 0.5, 0.8, "wood", 8.2, 0.34, 3.0, 0.02));
  add(box(1.0, 0.36, 0.7, "plasticDark", 8.2, 0.75, 3.0, 0.02));
  add(box(0.5, 0.12, 1.2, "steelDark", 12.0, 0.14, 3.0, 0.02));
  add(cyl(0.02, 0.02, 1.0, "steelDark", 12.0, 0.65, 2.35, 6));
  // Certificado de gestor de residuos en la pared
  const cert = screen(0.5, 0.36, (g, W, H) => {
    g.fillStyle = "#eef2ee";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#0a0d0c";
    g.font = `600 ${H * 0.11}px ${FONT}`;
    g.fillText("Gestor autorizado", W * 0.08, H * 0.24);
    g.fillStyle = "#8b968f";
    for (let k = 0; k < 4; k++) g.fillRect(W * 0.08, H * (0.4 + k * 0.12), W * (0.8 - (k % 2) * 0.2), H * 0.04);
  }, 256);
  cert.position.set(12.88, 1.6, 2.4);
  cert.rotation.y = -Math.PI / 2;
  add(cert);
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
  // Paneles explicativos, taburetes y visitantes
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
  addPerson(add, -2.2, 6.2, 0.2, "visitor", false);
  addPerson(add, -3.4, 6.0, -0.3, "visitor2", false);
}

// Piezas que se mueven o cambian con las tomas (no se funden con el resto)
function buildDynamic(add) {
  const v3 = (a) => new THREE.Vector3(...a);
  // Haz del lector de QR hasta la batería
  const from = v3([-10.3, 1.3, 5.62]);
  const to = v3([-9.5, 1.03, 4.6]);
  const len = from.distanceTo(to);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false });
  beamMat.color.multiplyScalar(2.5);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.02, len, 8), beamMat);
  beam.position.copy(from).lerp(to, 0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  add(beam);
  R.beam = beam;
  // Flash de la foto del estado de llegada
  const flash = new THREE.PointLight(0xffffff, 0, 6, 2);
  flash.position.set(-8.3, 1.7, 5.3);
  add(flash);
  R.flash = flash;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  bulb.material.color.multiplyScalar(4);
  bulb.position.copy(flash.position);
  add(bulb);
  R.flashBulb = bulb;
  // Puntas del polímetro hasta los bornes
  const probes = new THREE.Group();
  probes.add(cable([[-7.2, 0.96, 2.1], [-7.4, 1.1, 2.6], [-7.55, 1.12, 3.0], [-7.6, 1.07, 3.15]], 0.006, "redPaint"));
  probes.add(cable([[-7.18, 0.96, 2.1], [-7.7, 1.15, 2.5], [-8.0, 1.14, 3.0], [-8.05, 1.07, 3.15]], 0.006, "plasticDark"));
  add(probes);
  R.probes = probes;
  // Linterna de inspección: cono de luz hacia la parte baja del pack
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 1.2, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  const lamp = new THREE.Group();
  cone.position.y = -0.6;
  lamp.add(cone);
  lamp.add(cyl(0.03, 0.03, 0.18, "plasticDark", 0, 0.05, 0, 10));
  lamp.position.set(-7.25, 0.95, 4.0);
  lamp.rotation.set(-1.1, 0, -0.5);
  add(lamp);
  R.lamp = lamp;
  // Tapa del contenedor ignífugo central (bisagra en el borde trasero)
  const lidQ = new THREE.Group();
  lidQ.position.set(-9.5, 1.12, -7.27);
  lidQ.add(box(1.64, 0.08, 1.14, "steelDark", 0, 0, 0.57, 0.02));
  add(lidQ);
  R.lidQ = lidQ;
  // Cables de medida del equipo al pack (naranja: alta tensión)
  const labCables = new THREE.Group();
  [[-2.9, "hvCable"], [-1.8, "plasticDark"]].forEach(([x, m]) =>
    labCables.add(cable([[x, 0.6, -7.0], [x + 0.2, 0.25, -6.3], [-1.9, 0.6, -5.1], [-1.75, 1.0, -4.62]], 0.018, m))
  );
  add(labCables);
  R.labCables = labCables;
  // Sondas de medida por módulo
  const labProbes = new THREE.Group();
  labProbes.add(cable([[-1.0, 0.95, -6.0], [-1.1, 1.4, -5.2], [-1.4, 1.45, -4.7]], 0.006, "redPaint"));
  labProbes.add(cable([[-0.95, 0.95, -6.0], [-0.9, 1.35, -5.0], [-1.1, 1.42, -4.5]], 0.006, "plasticDark"));
  add(labProbes);
  R.labProbes = labProbes;
  // Puerta del armario de segunda vida y módulos que entran en su bastidor
  const door = new THREE.Group();
  door.position.set(3.25 - 0.5, 1.18, 6.9);
  door.add(box(1.0, 2.0, 0.03, "white", 0.5, 0, 0, 0.01));
  door.add(box(0.02, 0.28, 0.03, "steel", 0.88, 0, -0.03, 0.008));
  add(door);
  R.cabDoor = door;
  R.rackMods = [];
  for (let r = 0; r < 6; r++) {
    const m = box(0.64, 0.11, 0.22, "alu", 3.25, 0.45 + r * 0.29, 7.3, 0.008);
    m.add(box(0.04, 0.03, 0.05, "hv", -0.27, 0.07, 0, 0.008), box(0.04, 0.03, 0.05, "hv", 0.27, 0.07, 0, 0.008));
    add(m);
    R.rackMods.push(m);
  }
  // Cableado entre armarios por la parte alta
  const cabCables = new THREE.Group();
  cabCables.add(cable([[2.1, 2.2, 7.4], [2.7, 2.45, 7.4], [3.25, 2.2, 7.4]], 0.02, "hvCable"));
  cabCables.add(cable([[3.25, 2.2, 7.5], [3.8, 2.45, 7.5], [4.4, 2.2, 7.5]], 0.02, "plasticDark"));
  cabCables.add(cable([[4.4, 2.2, 7.4], [5.0, 2.45, 7.4], [5.55, 2.2, 7.4]], 0.02, "hvCable"));
  add(cabCables);
  R.cabCables = cabCables;
  // Equipo de descarga controlada junto al carro, con su barra de carga
  const dis = new THREE.Group();
  dis.add(box(0.6, 0.9, 0.5, "plasticGrey", 0, 0.53, 0, 0.03));
  dis.add(box(0.44, 0.18, 0.02, "plasticDark", 0, 0.82, -0.26, 0.005));
  const barMat = new THREE.MeshBasicMaterial({ color: COLORS.amber, toneMapped: false });
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.06), barMat);
  bar.geometry.translate(0.18, 0, 0);
  bar.position.set(-0.18, 0.82, -0.272);
  bar.rotation.y = Math.PI;
  bar.position.x = 0.18;
  dis.add(bar);
  dis.add(cable([[0.0, 0.7, 0.26], [0.35, 0.5, 0.6], [0.9, 0.95, 0.4]], 0.014, "hvCable"));
  dis.position.set(8.9, 0, 4.4);
  dis.rotation.y = Math.PI / 2;
  add(dis);
  R.discharge = dis;
  R.dischargeBar = bar;
  // Contenedor homologado de reciclaje: recibe la batería, se etiqueta y va al camión
  const crate = new THREE.Group();
  crate.add(box(1.4, 1.1, 1.1, "steel", 0, 0.63, 0, 0.03));
  const lidB = new THREE.Group();
  lidB.position.set(0, 1.21, 0.57);
  lidB.add(box(1.44, 0.07, 1.14, "steelDark", 0, 0, -0.57, 0.02));
  crate.add(lidB);
  const c9 = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: class9Label(), transparent: true }));
  c9.position.set(0, 0.75, -0.565);
  c9.rotation.y = Math.PI;
  crate.add(c9);
  crate.add(box(1.2, 0.08, 1.0, "steelDark", 0, 0.04, 0, 0.01));
  crate.position.set(10, 0, 6.6);
  add(crate);
  R.crate = crate;
  R.lidB = lidB;
  R.c9 = c9;
  R.crateLeg = poly([[10, 6.6], [10, 5.6], [12.2, 5.0], [14.4, 5.0]]);
  // Energía de las placas al armario de demostración: trazo que avanza
  const ft = canvasTexture(256, 16, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = "#3ddc84";
    for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 32, H);
  });
  ft.wrapS = THREE.RepeatWrapping;
  ft.repeat.set(8, 1);
  const flowMat = new THREE.MeshBasicMaterial({ map: ft, transparent: true, toneMapped: false, depthWrite: false });
  flowMat.color.multiplyScalar(2.2);
  const flow = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3([-9.5, 3.35, 9.1]), v3([-6.6, 3.2, 9.1]), v3([-6.6, 2.4, 8.4]), v3([-5.6, 2.3, 7.95]), v3([-5.6, 1.6, 7.8]), v3([-4.6, 1.5, 7.6])]), 80, 0.03, 8),
    flowMat
  );
  add(flow);
  R.flow = flow;
  R.flowTex = ft;
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
function addPerson(add, x, z, rot, suit = "overall", vest = true) {
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
  if (vest) {
    const v = mesh(TORSO, "vest", 0, 0.99, 0);
    v.scale.set(1.06, 0.86, 0.72);
    p.add(v);
    for (const y of [1.17, 1.3]) {
      const band = mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.03, 24, 1, true), "reflect", 0, y, 0, { cast: false });
      band.scale.set(1.04, 1, 0.74);
      p.add(band);
    }
  }
  // Brazos: hombro, codo ligeramente doblado y mano
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.2, 1.45, 0);
    sh.rotation.z = s * 0.1;
    sh.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), vest ? "vest" : suit, 0, 0, 0));
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
  if (vest) {
    p.add(mesh(new THREE.SphereGeometry(0.108, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), "helmet", 0, 1.74, 0));
    p.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 24, 1, false, -Math.PI / 2, Math.PI), "helmet", 0, 1.745, 0.02));
  } else p.add(mesh(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), "trunk", 0, 1.72, -0.005));
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
  g.add(box(1.2, 1.4, 0.02, "plasticDark", 0.15, 1.2, -0.97, 0.01));
  const slide = box(1.25, 1.45, 0.03, "vanPaint", 0.15, 1.2, -1.0, 0.01);
  slide.userData.dynamic = true;
  g.add(slide);
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
    // Puerta lateral: se separa un poco y se desliza hacia atrás
    setDoor(v) {
      slide.position.set(0.15 - 1.3 * v, 1.2, -1.0 - 0.07 * Math.min(1, v * 4));
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
  g.add(box(0.03, 2.5, 2.3, "plasticDark", -3.84, 1.95, 0, 0.005));
  const rear = [-1, 1].map((s) => {
    const hinge = new THREE.Group();
    hinge.userData.dynamic = true;
    hinge.position.set(-3.88, 1.95, s * 1.18);
    hinge.add(box(0.04, 2.5, 1.16, "white", -0.02, 0, -s * 0.58, 0.01));
    for (const z of [-0.85, -0.3]) hinge.add(cyl(0.015, 0.015, 2.3, "steel", -0.06, 0, s * z, 8));
    for (const y of [-0.95, 0, 0.95]) hinge.add(box(0.04, 0.08, 0.12, "steelDark", -0.06, y, -s * 0.06, 0.01));
    g.add(hinge);
    return { hinge, s };
  });
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
    // Puertas traseras abiertas (v = 1) o cerradas (v = 0)
    setDoors(v) {
      rear.forEach(({ hinge, s }) => (hinge.rotation.y = s * 1.9 * v));
    },
  };
}


// Arranque al final: los datos de arriba ya están definidos.
// La maquetación 3D (.has-3d) se fija ya, con la altura de cada paso según sus
// tomas, para que la página no salte; la escena se construye cuando el
// navegador está libre, antes de llegar a la sección.
const wrap = document.querySelector("[data-station]");
if (wrap && canRender()) {
  wrap.querySelectorAll(".pstep").forEach((el, s) => el.style.setProperty("--shots", SHOTS.filter((x) => x.step === s).length));
  document.documentElement.classList.add("has-3d");
  // Si la escena falla al construirse, vuelve el plano 2D con la lista
  const go = () => init(wrap).catch(() => document.documentElement.classList.remove("has-3d"));
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 400));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
