// Recorrido: marca el paso activo y llena la línea del diagrama con el scroll.
// Sin GSAP o con "reducir movimiento" no hace nada: todo queda visible.

(() => {
  const wrap = document.querySelector("[data-journey]");
  if (!wrap || !document.documentElement.classList.contains("motion")) return;

  const run = () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const steps = [...wrap.querySelectorAll(".jstep")];
    const nodes = [...wrap.querySelectorAll("[data-node]")];
    const fill = wrap.querySelector("[data-flow-fill]");

    const setActive = (n) => {
      steps.forEach((s) => s.classList.toggle("is-on", Number(s.dataset.step) === n));
      nodes.forEach((g) => g.classList.toggle("is-on", Number(g.dataset.node) <= n));
    };

    steps.forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 60%",
        end: "bottom 60%",
        onToggle: (self) => self.isActive && setActive(Number(step.dataset.step)),
      });
    });

    if (fill) {
      // La línea se llena de forma continua con un pequeño retraso (scrub)
      gsap.fromTo(
        fill,
        { "--fill": 0 },
        {
          "--fill": 1,
          ease: "none",
          scrollTrigger: { trigger: wrap.querySelector(".journey__steps"), start: "top 60%", end: "bottom 70%", scrub: 0.6 },
        }
      );
    }
    setActive(1);
  };

  if (window.SV && window.SV.scrollReady) run();
  else document.addEventListener("sv:scroll-ready", run, { once: true });
  // Si Lenis no cargó, scroll.js no avisa; probamos igualmente al cargar
  window.addEventListener("load", () => !(window.SV && window.SV.scrollReady) && run(), { once: true });
})();
