// Cabecera: estado al bajar, indicador que se desliza bajo los enlaces,
// menú de tarjetas (teclas 1–8) y paleta de búsqueda (Ctrl K o /).
// Sin JS, el menú se ve como una lista y la paleta no aparece.

(() => {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  // ---------- Velo de la cabecera al bajar ----------
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Indicador de los enlaces en línea ----------
  const links = header.querySelector(".site-links ul");
  if (links) {
    const glide = document.createElement("li");
    glide.className = "site-links__glide";
    glide.setAttribute("aria-hidden", "true");
    links.prepend(glide);
    const moveTo = (a) => {
      if (!a) {
        glide.style.opacity = "0";
        return;
      }
      glide.style.width = `${a.offsetWidth}px`;
      glide.style.transform = `translateX(${a.offsetLeft}px)`;
      glide.style.opacity = "1";
    };
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("pointerenter", () => moveTo(a));
      a.addEventListener("focus", () => moveTo(a));
    });
    links.addEventListener("pointerleave", () => moveTo(null));
    links.addEventListener("focusout", (e) => {
      if (!links.contains(e.relatedTarget)) moveTo(null);
    });
  }

  // ---------- Menú ----------
  const toggle = header.querySelector(".menu-toggle");
  const menu = document.getElementById("site-menu");
  const menuLinks = menu ? [...menu.querySelectorAll(".menu-list a")] : [];
  const isOpen = () => menu.classList.contains("is-open");

  const setOpen = (open, returnFocus) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("menu-open", open);
    if (open) menuLinks[0]?.focus({ preventScroll: true });
    else if (returnFocus) toggle.focus();
  };

  toggle?.addEventListener("click", () => setOpen(!isOpen()));

  document.addEventListener("click", (e) => {
    if (menu && isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });

  menu?.addEventListener("keydown", (e) => {
    const i = menuLinks.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = menuLinks.length;
      const next = i < 0 ? 0 : (i + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      menuLinks[next].focus();
    } else if (/^[1-8]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const a = menuLinks[Number(e.key) - 1];
      if (a) {
        e.preventDefault();
        a.click();
      }
    }
  });

  // Al seguir un ancla de la misma página, el menú se cierra
  menuLinks.forEach((a) => a.addEventListener("click", () => setOpen(false)));

  // ---------- Paleta de búsqueda ----------
  const dialog = document.getElementById("palette");
  const input = dialog?.querySelector("[data-palette-input]");
  const list = dialog?.querySelector("[data-palette-list]");

  // Índice del sitio: páginas y secciones con su ancla
  const INDEX = [
    ["Inicio", "Portada", "index.html"],
    ["Por qué hará falta", "Portada", "index.html#why-title"],
    ["El proceso en 3D", "Portada", "index.html#proceso"],
    ["Llega la batería", "Proceso · paso 01", "index.html#paso-01"],
    ["Recepción y pasaporte", "Proceso · paso 02", "index.html#paso-02"],
    ["Inspección de seguridad", "Proceso · paso 03", "index.html#paso-03"],
    ["Cuarentena", "Proceso · paso 04", "index.html#paso-04"],
    ["Diagnóstico y estado de salud", "Proceso · paso 05", "index.html#paso-05"],
    ["Decisión del destino", "Proceso · paso 06", "index.html#paso-06"],
    ["Reutilizar: segunda vida", "Proceso · paso 07", "index.html#paso-07"],
    ["Reparar", "Proceso · paso 08", "index.html#paso-08"],
    ["Reciclar", "Proceso · paso 09", "index.html#paso-09"],
    ["Almacén y transporte", "Proceso · paso 10", "index.html#paso-10"],
    ["Informe al cliente", "Proceso · paso 11", "index.html#paso-11"],
    ["Zona de demostración", "Proceso · paso 12", "index.html#paso-12"],
    ["Contador público (demostración)", "Portada", "index.html#contador-title"],
    ["Cómo funciona", "Página", "como-funciona.html"],
    ["El recorrido de una batería", "Cómo funciona", "como-funciona.html#recorrido-title"],
    ["Los tres destinos", "Cómo funciona", "como-funciona.html#destinos-title"],
    ["Cómo se decide: estado de salud (SoH)", "Cómo funciona", "como-funciona.html#decision-title"],
    ["La estación", "Página", "la-estacion.html"],
    ["Siete zonas", "La estación", "la-estacion.html#zonas-title"],
    ["Seguridad", "La estación", "la-estacion.html#seguridad-title"],
    ["Quién trabaja aquí", "La estación", "la-estacion.html#personal-title"],
    ["Pasaporte de batería", "Página", "pasaporte.html"],
    ["Qué guarda el pasaporte", "Pasaporte", "pasaporte.html#que-title"],
    ["Reglamento (UE) 2023/1542: fechas", "Pasaporte", "pasaporte.html#fechas-title"],
    ["Simulador de pasaporte", "Pasaporte", "pasaporte.html#simulador"],
    ["Impacto", "Página", "impacto.html"],
    ["Tres pilares", "Impacto", "impacto.html#pilares-title"],
    ["Las 4R", "Impacto", "impacto.html#r-title"],
    ["Objetivos de Desarrollo Sostenible", "Impacto", "impacto.html#ods-title"],
    ["Objetivos SMART del primer año", "Impacto", "impacto.html#smart-title"],
    ["El proyecto", "Página", "proyecto.html"],
    ["Grupos de interés", "El proyecto", "proyecto.html#grupos"],
    ["Cómo se financia", "El proyecto", "proyecto.html#financiacion"],
    ["Riesgos y soluciones", "El proyecto", "proyecto.html#riesgos"],
    ["Preguntas frecuentes", "El proyecto", "proyecto.html#preguntas"],
    ["Fuentes", "El proyecto", "proyecto.html#fuentes"],
    ["Pedir cita", "Página", "cita.html"],
    ["Baterías aceptadas", "Pedir cita", "cita.html#aceptadas"],
  ].map(([t, where, url]) => ({ t, where, url }));

  if (dialog && input && list && typeof dialog.showModal === "function") {
    const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const arrow = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    let results = [];
    let sel = 0;

    // Resalta lo buscado sin perder tildes en el texto mostrado
    const mark = (text, q) => {
      if (!q) return esc(text);
      const i = fold(text).indexOf(q);
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
    };

    const render = () => {
      const q = fold(input.value.trim());
      results = q ? INDEX.filter((r) => fold(`${r.t} ${r.where}`).includes(q)) : INDEX;
      sel = Math.min(sel, Math.max(0, results.length - 1));
      if (!results.length) {
        list.innerHTML = `<li class="palette__empty" role="presentation">Nada con «${esc(input.value.trim())}». Prueba con «cita», «SoH» o «cuarentena».</li>`;
        input.removeAttribute("aria-activedescendant");
        return;
      }
      list.innerHTML = results
        .map(
          (r, i) =>
            `<li class="palette__item" role="option" id="pal-${i}" aria-selected="${i === sel}" data-i="${i}"><span>${mark(r.t, q)}<small>${esc(r.where)}</small></span>${arrow}</li>`
        )
        .join("");
      input.setAttribute("aria-activedescendant", `pal-${sel}`);
    };

    const select = (i) => {
      sel = (i + results.length) % results.length;
      list.querySelectorAll(".palette__item").forEach((el, k) => el.setAttribute("aria-selected", String(k === sel)));
      input.setAttribute("aria-activedescendant", `pal-${sel}`);
      list.querySelector(`#pal-${sel}`)?.scrollIntoView({ block: "nearest" });
    };

    const go = (i) => {
      const r = results[i];
      if (!r) return;
      dialog.close();
      window.location.href = r.url;
    };

    const openPalette = () => {
      if (dialog.open) return;
      setOpen(false);
      input.value = "";
      sel = 0;
      render();
      dialog.showModal();
      input.focus();
    };

    input.addEventListener("input", () => {
      sel = 0;
      render();
    });

    input.addEventListener("keydown", (e) => {
      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        select(sel + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        select(sel - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(sel);
      }
    });

    list.addEventListener("click", (e) => {
      const li = e.target.closest(".palette__item");
      if (li) go(Number(li.dataset.i));
    });

    list.addEventListener("pointermove", (e) => {
      const li = e.target.closest(".palette__item");
      if (li && Number(li.dataset.i) !== sel) select(Number(li.dataset.i));
    });

    // Clic en el fondo: cierra
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });

    document.querySelectorAll("[data-palette-open]").forEach((b) => b.addEventListener("click", openPalette));

    document.addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      } else if (e.key === "/" && !typing && !dialog.open) {
        e.preventDefault();
        openPalette();
      }
    });
  } else {
    // Sin <dialog>: el botón de búsqueda no tendría efecto
    document.querySelectorAll(".menu-card--search").forEach((el) => (el.hidden = true));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && isOpen()) setOpen(false, true);
  });
})();
