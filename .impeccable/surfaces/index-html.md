---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["como-funciona.html","la-estacion.html","pasaporte.html","impacto.html","proyecto.html","cita.html"]
---

Scope: whole multi-page site (index + 6 pages), replacement visual world. Mode: Persuade (index, cita), Read (como-funciona, la-estacion, pasaporte, impacto, proyecto). Build path: code-led (no image generation).
Audience: ciudadano y pequeño taller con batería gastada; tribunal académico. Action: pedir cita / entender el recorrido. Proof: documento del proyecto; datos de demo etiquetados.
Quality bar (user-chosen, 2026-10-21): Lusion (lusion.co). Refs captured in .impeccable/refs/ (sheet-lusion2.jpg, sheet-igloo.jpg, sheet-amp.jpg).
User asks: mapa 3D real recorrido con scroll (entrega y transporte de la batería, todo el proceso, a detalle); diseño único y realista, nada básico; menú superior más elaborado, "hecho por un programador"; Three.js en tiempo real; rediseño de toda la web.

## Direction contract
THESIS: El estándar cleantech, ejecutado al nivel de un estudio 3D: una web oscura y precisa cuya pieza central es la estación construida en 3D en tiempo real, que la cámara recorre con el scroll siguiendo a una batería desde la furgoneta hasta su destino. Rechaza el plano técnico en papel anterior y cualquier hero de foto con velo.
OWN-WORLD: Noche de planta #0A0D0C con capas #111614 / #18201C, texto #F2F4F1 y #9AA59F, un verde eléctrico #3DDC84 para acción, ruta y estado sano; ámbar #F2A93B y rojo #FF5A4E solo para seguridad y daño. Host Grotesk ligera (300–400) a gran tamaño, JetBrains Mono para datos, HUD y atajos. Botones píldora; paneles de 20 px de radio; marcas de cruz «+» sobre reglas de 1 px; 3D enmarcado en paneles redondeados.
STORY: Ve la batería en 3D y la frase → recorre la estación en 3D paso a paso (furgoneta, recepción, inspección, cuarentena, diagnóstico con despiece, decisión, tres destinos, informe) → pasaporte → contador de demostración → pide cita.
FIRST VIEWPORT: Barra superior: marca a la izquierda, chip de estado en mono, píldora verde «Pedir cita» y píldora «Menú». Debajo, panel redondeado a casi todo el ancho con la batería de tracción en 3D (módulos, conectores naranjas de alta tensión) que gira con el puntero; titular grande y ligero superpuesto abajo a la izquierda; entradilla y botones a la derecha; bajo el panel, regla con cruces y «Desliza para recorrer la estación».
FORM: Canon de la categoría (elegido por el usuario en la página de decisión). Seed: cccc5481. Interacción firma: escena Three.js de la estación, cámara por fotogramas clave guiada por el scroll, batería en carro que viaja por la ruta, despiece de módulos en el diagnóstico, rutas de destino con trazo distinto (continua, discontinua, punteada), fichas y HUD. Menú: píldora que despliega tarjetas apiladas con índice numerado, atajos de teclado y paleta de comandos (Ctrl K).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
