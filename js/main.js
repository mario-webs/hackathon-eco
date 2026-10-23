// Barra-batería de lectura, reveals y contadores. El menú vive en nav.js.
// El HTML ya añade .js y .motion en <head>; aquí solo hay comportamiento.

(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Barra de lectura en forma de batería ----------
  const charge = document.querySelector(".charge");
  const chargeN = document.querySelector("[data-charge-n]");
  if (charge) {
    let queued = false;
    const update = () => {
      queued = false;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
      // Se llena por celdas enteras: 10 pasos
      const stepped = Math.round(p * 10) / 10;
      charge.style.setProperty("--p", stepped);
      if (chargeN) chargeN.textContent = `${Math.round(p * 100)} %`;
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  // ---------- Reveals ----------
  const items = document.querySelectorAll("[data-reveal]");
  if (!root.classList.contains("motion") || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));
  }

  // Si el usuario activa "reducir movimiento" con la página abierta.
  // Si lo desactiva, se recarga para que arranquen el scroll suave y las animaciones.
  reduced.addEventListener("change", (e) => {
    if (e.matches) {
      root.classList.remove("motion");
      items.forEach((el) => el.classList.add("is-in"));
    } else {
      location.reload();
    }
  });

  // ---------- Aviso: animaciones del sistema desactivadas ----------
  // Muchos Windows traen apagados los "Efectos de animación" sin que el usuario lo sepa.
  // Sale en cada visita mientras sigan apagados, y se recuerda al llegar a cada parte animada.
  if (reduced.matches) {
    const HOW = "Windows: Configuración → Accesibilidad → Efectos visuales → <b>Efectos de animación</b>. Mac: Accesibilidad → Pantalla → desactiva «Reducir movimiento».";
    const tip = document.createElement("div");
    tip.className = "notice notice--demo motion-tip";
    tip.setAttribute("role", "status");
    const show = (title, text) => {
      tip.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
        <div><strong>${title}</strong>${text} ${HOW}
        <button type="button" class="btn btn--ghost btn--sm">Entendido</button></div>`;
      tip.querySelector("button").addEventListener("click", () => tip.remove());
      document.body.append(tip);
    };
    show(
      "Tu sistema tiene las animaciones desactivadas",
      "Para ver la web completa, con el recorrido animado del proceso, actívalas. La página se actualiza sola al cambiarlo."
    );
    // Partes que dependen de la animación: una vez por parte y visita
    const parts = document.querySelectorAll("[data-station], [data-journey]");
    const pio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          pio.unobserve(entry.target);
          show("Esta parte se ve mejor con animaciones", "Aquí hay un recorrido animado que te estás perdiendo. Actívalas en");
        });
      },
      { rootMargin: "0px 0px -40% 0px" }
    );
    parts.forEach((el) => pio.observe(el));
    reduced.addEventListener(
      "change",
      () => {
        pio.disconnect();
        tip.remove();
      },
      { once: true }
    );
  }

  // ---------- Contadores (data-count) ----------
  const counters = document.querySelectorAll("[data-count]");
  const fmt = new Intl.NumberFormat("es-ES");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (!root.classList.contains("motion")) {
      el.textContent = fmt.format(target);
      return;
    }
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    } else {
      counters.forEach(runCounter);
    }
  }
})();

// Vídeos de la portada: al abrir un apartado empieza su vídeo; al cerrarlo se pausa.
document.querySelectorAll(".videos details").forEach((d) => {
  const video = d.querySelector("video");
  d.addEventListener("toggle", () => {
    if (d.open) video.play().catch(() => {});
    else video.pause();
  });
});
