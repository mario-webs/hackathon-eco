// Plano: al pasar por una zona de la lista (o por el plano) se marcan las dos.

(() => {
  const wrap = document.querySelector("[data-plan]");
  if (!wrap) return;

  const items = wrap.querySelectorAll(".zones [data-zone]");
  const zones = wrap.querySelectorAll(".plan [data-zone]");

  const set = (id) => {
    items.forEach((el) => el.classList.toggle("is-on", el.dataset.zone === id));
    zones.forEach((el) => el.classList.toggle("is-on", el.dataset.zone === id));
  };

  [...items, ...zones].forEach((el) => {
    el.addEventListener("pointerenter", () => set(el.dataset.zone));
    el.addEventListener("pointerleave", () => set(null));
  });
})();
