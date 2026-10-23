// Hero: el pack de batería en estudio. Gira despacio, sigue al puntero y
// se despieza al bajar. Sin WebGL o con "reducir movimiento" se queda la
// imagen fija del mismo pack que ya está en el HTML.

import { THREE, canRender, createRenderer, createComposer, environment, batteryPack, whenVisible, frameGovernor, COLORS } from "./kit.js";

const panel = document.querySelector("[data-hero-3d]");
if (panel && canRender()) init(panel);

function init(panel) {
  const canvas = document.createElement("canvas");
  canvas.className = "hero__canvas";
  canvas.setAttribute("aria-hidden", "true");
  panel.append(canvas);

  const BG = 0x0d1210;
  const renderer = createRenderer(canvas);
  renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 4.2, 8);
  environment(renderer, scene);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  // Escena pequeña: la sombra ya da el contacto, sin oclusión ambiental
  const post = createComposer(renderer, scene, camera, { ao: false, bloom: 0.45 });
  const govern = frameGovernor(post);

  // Luz de estudio: clave suave desde arriba a la izquierda, contra verde,
  // un acento cálido que hace leer el naranja de alta tensión
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-2.2, 4.8, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 1, far: 12 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(COLORS.accent, 1.8);
  rim.position.set(2.5, 1.2, -3);
  scene.add(rim);
  const warm = new THREE.SpotLight(0xffb27a, 6, 6, 0.6, 0.8);
  warm.position.set(2.2, 1.6, 1.4);
  warm.target.position.set(0.6, 0, -0.2);
  scene.add(warm, warm.target);
  scene.add(new THREE.HemisphereLight(0xcfe8dd, 0x0a0d0c, 0.25));

  // Suelo de estudio: oscuro y satinado, recoge reflejos y sombra
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x0a0e0c, roughness: 0.5, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const pack = batteryPack({ lid: false });
  const turn = new THREE.Group();
  turn.add(pack.group);
  scene.add(turn);

  // Etiquetas ancladas a puntos del pack (coordenadas locales en data-callout)
  const callouts = [...panel.querySelectorAll("[data-callout]")].map((el) => ({
    el,
    p: new THREE.Vector3(...el.dataset.callout.split(" ").map(Number)),
  }));
  const v = new THREE.Vector3();
  const placeCallouts = () => {
    const w = panel.clientWidth;
    const h = panel.clientHeight;
    callouts.forEach((c) => {
      v.copy(c.p);
      pack.group.localToWorld(v);
      v.project(camera);
      c.el.style.transform = `translate(${(((v.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - v.y) / 2) * h).toFixed(1)}px)`;
    });
  };

  // Encuadre según la forma del panel
  const camBase = new THREE.Vector3();
  const resize = () => {
    const w = panel.clientWidth;
    const h = canvas.clientHeight || panel.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    post.setSize(w, h);
    camera.aspect = w / h;
    const wide = w / h > 1.2;
    camBase.set(wide ? 2.6 : 2.4, wide ? 1.95 : 2.3, wide ? 3.15 : 3.9);
    camera.position.copy(camBase);
    camera.lookAt(0, 0.08, 0);
    // En escritorio el pack se desplaza a la derecha para dejar sitio al titular
    // y positivo sube el pack: deja libre la esquina inferior derecha para la entradilla
    if (wide) camera.setViewOffset(w, h, -w * 0.235, h * 0.17, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(panel);
  resize();

  // Puntero (solo con ratón) y progreso de salida del hero
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia("(pointer: fine)").matches) {
    panel.addEventListener("pointermove", (e) => {
      const r = panel.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ptr.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    panel.addEventListener("pointerleave", () => (ptr.tx = ptr.ty = 0));
  }

  // Escritorio: el panel queda fijo (CSS .hero.is-pinned) mientras el pack se
  // despieza del todo en los primeros 3/4 de pantalla de scroll.
  // Móvil: sin fijar, ciclo automático de apertura.
  const pinned = window.matchMedia("(min-width: 48rem)");
  panel.closest(".hero")?.classList.add("is-pinned");
  let ex = 0;
  const exTarget = () => {
    // Móvil: el panel no se fija (taparía el texto), así que el pack se abre y
    // se cierra solo en un ciclo lento mientras está a la vista
    const p = pinned.matches ? window.scrollY / (window.innerHeight * 0.6) : 0.5 - 0.5 * Math.cos((performance.now() / 1000) * 0.63);
    return Math.min(1, Math.max(0, p));
  };

  // ?still: encuadre fijo para generar la imagen de respaldo
  const still = new URLSearchParams(location.search).has("still");
  let raf = 0;
  let last = performance.now();
  let angle = -0.55;
  const draw = () => {
    post.render();
    placeCallouts();
  };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    // El sello de requestAnimationFrame puede ser anterior a la última medida: nunca negativo
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    const k = 1 - Math.exp(-dt * 5);
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
    ex += (exTarget() - ex) * k;
    // Al abrirse, la cámara se aleja y sube con los módulos: el pack despiezado queda entero y en su sitio
    camera.position.copy(camBase).multiplyScalar(1 + ex * 0.5);
    camera.position.y += ex * 0.32;
    camera.lookAt(0, 0.08 + ex * 0.32, 0);
    if (!still) angle += dt * 0.12;
    turn.rotation.y = angle + ptr.x * 0.35;
    turn.rotation.x = ptr.y * 0.06;
    pack.setExplode(ex);
    draw();
    govern(dt);
  };

  whenVisible(panel, (on) => {
    cancelAnimationFrame(raf);
    if (on) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  // Primer fotograma pintado: se retira la imagen de respaldo
  turn.rotation.y = angle;
  draw();
  panel.classList.add("is-3d");

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    if (!e.matches) return;
    cancelAnimationFrame(raf);
    panel.classList.remove("is-3d");
    canvas.remove();
    renderer.dispose();
  });
}
