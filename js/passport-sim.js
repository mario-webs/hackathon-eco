// Simulador de pasaporte. Todos los datos son ficticios.
// Elegir una batería deja su QR listo; "Escanear QR" lo lee y rellena la ficha.

(() => {
  const sim = document.querySelector("[data-sim]");
  if (!sim) return;

  const DATA = {
    coche: {
      id: "SV-DEMO-0001",
      title: "Coche eléctrico",
      year: "2028",
      chem: "NMC",
      cap: "52 kWh",
      phys: "Sin daños visibles",
      cells: "0",
      soh: 81,
      level: "ok",
      dest: "Reutilizar · armario de segunda vida",
      why: "Conserva buena parte de su capacidad y todas sus celdas están sanas. Se montaría en un armario de almacenamiento con un pasaporte nuevo vinculado al anterior.",
    },
    moto: {
      id: "SV-DEMO-0002",
      title: "Moto eléctrica",
      year: "2028",
      chem: "NMC",
      cap: "4 kWh",
      phys: "Sin daños visibles",
      cells: "3",
      soh: 72,
      level: "weak",
      dest: "Reparar · vuelve a un vehículo",
      why: "Fallan algunas celdas, pero el resto está bien. Se cambiarían las celdas dañadas y la batería volvería a una moto.",
    },
    golpeada: {
      id: "SV-DEMO-0003",
      title: "Coche eléctrico, golpeada",
      year: "2027",
      chem: "LFP",
      cap: "60 kWh",
      phys: "Golpeada e hinchada",
      cells: "Varias",
      soh: 38,
      level: "bad",
      dest: "Cuarentena y después reciclar",
      why: "Está dañada: primero va a cuarentena en un contenedor ignífugo hasta que sea seguro tocarla. Después se envía a una planta autorizada que recupera litio, cobalto, níquel y cobre.",
    },
    antigua: {
      id: "Sin pasaporte",
      title: "Patinete eléctrico de 2022",
      year: "2022",
      chem: "Sin datos",
      cap: "Sin datos",
      phys: "Revisión visual en recepción",
      cells: "Pendiente",
      soh: null,
      level: "none",
      dest: "Registro a mano y diagnóstico en el laboratorio",
      why: "Es anterior a 2027 y no tiene pasaporte. En recepción se registra a mano y el laboratorio hace su propio diagnóstico para decidir el destino.",
    },
  };

  const card = sim.querySelector("[data-sim-card]");
  const scanBtn = sim.querySelector("[data-sim-scan]");
  const qr = sim.querySelector(".sim__qr");
  const f = (name) => card.querySelector(`[data-f="${name}"]`);
  const motion = () => document.documentElement.classList.contains("motion");
  const LEVEL_TAG = { ok: "Sana", weak: "Débil", bad: "Dañada" };

  let current = "coche";
  let timer = 0;

  const fill = (key) => {
    const d = DATA[key];
    f("id").textContent = d.id.startsWith("SV-") ? `Pasaporte · ${d.id}` : d.id;
    f("title").textContent = d.title;
    f("year").textContent = d.year;
    f("chem").textContent = d.chem;
    f("cap").textContent = d.cap;
    f("phys").textContent = d.phys;
    f("cells").textContent = d.cells;
    f("soh").textContent = d.soh == null ? "Pendiente de diagnóstico" : `${d.soh} % · ${LEVEL_TAG[d.level]}`;
    f("meter").style.setProperty("--v", d.soh ?? 0);
    f("dest").textContent = d.dest;
    f("why").textContent = d.why;
    card.dataset.level = d.level;
    card.classList.remove("is-pending");
  };

  const pending = () => card.classList.add("is-pending");

  const scan = () => {
    clearTimeout(timer);
    if (!motion()) return fill(current);
    qr.classList.remove("is-scanning");
    void qr.offsetWidth; // reinicia la animación
    qr.classList.add("is-scanning");
    scanBtn.disabled = true;
    timer = setTimeout(() => {
      qr.classList.remove("is-scanning");
      scanBtn.disabled = false;
      fill(current);
    }, 750);
  };

  sim.addEventListener("change", (e) => {
    if (e.target.name !== "sim") return;
    current = e.target.value;
    qr.dataset.has = current === "antigua" ? "no" : "yes";
    pending();
  });

  scanBtn.addEventListener("click", scan);
  fill(current);
})();
