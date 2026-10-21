// Formulario de cita (demostración, sin backend).
// Valida en el cliente, muestra los errores junto a cada campo y en un resumen,
// y termina en una confirmación simulada. No envía datos a ningún sitio.

(() => {
  const form = document.querySelector("[data-booking]");
  if (!form) return;

  form.noValidate = true; // usamos nuestros mensajes, más claros que los del navegador

  const summary = document.querySelector("[data-error-summary]");
  const confirmBox = document.querySelector("[data-confirm]");
  const confirmList = document.querySelector("[data-confirm-list]");
  const warning = form.querySelector("[data-damage-warning]");
  const fecha = form.elements.fecha;

  // Fecha mínima: hoy (hora local)
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  fecha.min = iso(today);

  // Aviso de seguridad si está dañada
  form.addEventListener("change", (e) => {
    if (e.target.name === "danada") warning.hidden = e.target.value !== "Sí";
    if (e.target.dataset.touched) validateField(e.target.name);
  });

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE = /^[+\d][\d\s-]{7,}$/;

  const rules = {
    vehiculo: (f) => (!f.vehiculo.value ? "Elige el tipo de vehículo." : ""),
    tipo: (f) => (!f.tipo.value ? "Elige el tipo de batería. Si no lo sabes, marca «No lo sé»." : ""),
    pasaporte: (f) => (!f.pasaporte.value ? "Indica si la batería tiene pasaporte." : ""),
    danada: (f) => (!f.danada.value ? "Indica si la batería está dañada." : ""),
    fecha: (f) => {
      if (!f.fecha.value) return "Elige una fecha.";
      if (f.fecha.value < fecha.min) return "La fecha no puede ser anterior a hoy.";
      return "";
    },
    nombre: (f) => (f.nombre.value.trim().length < 2 ? "Escribe tu nombre." : ""),
    email: (f) => {
      const v = f.email.value.trim();
      if (!v && !f.telefono.value.trim()) return "Deja un correo o un teléfono para poder contactarte.";
      if (v && !EMAIL.test(v)) return "El correo no parece válido. Revisa que tenga @ y un dominio, como nombre@correo.es.";
      return "";
    },
    telefono: (f) => {
      const v = f.telefono.value.trim();
      if (v && !PHONE.test(v)) return "El teléfono no parece válido. Usa solo números, espacios o el prefijo +34.";
      return "";
    },
  };

  const LABEL = {
    vehiculo: "Tipo de vehículo",
    tipo: "Tipo de batería",
    pasaporte: "Pasaporte",
    danada: "Estado",
    fecha: "Fecha",
    nombre: "Nombre",
    email: "Correo electrónico",
    telefono: "Teléfono",
  };

  const firstControl = (name) => {
    const el = form.elements[name];
    return el instanceof RadioNodeList ? el[0] : el;
  };

  function validateField(name) {
    const msg = rules[name](form.elements);
    const err = document.getElementById(`${name}-error`);
    const el = form.elements[name];
    const controls = el instanceof RadioNodeList ? [...el] : [el];
    controls.forEach((c) => c.setAttribute("aria-invalid", msg ? "true" : "false"));
    if (err) {
      err.textContent = msg;
      err.hidden = !msg;
    }
    return msg;
  }

  // Validar al salir de un campo que ya se ha tocado
  form.addEventListener(
    "blur",
    (e) => {
      const name = e.target.name;
      if (!rules[name]) return;
      e.target.dataset.touched = "1";
      if (e.target.type !== "radio") validateField(name);
    },
    true
  );

  form.addEventListener("input", (e) => {
    if (e.target.dataset.touched && rules[e.target.name]) validateField(e.target.name);
    // email y teléfono dependen uno del otro
    if (e.target.name === "telefono" && form.elements.email.dataset.touched) validateField("email");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const errors = Object.keys(rules)
      .map((name) => [name, validateField(name)])
      .filter(([, msg]) => msg);

    const list = summary.querySelector("ul");
    list.innerHTML = "";
    if (errors.length) {
      errors.forEach(([name, msg]) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${firstControl(name).id || name}`;
        a.textContent = msg;
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          firstControl(name).focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
      return;
    }

    summary.hidden = true;
    const f = form.elements;
    const contacto = [f.email.value.trim(), f.telefono.value.trim()].filter(Boolean).join(" · ");
    const fechaTxt = new Date(`${f.fecha.value}T12:00:00`).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const rows = [
      ["Vehículo", f.vehiculo.value],
      ["Batería", f.tipo.value],
      ["Pasaporte", f.pasaporte.value],
      ["Dañada", f.danada.value],
      ["Fecha preferida", fechaTxt],
      ["Nombre", f.nombre.value.trim()],
      ["Contacto", contacto],
    ];
    confirmList.innerHTML = "";
    rows.forEach(([k, v]) => {
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      div.append(dt, dd);
      confirmList.appendChild(div);
    });
    if (f.danada.value === "Sí") {
      const note = document.createElement("p");
      note.className = "confirm__warn";
      note.textContent = "Batería dañada: la estación te contactaría antes para organizar un transporte homologado.";
      confirmList.appendChild(note);
    }
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });

  document.querySelector("[data-confirm-reset]")?.addEventListener("click", () => {
    form.reset();
    warning.hidden = true;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    form.querySelectorAll("[data-touched]").forEach((el) => delete el.dataset.touched);
    confirmBox.hidden = true;
    form.hidden = false;
    firstControl("vehiculo").focus();
  });
})();
