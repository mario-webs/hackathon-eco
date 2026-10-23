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

  // Si el usuario activa "reducir movimiento" con la página abierta
  reduced.addEventListener("change", (e) => {
    if (e.matches) {
      root.classList.remove("motion");
      items.forEach((el) => el.classList.add("is-in"));
    }
  });

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
