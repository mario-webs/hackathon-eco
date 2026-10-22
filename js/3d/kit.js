// Piezas comunes de las escenas 3D: renderizador con posproceso, materiales
// físicos con texturas procedurales, rótulos dibujados en canvas y el pack
// de batería de tracción (bandeja, módulos, pletinas, cableado de alta
// tensión, BMS, celdas y despiece). Unidades en metros.
// Three.js r160 por CDN con versión fija.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export { THREE };

export const COLORS = {
  bg: 0x0a0d0c,
  accent: 0x3ddc84,
  amber: 0xf2a93b,
  red: 0xff5a4e,
  hv: 0xff6a13,
};

// WebGL disponible y movimiento permitido
export function canRender() {
  if (!document.documentElement.classList.contains("motion")) return false;
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

// Equipo modesto: sin oclusión ambiental y con menos resolución
export const LITE = window.innerWidth < 900 || (navigator.hardwareConcurrency || 8) <= 4;

export function createRenderer(canvas, { shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(COLORS.bg, 1);
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return renderer;
}

// Cadena de posproceso: render con MSAA, oclusión ambiental (GTAO),
// brillo en lo que emite luz (LED, pantallas, ruta) y salida con tono ACES.
export function createComposer(renderer, scene, camera, { ao = !LITE, bloom = 0.55 } = {}) {
  const size = renderer.getSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (ao) {
    gtao = new GTAOPass(scene, camera, size.x, size.y);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    composer.addPass(gtao);
  }
  // Umbral alto: solo brilla lo que emite (LED, pantallas, rutas), no la pintura blanca
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), bloom, 0.4, 2.4);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  let W = size.x;
  let H = size.y;
  const api = {
    composer,
    setSize(w, h) {
      W = w;
      H = h;
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      if (gtao) gtao.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    },
    render() {
      composer.render();
    },
    // Equipo que no llega: primero fuera la oclusión ambiental, luego menos resolución.
    // Devuelve false cuando ya no queda nada que bajar.
    degrade() {
      if (gtao?.enabled) {
        gtao.enabled = false;
        return true;
      }
      const pr = renderer.getPixelRatio();
      if (pr <= 1) return false;
      renderer.setPixelRatio(Math.max(1, pr - 0.25));
      renderer.setSize(W, H, false);
      api.setSize(W, H);
      return true;
    },
  };
  return api;
}

export function environment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
}

// ---------- Texturas procedurales ----------
function noiseCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  return c;
}

function dataTex(canvas, repeat = 1, color = false) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Aluminio cepillado: vetas horizontales en la rugosidad
const brushed = () =>
  noiseCanvas(512, 512, (g, w, h) => {
    g.fillStyle = "#8a8a8a";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * h;
      const v = 110 + Math.random() * 60;
      g.fillStyle = `rgba(${v},${v},${v},.35)`;
      g.fillRect(Math.random() * w - 40, y, 60 + Math.random() * 260, 1);
    }
  });

// Variación suave para hormigón, pintura y plástico
const blotch = (base, amp, n = 900, s = 40) =>
  noiseCanvas(512, 512, (g, w, h) => {
    g.fillStyle = `rgb(${base},${base},${base})`;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const v = base + (Math.random() - 0.5) * amp;
      g.fillStyle = `rgba(${v},${v},${v},.18)`;
      const r = Math.random() * s + 4;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      g.fill();
    }
  });

let TEX = null;
function textures() {
  if (TEX) return TEX;
  TEX = {
    brushed: dataTex(brushed(), 2),
    rough: dataTex(blotch(150, 90), 2),
    paint: dataTex(blotch(90, 40, 400, 60), 1),
  };
  return TEX;
}

// Materiales con nombre: se comparten entre piezas
const matCache = new Map();
export function mat(name) {
  if (matCache.has(name)) return matCache.get(name);
  const T = textures();
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    concrete: () => std({ color: 0x40463f, roughness: 0.9, roughnessMap: T.rough, envMapIntensity: 0.4 }),
    asphalt: () => std({ color: 0x16191a, roughness: 0.96, envMapIntensity: 0.2 }),
    sidewalk: () => std({ color: 0x2c3230, roughness: 0.92, roughnessMap: T.rough, envMapIntensity: 0.3 }),
    wall: () => std({ color: 0xa3aba5, roughness: 0.9, roughnessMap: T.rough, envMapIntensity: 0.3 }),
    wallTop: () => std({ color: 0xaab3ad, roughness: 0.6, envMapIntensity: 0.5 }),
    steel: () => phys({ color: 0x9aa29e, metalness: 0.9, roughness: 0.45, roughnessMap: T.brushed, envMapIntensity: 0.9 }),
    steelDark: () => phys({ color: 0x2d3431, metalness: 0.75, roughness: 0.42, roughnessMap: T.rough, envMapIntensity: 0.9 }),
    alu: () => phys({ color: 0xc9d0cc, metalness: 1, roughness: 0.28, roughnessMap: T.brushed, envMapIntensity: 1.2 }),
    housing: () => phys({ color: 0x1d2321, metalness: 0.6, roughness: 0.38, roughnessMap: T.rough, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 1 }),
    plasticDark: () => std({ color: 0x15191a, roughness: 0.55, envMapIntensity: 0.6 }),
    plasticGrey: () => std({ color: 0x3a4240, roughness: 0.5, envMapIntensity: 0.6 }),
    white: () => phys({ color: 0xcfd5d2, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.25, roughnessMap: T.paint, envMapIntensity: 0.7 }),
    vanPaint: () => phys({ color: 0xd8dddb, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.8 }),
    glass: () => phys({ color: 0x0b1210, roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.6 }),
    rubber: () => std({ color: 0x111313, roughness: 0.92, envMapIntensity: 0.3 }),
    hv: () => phys({ color: COLORS.hv, roughness: 0.38, clearcoat: 0.4, envMapIntensity: 0.8 }),
    hvCable: () => std({ color: 0xf06a1c, roughness: 0.55, envMapIntensity: 0.5 }),
    copper: () => phys({ color: 0xd08a57, metalness: 1, roughness: 0.25, envMapIntensity: 1.3 }),
    pcb: () => std({ color: 0x0f5233, roughness: 0.5, envMapIntensity: 0.7 }),
    chip: () => std({ color: 0x0c0d0d, roughness: 0.35, envMapIntensity: 0.8 }),
    cell: () => phys({ color: 0x1c3a74, roughness: 0.3, clearcoat: 0.8, envMapIntensity: 1 }),
    cellCap: () => phys({ color: 0xc8cdcb, metalness: 1, roughness: 0.25, envMapIntensity: 1.2 }),
    cellBad: () => std({ color: 0xff5a4e, roughness: 0.4, emissive: 0xff2a1e, emissiveIntensity: 3 }),
    amberPaint: () => phys({ color: 0xc28324, roughness: 0.45, metalness: 0.25, clearcoat: 0.5, roughnessMap: T.paint, envMapIntensity: 0.8 }),
    redPaint: () => phys({ color: 0xc7342a, roughness: 0.35, clearcoat: 0.8, envMapIntensity: 0.9 }),
    wood: () => std({ color: 0x9a7650, roughness: 0.75, roughnessMap: T.rough, envMapIntensity: 0.4 }),
    bench: () => phys({ color: 0x34403b, roughness: 0.45, metalness: 0.4, envMapIntensity: 0.8 }),
    pv: () => phys({ color: 0x0b1630, roughness: 0.12, metalness: 0.5, clearcoat: 1, envMapIntensity: 1.4 }),
    skin: () => std({ color: 0xc69c7a, roughness: 0.65, envMapIntensity: 0.4 }),
    overall: () => std({ color: 0x27322e, roughness: 0.85, envMapIntensity: 0.4 }),
    visitor: () => std({ color: 0x2f4a6b, roughness: 0.8, envMapIntensity: 0.4 }),
    visitor2: () => std({ color: 0x6b4a3a, roughness: 0.8, envMapIntensity: 0.4 }),
    vest: () => std({ color: 0xc8682e, roughness: 0.85, envMapIntensity: 0.3 }),
    reflect: () => phys({ color: 0xdfe5e2, metalness: 0.9, roughness: 0.2, envMapIntensity: 1.4 }),
    helmet: () => phys({ color: 0xe2e6e3, roughness: 0.3, clearcoat: 1, envMapIntensity: 0.8 }),
    boot: () => std({ color: 0x1a1612, roughness: 0.7 }),
    tree: () => std({ color: 0x2b4634, roughness: 0.9, envMapIntensity: 0.25 }),
    tree2: () => std({ color: 0x38573f, roughness: 0.9, envMapIntensity: 0.25 }),
    trunk: () => std({ color: 0x3a2e24, roughness: 0.9 }),
    led: () => std({ color: COLORS.accent, emissive: COLORS.accent, emissiveIntensity: 7, roughness: 0.4 }),
    ledRed: () => std({ color: COLORS.red, emissive: COLORS.red, emissiveIntensity: 6, roughness: 0.4 }),
    ledWarm: () => std({ color: 0xfff2d6, emissive: 0xfff2d6, emissiveIntensity: 3.2, roughness: 0.4 }),
  }[name];
  const m = M();
  matCache.set(name, m);
  return m;
}

const geoCache = new Map();
export function rbox(w, h, d, r = 0.02) {
  const k = `${w}|${h}|${d}|${r}`;
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)));
  return geoCache.get(k);
}

export function mesh(geo, material, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, typeof material === "string" ? mat(material) : material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export const box = (w, h, d, material, x, y, z, r = 0.02, opts) => mesh(rbox(w, h, d, r), material, x, y, z, opts);

export function cyl(rt, rb, h, material, x, y, z, seg = 24, opts) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z, opts);
}

// Cable flexible a lo largo de una curva
export function cable(points, r, material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 12), r, 10), material);
}

// ---------- Texturas dibujadas en canvas ----------
export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export const FONT = '"Host Grotesk", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

// Rótulo pintado en el suelo (código de zona + nombre)
export function floorLabel(code, name, { w = 4, color = "#eef2ee", tint = "#3ddc84" } = {}) {
  const tex = canvasTexture(1024, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    // Se reduce el cuerpo si el nombre no cabe
    g.font = `500 64px ${MONO}`;
    const cw = g.measureText(code).width;
    g.font = `400 96px ${FONT}`;
    const k = Math.min(1, (W - 16) / (cw + 44 + g.measureText(name).width));
    g.textBaseline = "middle";
    g.fillStyle = tint;
    g.font = `500 ${64 * k}px ${MONO}`;
    g.fillText(code, 8, H / 2);
    g.fillStyle = color;
    g.font = `400 ${96 * k}px ${FONT}`;
    g.fillText(name, 8 + (cw + 44) * k, H / 2 + 4 * k);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w / 4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

// Pantalla emisiva (equipos de ciclado, recepción)
export function screen(w, h, draw, px = 512) {
  const tex = canvasTexture(px, Math.round((px * h) / w), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  m.material.color.setScalar(0.85);
  return m;
}

// Curva de carga y descarga para las pantallas del laboratorio
export function drawCycler(seed = 0) {
  return (g, W, H) => {
    g.fillStyle = "#06100b";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(61,220,132,.16)";
    g.lineWidth = 1;
    for (let x = 0; x < W; x += W / 8) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let y = 0; y < H; y += H / 5) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    g.strokeStyle = "#3ddc84";
    g.lineWidth = 4;
    g.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const t = (x / W) * Math.PI * 3 + seed;
      const y = H * 0.55 - Math.asin(Math.sin(t)) * H * 0.22;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    g.fillStyle = "#3ddc84";
    g.font = `500 ${Math.round(H * 0.11)}px ${MONO}`;
    g.fillText(`CH${seed + 1}  CARGA / DESCARGA`, W * 0.04, H * 0.14);
  };
}

// Etiqueta de mercancía peligrosa clase 9 (baterías de litio)
export function class9Label() {
  return canvasTexture(256, 256, (g, W) => {
    g.fillStyle = "#f4f4f0";
    g.translate(W / 2, W / 2);
    g.rotate(Math.PI / 4);
    g.fillRect(-W * 0.34, -W * 0.34, W * 0.68, W * 0.68);
    g.strokeStyle = "#111";
    g.lineWidth = 6;
    g.strokeRect(-W * 0.31, -W * 0.31, W * 0.62, W * 0.62);
    g.rotate(-Math.PI / 4);
    g.fillStyle = "#111";
    for (let i = 0; i < 7; i++) g.fillRect(-W * 0.2 + i * W * 0.06, -W * 0.3, W * 0.03, W * 0.22);
    g.font = `700 ${W * 0.2}px ${FONT}`;
    g.textAlign = "center";
    g.fillText("9", 0, W * 0.3);
  });
}

// Placa de aviso de alta tensión (triángulo amarillo con rayo)
export function hvWarning() {
  return canvasTexture(256, 256, (g, W) => {
    g.fillStyle = "#f2c230";
    g.beginPath();
    g.moveTo(W / 2, W * 0.08);
    g.lineTo(W * 0.94, W * 0.88);
    g.lineTo(W * 0.06, W * 0.88);
    g.closePath();
    g.fill();
    g.lineWidth = 12;
    g.strokeStyle = "#111";
    g.stroke();
    g.fillStyle = "#111";
    g.beginPath();
    g.moveTo(W * 0.54, W * 0.3);
    g.lineTo(W * 0.4, W * 0.58);
    g.lineTo(W * 0.52, W * 0.58);
    g.lineTo(W * 0.44, W * 0.8);
    g.lineTo(W * 0.62, W * 0.5);
    g.lineTo(W * 0.5, W * 0.5);
    g.closePath();
    g.fill();
  });
}

// Funde las mallas fijas que comparten material (y sombras) en una sola malla.
// Quedan fuera las transparentes (rutas, salas, rótulos: se animan o se ordenan)
// Las geometrías con índice y sin él se funden por separado.
// Con { transparent: true } también funde transparentes (los trazos de una misma ruta).
// Lo marcado con userData.dynamic (ruedas) y lo que cuelga de ello se respeta.
export function mergeStatic(root, { transparent = false } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const dynamic = (o) => {
    for (let a = o; a && a !== root; a = a.parent) if (a.userData.dynamic) return true;
    return false;
  };
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || (o.material.transparent && !transparent) || dynamic(o)) return;
    const g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    if (!g.attributes.normal || !g.attributes.uv) return;
    g.clearGroups();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    // mergeGeometries no mezcla geometrías con y sin índice: van en grupos distintos
    const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}|${!!g.index}`;
    if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, receive: o.receiveShadow, geos: [], meshes: [] });
    buckets.get(key).geos.push(g);
    buckets.get(key).meshes.push(o);
  });
  buckets.forEach((b) => {
    const merged = b.meshes.length > 1 ? mergeGeometries(b.geos, false) : null;
    b.geos.forEach((g) => g.dispose());
    // Si no se pudo fundir, las piezas originales se quedan tal cual
    if (!merged) return;
    b.meshes.forEach((o) => o.parent.remove(o));
    const m = new THREE.Mesh(merged, b.material);
    m.castShadow = b.cast;
    m.receiveShadow = b.receive;
    root.add(m);
  });
}

// QR esquemático del pasaporte (no codifica nada)
export function qrTexture() {
  return canvasTexture(128, 128, (g, W) => {
    g.fillStyle = "#f4f6f4";
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#0a0d0c";
    const n = 17;
    const c = W / (n + 2);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i * 13 + j * 7 + i * j) % 5 < 2) g.fillRect(c + i * c, c + j * c, c, c);
    for (const [x, y] of [[1, 1], [n - 6, 1], [1, n - 6]]) {
      g.fillRect(x * c, y * c, 7 * c, 7 * c);
      g.fillStyle = "#f4f6f4";
      g.fillRect((x + 1) * c, (y + 1) * c, 5 * c, 5 * c);
      g.fillStyle = "#0a0d0c";
      g.fillRect((x + 2) * c, (y + 2) * c, 3 * c, 3 * c);
    }
  });
}

// Etiqueta interna con código de barras (sin datos reales)
function labelTexture() {
  return canvasTexture(256, 118, (g, W, H) => {
    g.fillStyle = "#f4f6f4";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#3ddc84";
    g.fillRect(0, 0, W, H * 0.18);
    g.fillStyle = "#0a0d0c";
    for (let x = 14; x < W - 14; x += 3) if ((x * 7) % 11 < 6) g.fillRect(x, H * 0.32, (x % 3) + 1, H * 0.42);
    g.font = `500 ${H * 0.13}px ${MONO}`;
    g.fillText("SV · RECEPCIÓN", 14, H * 0.92);
  });
}

// ---------- Pack de batería de tracción ----------
// Bandeja de aluminio con nervios y bridas, 8 módulos (2 × 4) con placas
// finales, pletinas de cobre en serie, arnés de medida, caja de conexiones
// con cableado naranja de alta tensión hasta el conector principal, BMS y
// tapa. setExplode(0..1) levanta tapa, módulos y cubiertas hasta dejar ver
// las celdas; una celda marcada falla.
export function batteryPack({ lid = true, cells = true } = {}) {
  const g = new THREE.Group();
  const tray = new THREE.Group();
  g.add(tray);

  // Bandeja con nervios en el fondo y bridas atornilladas
  tray.add(box(1.62, 0.05, 1.08, "housing", 0, 0.025, 0, 0.015));
  for (let i = -3; i <= 3; i++) tray.add(box(0.012, 0.012, 1.0, "housing", i * 0.22, 0.056, 0, 0.004));
  [[0, 0.525, 1.62, 0.03], [0, -0.525, 1.62, 0.03]].forEach(([x, z, w, d]) => tray.add(box(w, 0.13, d, "housing", x, 0.09, z, 0.01)));
  [0.795, -0.795].forEach((x) => tray.add(box(0.03, 0.13, 1.08, "housing", x, 0.09, 0, 0.01)));
  const flange = (x, z, w, d) => tray.add(box(w, 0.012, d, "housing", x, 0.155, z, 0.004));
  flange(0, 0.55, 1.68, 0.06);
  flange(0, -0.55, 1.68, 0.06);
  flange(0.82, 0, 0.06, 1.16);
  flange(-0.82, 0, 0.06, 1.16);
  const bolt = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8);
  for (let i = 0; i < 10; i++) {
    const x = -0.78 + i * 0.173;
    tray.add(mesh(bolt, "steel", x, 0.166, 0.555), mesh(bolt, "steel", x, 0.166, -0.555));
  }
  // Soportes de anclaje al chasis
  for (const sx of [-1, 1]) for (const sz of [-0.36, 0.36]) tray.add(box(0.1, 0.02, 0.12, "steelDark", sx * 0.87, 0.02, sz, 0.006));

  // Módulos
  const modules = [];
  const COLS = [-0.36, 0.36];
  const ROWS = [-0.39, -0.13, 0.13, 0.39];
  const cellGeo = new THREE.CylinderGeometry(0.021, 0.021, 0.088, 14);
  const capGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.008, 14);
  const N = COLS.length * ROWS.length * 16;
  const cellMesh = cells ? new THREE.InstancedMesh(cellGeo, mat("cell"), N) : null;
  const capMesh = cells ? new THREE.InstancedMesh(capGeo, mat("cellCap"), N) : null;
  const badCell = cells ? mesh(cellGeo, "cellBad", 0, 0, 0, { cast: false }) : null;
  const BAD = { mod: 5, cell: 6 };
  let ci = 0;
  COLS.forEach((x, cx) =>
    ROWS.forEach((z, rz) => {
      const mg = new THREE.Group();
      mg.add(box(0.64, 0.03, 0.22, "alu", 0, 0.015, 0, 0.006));
      const cover = new THREE.Group();
      cover.add(box(0.6, 0.075, 0.22, "alu", 0, 0, 0, 0.01));
      // Placas finales de plástico y tapa superior
      cover.add(box(0.025, 0.085, 0.225, "plasticDark", 0.31, 0, 0, 0.008), box(0.025, 0.085, 0.225, "plasticDark", -0.31, 0, 0, 0.008));
      cover.add(box(0.56, 0.006, 0.19, "plasticGrey", 0, 0.04, 0, 0.003));
      // Bornes del módulo
      for (const s of [-1, 1]) {
        cover.add(cyl(0.017, 0.017, 0.022, "copper", s * 0.255, 0.052, 0, 16));
        cover.add(cyl(0.024, 0.024, 0.008, "hv", s * 0.255, 0.045, 0, 16));
      }
      // Arnés de medida (conector blanco)
      cover.add(box(0.05, 0.02, 0.03, "white", 0, 0.05, 0.075, 0.005));
      cover.position.y = 0.03 + 0.0375;
      mg.add(cover);
      mg.position.set(x, 0.06, z);
      const idx = modules.length;
      modules.push({ g: mg, cover, home: new THREE.Vector3(x, 0.06, z), cx, rz, cells: [] });
      for (let k = 0; k < 16; k++) {
        const px = -0.28 + (k % 8) * 0.08;
        const pz = k < 8 ? -0.05 : 0.05;
        modules[idx].cells.push({ px, pz, i: idx === BAD.mod && k === BAD.cell ? -1 : ci++ });
      }
      tray.add(mg);
    })
  );

  // Pletinas de cobre: serie dentro de cada columna y puente entre columnas
  const bars = new THREE.Group();
  COLS.forEach((x) =>
    [-0.26, 0, 0.26].forEach((z, k) => {
      const sx = (k % 2 ? -1 : 1) * 0.255;
      bars.add(box(0.045, 0.006, 0.3, "copper", x + sx, 0.165, z, 0.002));
    })
  );
  bars.add(box(0.32, 0.006, 0.045, "copper", 0, 0.165, 0.39, 0.002));
  // Arnés de medida: cables finos a lo largo de los módulos
  COLS.forEach((x) => bars.add(cable([[x, 0.17, -0.47], [x, 0.172, -0.13], [x, 0.172, 0.13], [x, 0.17, 0.47]], 0.004, "white")));
  tray.add(bars);

  // Caja de conexiones (contactores y fusible) y cableado de alta tensión
  const bdu = new THREE.Group();
  bdu.add(box(0.12, 0.09, 0.3, "plasticDark", 0, 0, 0, 0.012));
  bdu.add(box(0.1, 0.004, 0.26, "plasticGrey", 0, 0.047, 0, 0.002));
  const warn = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshStandardMaterial({ map: hvWarning(), transparent: true, roughness: 0.5 }));
  warn.rotation.x = -Math.PI / 2;
  warn.position.set(0, 0.0495, 0.08);
  bdu.add(warn);
  bdu.position.set(0.72, 0.105, -0.22);
  tray.add(bdu);
  tray.add(cable([[0.72, 0.13, -0.07], [0.6, 0.18, 0.05], [0.45, 0.19, 0.3], [0.36, 0.175, 0.39]], 0.011, "hvCable"));
  tray.add(cable([[0.72, 0.13, -0.37], [0.6, 0.18, -0.45], [0.42, 0.18, -0.47], [0.36, 0.17, -0.39]], 0.011, "hvCable"));
  tray.add(cable([[0.78, 0.11, -0.3], [0.85, 0.1, -0.3], [0.9, 0.09, -0.3]], 0.013, "hvCable"));
  // Conector principal de alta tensión en la pared de la bandeja
  const hvMain = new THREE.Group();
  hvMain.add(cyl(0.045, 0.045, 0.06, "hv", 0, 0, 0, 24).rotateZ(Math.PI / 2));
  hvMain.add(cyl(0.05, 0.05, 0.015, "plasticDark", -0.025, 0, 0, 24).rotateZ(Math.PI / 2));
  hvMain.add(cyl(0.022, 0.022, 0.065, "plasticDark", 0.005, 0, 0, 16).rotateZ(Math.PI / 2));
  hvMain.position.set(0.84, 0.09, -0.3);
  tray.add(hvMain);
  // Conector de baja tensión (señal) y respiradero
  tray.add(cyl(0.022, 0.022, 0.04, "plasticDark", 0.82, 0.09, 0.15, 16).rotateZ(Math.PI / 2));
  tray.add(cyl(0.015, 0.015, 0.02, "steel", 0.81, 0.09, 0.3, 12).rotateZ(Math.PI / 2));

  // BMS: placa con integrados y conector de cinta
  const bms = new THREE.Group();
  bms.add(box(0.075, 0.008, 0.3, "pcb", 0, 0, 0, 0.002));
  for (let i = 0; i < 6; i++) bms.add(box(0.026, 0.006, 0.03, "chip", -0.012 + (i % 2) * 0.026, 0.007, -0.11 + Math.floor(i / 2) * 0.09, 0.001));
  bms.add(box(0.012, 0.012, 0.012, mat("led"), 0.025, 0.01, 0.12, 0.002));
  bms.position.set(0.72, 0.075, 0.2);
  tray.add(bms);

  if (cellMesh) {
    cellMesh.count = ci;
    capMesh.count = ci;
    cellMesh.castShadow = true;
    tray.add(cellMesh, capMesh, badCell);
  }

  // Tapa estampada con nervios
  let lidGroup = null;
  if (lid) {
    lidGroup = new THREE.Group();
    lidGroup.add(box(1.64, 0.02, 1.1, "housing", 0, 0, 0, 0.01));
    for (let i = -2; i <= 2; i++) lidGroup.add(box(1.4, 0.012, 0.05, "housing", 0, 0.014, i * 0.2, 0.006));
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshStandardMaterial({ map: hvWarning(), transparent: true, roughness: 0.5 }));
    lw.rotation.x = -Math.PI / 2;
    lw.position.set(0.62, 0.0115, 0.42);
    lidGroup.add(lw);
    lidGroup.position.y = 0.2;
    tray.add(lidGroup);
  }

  // Tira de estado (verde, ámbar, rojo)
  const ledMat = mat("led").clone();
  const led = mesh(new THREE.BoxGeometry(0.5, 0.012, 0.012), ledMat, 0, 0.1, 0.545, { cast: false });
  tray.add(led);

  const m4 = new THREE.Matrix4();
  const v = new THREE.Vector3();
  let explode = -1;

  // Elevación extra del módulo defectuoso (reparación): 0 en su sitio, 1 fuera del pack
  let liftBad = 0;
  const setExplode = (e, force = false) => {
    if (!force && Math.abs(e - explode) < 1e-4) return;
    explode = e;
    const s = e * e * (3 - 2 * e);
    modules.forEach((m) => {
      const lift = s * (0.32 + m.rz * 0.06) + (m === modules[BAD.mod] ? liftBad * 0.55 : 0);
      m.g.position.set(m.home.x * (1 + s * 0.42), m.home.y + lift, m.home.z * (1 + s * 0.75));
      m.cover.position.y = 0.0675 + s * 0.2;
      if (cellMesh) {
        m.cells.forEach((c) => {
          v.set(m.g.position.x + c.px, m.g.position.y + 0.03 + 0.044 + s * 0.02, m.g.position.z + c.pz);
          if (c.i < 0) {
            badCell.position.copy(v);
          } else {
            m4.makeTranslation(v.x, v.y, v.z);
            cellMesh.setMatrixAt(c.i, m4);
            m4.makeTranslation(v.x, v.y + 0.046, v.z);
            capMesh.setMatrixAt(c.i, m4);
          }
        });
      }
    });
    if (cellMesh) {
      cellMesh.instanceMatrix.needsUpdate = true;
      capMesh.instanceMatrix.needsUpdate = true;
      const show = s > 0.02;
      cellMesh.visible = capMesh.visible = badCell.visible = show;
    }
    bars.visible = s < 0.05;
    if (lidGroup) {
      lidGroup.position.y = 0.2 + s * 0.85;
      lidGroup.visible = s < 0.995;
    }
  };

  // Menos piezas que dibujar: cada cubierta, la tapa y las pletinas se funden por dentro,
  // y la bandeja funde lo fijo sin tocar lo que se mueve en el despiece
  modules.forEach((m) => {
    mergeStatic(m.cover);
    m.g.userData.dynamic = true;
  });
  mergeStatic(bars);
  bars.userData.dynamic = true;
  if (lidGroup) {
    mergeStatic(lidGroup);
    lidGroup.userData.dynamic = true;
  }
  led.userData.dynamic = true;
  if (badCell) badCell.userData.dynamic = true;
  mergeStatic(tray);

  const STATE = { ok: COLORS.accent, weak: COLORS.amber, quar: COLORS.amber, bad: COLORS.red, "": COLORS.accent };
  const setState = (st) => {
    const c = STATE[st] ?? COLORS.accent;
    ledMat.color.setHex(c);
    ledMat.emissive.setHex(c);
  };

  // Pegatina del pasaporte (QR) en la tapa y etiqueta interna que se pone en recepción
  let label = null;
  if (lidGroup) {
    const qr = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshStandardMaterial({ map: qrTexture(), roughness: 0.6 }));
    qr.rotation.x = -Math.PI / 2;
    qr.position.set(-0.6, 0.0115, 0.4);
    lidGroup.add(qr);
    label = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.12), new THREE.MeshStandardMaterial({ map: labelTexture(), roughness: 0.6 }));
    label.rotation.x = -Math.PI / 2;
    label.position.set(-0.3, 0.0115, 0.42);
    label.scale.setScalar(1e-3);
    lidGroup.add(label);
  }
  const setLabel = (v) => {
    if (label) label.scale.setScalar(Math.max(1e-3, v));
  };
  // Celda sustituida: deja de marcarse como fallida
  const setFixed = (v) => {
    if (badCell) badCell.material = mat(v ? "cell" : "cellBad");
  };
  const setLift = (v) => {
    if (Math.abs(v - liftBad) < 1e-4) return;
    liftBad = v;
    setExplode(explode, true);
  };

  setExplode(0);
  return { group: g, setExplode, setState, setLabel, setFixed, setLift, hvMain };
}

// Vigila el tiempo entre fotogramas dibujados y baja calidad si no llega a ~40 fps
export function frameGovernor(post) {
  let ema = 1 / 60;
  let n = 0;
  let done = false;
  return (dt) => {
    if (done || dt <= 0) return;
    ema += (dt - ema) * 0.08;
    if (++n < 45) return;
    n = 0;
    if (ema > 1 / 40) done = !post.degrade();
  };
}

// Visibilidad de un elemento: solo se dibuja mientras está en pantalla
export function whenVisible(el, onChange, rootMargin = "120px") {
  const io = new IntersectionObserver((entries) => onChange(entries[0].isIntersecting), { rootMargin });
  io.observe(el);
  return io;
}

// Espera a las fuentes para dibujar los rótulos con la tipografía buena
export async function fontsReady() {
  try {
    await Promise.all([document.fonts.load(`400 96px ${FONT}`), document.fonts.load(`500 64px ${MONO}`)]);
  } catch {
    /* sin fuentes web: se usa la del sistema */
  }
}
