// Filtro de la tabla de grupos de interés. Sin JS la tabla se ve completa
// y el campo de filtro no aparece.

(() => {
  const box = document.querySelector("[data-filter]");
  const table = document.querySelector("[data-filter-table]");
  if (!box || !table) return;

  const input = box.querySelector("input");
  const status = box.querySelector(".filter__status");
  const empty = document.querySelector("[data-filter-empty]");
  const rows = [...table.tBodies[0].rows];
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const texts = rows.map((r) => norm(r.textContent));

  box.hidden = false;

  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    let shown = 0;
    rows.forEach((row, i) => {
      const hit = !q || texts[i].includes(q);
      row.hidden = !hit;
      if (hit) shown++;
    });
    empty.hidden = shown > 0;
    status.textContent = q ? `${shown} de ${rows.length} grupos` : "";
  });
})();
