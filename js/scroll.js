// Scroll suave (Lenis) sincronizado con GSAP ScrollTrigger.
// Un solo reloj: gsap.ticker mueve Lenis; Lenis avisa a ScrollTrigger.
// Si falla un CDN o hay "reducir movimiento", no hace nada y la página
// sigue funcionando con el scroll nativo.

window.SV = window.SV || {};

(() => {
  const root = document.documentElement;
  if (!root.classList.contains("motion")) return;
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.SV.lenis = lenis;

    // Los enlaces internos (#) pasan por Lenis
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  window.SV.scrollReady = true;
  document.dispatchEvent(new CustomEvent("sv:scroll-ready"));
})();
