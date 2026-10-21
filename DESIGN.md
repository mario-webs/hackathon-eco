---
name: Estación SegundaVida
description: Estación de barrio que diagnostica baterías gastadas; la web es una noche de planta con la estación construida en 3D en tiempo real.
colors:
  paper: "#0a0d0c"
  paper-2: "#0e1311"
  paper-3: "#25302b"
  white: "#121916"
  white-2: "#18211d"
  graphite: "#060807"
  graphite-3: "#1c2521"
  ink: "#eef2ee"
  ink-2: "#b3bdb7"
  ink-3: "#8b968f"
  on-dark-2: "#a9b3ad"
  line: "rgba(238, 242, 238, 0.09)"
  line-strong: "rgba(238, 242, 238, 0.18)"
  accent: "#3ddc84"
  accent-hover: "#6be8a3"
  accent-ink: "#5fe39b"
  accent-soft: "rgba(61, 220, 132, 0.12)"
  on-accent: "#03140a"
  amber: "#f2a93b"
  amber-ink: "#f6bd68"
  amber-soft: "rgba(242, 169, 59, 0.12)"
  red: "#ff5a4e"
  red-ink: "#ff877d"
  red-soft: "rgba(255, 90, 78, 0.12)"
  hv-orange: "#ff6a13"
typography:
  display:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.375rem, 1.1rem + 4.1vw, 5.25rem)"
    fontWeight: 350
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 4.4vw, 5.75rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.038em"
  headline-section:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.125rem, 1.4rem + 2.8vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.038em"
  title:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.375rem, 1.2rem + 0.8vw, 1.875rem)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title-sm:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.1875rem, 1.1rem + 0.35vw, 1.375rem)"
    fontWeight: 450
    lineHeight: 1.18
    letterSpacing: "-0.015em"
  numeral:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(3.5rem, 2rem + 6vw, 7.5rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.05em"
  lead:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.125rem, 1.02rem + 0.4vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Host Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1
  data:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  cell: "4px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
  s-8: "4rem"
  s-9: "6rem"
  gutter: "clamp(1rem, 0.5rem + 2.4vw, 2.5rem)"
  section-y: "clamp(5rem, 3rem + 7vw, 11rem)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "3.125rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.on-accent}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "3.125rem"
  button-sm:
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  pill:
    backgroundColor: "{colors.white-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.05rem"
    height: "2.75rem"
  pill-hover:
    backgroundColor: "{colors.graphite-3}"
  pill-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    height: "2.75rem"
  pill-open:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag-ok:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "0.25em 0.7em"
  tag-weak:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.pill}"
    padding: "0.25em 0.7em"
  tag-bad:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red-ink}"
    rounded: "{rounded.pill}"
    padding: "0.25em 0.7em"
  tag-demo:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.25em 0.7em"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2rem"
  panel-stage:
    backgroundColor: "{colors.paper-2}"
    rounded: "{rounded.lg}"
  menu-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.md}"
    width: "23rem"
  palette:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    width: "40rem"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
    height: "3rem"
  choice:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  choice-checked:
    backgroundColor: "{colors.accent-soft}"
  closing-panel:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.lg}"
---

# Design System: Estación SegundaVida

## Overview

**Creative North Star: "La planta de noche"**

Una nave de barrio vista de noche, con las luces de trabajo encendidas: fondo casi negro con un matiz verde, paneles un punto más claros, texto claro y un único verde eléctrico que marca la acción, la ruta de la batería y el estado sano. Es el canon de la categoría cleantech, elegido por el usuario, ejecutado con el listón de un estudio 3D (Lusion): la pieza central no es una foto con velo sino la estación construida en Three.js en tiempo real, que la cámara recorre con el scroll siguiendo a una batería desde la furgoneta hasta su destino.

La densidad es baja y la escala alta. Los titulares son grandes, ligeros y de interletraje cerrado; los datos, el HUD, las teclas y los códigos van en monoespaciada pequeña. Todo lo interactivo es píldora, todo lo que contiene es panel redondeado, y las reglas de 1 px llevan cruces de registro en sus extremos, como un plano de montaje. El ámbar y el rojo existen solo para seguridad y daño; nunca decoran.

La honestidad es visible: cada afirmación lleva su procedencia (cuadrado relleno = documento del proyecto, cuadrado en contorno = práctica del sector), los datos ficticios llevan el chip «Demostración» y cada imagen o modelo lleva «Imagen ilustrativa» o «Modelo 3D ilustrativo». El plano en papel claro del mundo anterior está descartado.

**Key Characteristics:**
- Fondo noche de planta y capas tonales en vez de sombras para separar planos.
- Un solo acento: verde eléctrico; ámbar y rojo reservados a seguridad y daño.
- Host Grotesk ligera a gran tamaño; JetBrains Mono solo para datos, HUD, teclas y códigos.
- Píldoras para acciones, paneles de 16–24 px, cruces sobre reglas de 1 px.
- Firma 3D en tiempo real (estación y pack) con postproceso cinematográfico y renders fijos como respaldo.
- Marcas de procedencia y de demostración siempre presentes.

## Colors

Una paleta casi monocroma de verdes-negro con un solo acento eléctrico y dos colores de seguridad que solo aparecen cuando hay riesgo.

### Primary
- **Verde eléctrico** (accent): botón y píldora principales, ruta activa, estado sano (SoH correcto), LED y rótulos del 3D, punto de página actual, relleno de la barra de lectura y del HUD, panel de cierre a sangre. Sobre él, el texto siempre es **Tinta de cierre** (on-accent), nunca blanco.
- **Verde encendido** (accent-hover): estado hover del verde.
- **Verde lectura** (accent-ink): verde de texto sobre fondo oscuro (números de paso, coincidencias de búsqueda, etiqueta sana).
- **Velo verde** (accent-soft): fondo de etiquetas sanas, opción marcada, sala activa del plano, anillo de foco de campos.
- **Tinta de cierre** (on-accent): texto y botones sobre el panel verde.

### Secondary
- **Ámbar de seguridad** (amber, amber-ink, amber-soft): cuarentena, alta tensión, estado débil, avisos de seguridad, ruta discontinua. Solo seguridad.

### Tertiary
- **Rojo de daño** (red, red-ink, red-soft): celda dañada, estado malo, errores de formulario, destino reciclaje (ruta punteada). Solo daño y error.
- **Naranja alta tensión** (hv-orange): exclusivo del modelo 3D (conectores y cableado HV del pack), donde reproduce el color normativo del cableado real. No se usa en la interfaz.

### Neutral
- **Noche de planta** (paper): fondo de página y color de borrado del 3D y de la niebla.
- **Noche de escenario** (paper-2): fondo de los paneles que contienen 3D y de las secciones alternas.
- **Rejilla** (paper-3): celdas apagadas, pista de barras de progreso, scrollbar.
- **Panel** (white): tarjetas, menú, paleta, tablas, campos, avisos. El nombre heredado «white» designa un panel oscuro elevado.
- **Panel alto** (white-2): segundo nivel (píldoras, cabeceras de tabla, elemento seleccionado, hover de menú).
- **Grafito** (graphite) y **Grafito hover** (graphite-3): pie de página y hover de píldoras e indicador deslizante.
- **Tinta** (ink): texto principal. **Tinta media** (ink-2): entradillas, texto secundario. **Tinta baja** (ink-3): metadatos, rótulos de tabla, cruces. **Pie** (on-dark-2): texto del pie.
- **Regla** (line) y **Regla marcada** (line-strong): bordes de 1 px de paneles, tablas, campos y reglas.

### Named Rules
**The One Voice Rule.** El verde eléctrico es el único acento. Si algo es verde, es acción, ruta o estado sano; nunca un adorno.

**The Safety Color Rule.** Ámbar y rojo solo aparecen para seguridad, cuarentena, alta tensión, daño y error, en la interfaz y en el 3D. Un ámbar decorativo apaga la señal cuando hace falta.

**The Dark Text On Green Rule.** Todo texto sobre verde es Tinta de cierre (on-accent). El blanco sobre verde eléctrico no alcanza contraste.

## Typography

**Display Font:** Host Grotesk (con system-ui, -apple-system, Segoe UI)
**Body Font:** Host Grotesk (misma familia, pesos 300–600 cargados)
**Label/Mono Font:** JetBrains Mono (con ui-monospace, Cascadia Mono), pesos 400 y 500

**Character:** Una grotesca contemporánea usada ligera y enorme, con interletraje negativo, frente a una monoespaciada técnica pequeña que solo habla en cifras y claves. El contraste es de escala y de función, no de familias decorativas.

### Hierarchy
- **Display** (350, hasta 5.25rem, 0.98, -0.045em): solo el titular del hero de portada, máximo 15ch.
- **Headline** (400, hasta 5.75rem, 1, -0.038em): h1 de páginas interiores, máximo 16ch, `text-wrap: balance`.
- **Headline de sección** (400, hasta 4rem, 1, -0.038em): h2 de sección; el cierre lo sube a 5rem.
- **Title** (400, hasta 1.875rem, 1.18, -0.025em): h3 de fichas y pasos.
- **Title pequeño** (450, hasta 1.375rem, 1.18): h4 y resúmenes de acordeón (estos a 400).
- **Numeral** (300, hasta 7.5rem, -0.05em): cifras grandes del contador de demostración; la unidad baja a mono.
- **Lead** (400, hasta 1.3125rem, 1.5): entradillas en Tinta media, máximo 56ch (44ch en el hero).
- **Body** (400, 1.0625rem, 1.6): texto corrido, máximo 66ch.
- **Label** (500, 0.9375rem; 0.8125rem en rótulos pequeños): botones, píldoras, enlaces de navegación, cabeceras de tabla. Sin mayúsculas, sin interletraje abierto.
- **Data** (JetBrains Mono 400, 0.75rem, cifras tabulares): HUD «05 / 12», porcentaje de la barra de lectura, teclas, códigos de zona Z1–Z7, cabeceras de tarjeta del menú, títulos de columna del pie.

### Named Rules
**The Light At Scale Rule.** Cuanto más grande el texto, más ligero (300–400) y más cerrado el interletraje. Nada de negritas en titulares.

**The Mono Is Data Rule.** JetBrains Mono solo para cifras, HUD, teclas y códigos. Nunca para titulares, párrafos ni etiquetas de sección decorativas.

## Layout

Contenedor de 86rem con margen lateral fluido (gutter, de 1rem a 2.5rem) y ritmo vertical de sección amplio (section-y, de 5rem a 11rem). Escala de espacio en base 4 (s-1 a s-9). Las cabeceras de sección son una rejilla de hasta 52rem; el texto corrido no pasa de 66ch.

La barra superior es flotante y transparente; al bajar aparece un velo con desenfoque. Marca a la izquierda, grupo de enlaces centrado a partir de 88rem, y a la derecha la barra de lectura en forma de batería, la píldora verde «Pedir cita» y la píldora «Menú».

El hero es un panel a casi todo el ancho (24 px de radio, alto hasta 60rem) con el 3D a sangre dentro; el titular abajo a la izquierda y la entradilla con botones a la derecha a partir de 64rem; bajo el panel, una regla con cruces.

La estación de portada se fija mientras las fichas de paso (pcard) pasan por encima en escritorio; por debajo de 64rem el escenario ocupa 52svh arriba y las fichas suben por debajo. Las cabeceras interiores usan dos columnas 1.25fr / 1fr a partir de 60rem. Las tablas se convierten en fichas por debajo de 40rem. Móvil desde 360 px: «Pedir cita» se acorta a «Cita» y la barra de lectura desaparece por debajo de 26rem.

Con movimiento reducido o sin WebGL2 no hay 3D: la estación se muestra como plano 2D estático y las fichas en una sola columna de hasta 44rem.

## Elevation & Depth

Sistema híbrido. La profundidad de la interfaz se construye con capas tonales (noche de planta, noche de escenario, panel, panel alto) y bordes de 1 px translúcidos. Las sombras son suaves, con desplazamiento y desenfoque, y se reservan a lo que flota sobre el contenido: tarjetas del menú, paleta, fichas que pasan sobre el escenario 3D y la tarjeta del pasaporte. Los elementos que flotan sobre el 3D (velo de barra, grupo de enlaces, anotaciones, HUD, etiqueta de estado) usan vidrio oscuro: fondo verde-negro al 78–88 % con `backdrop-filter: blur(8–16px)`.

La profundidad real la pone el 3D, con reglas propias de material y luz.

### Shadow Vocabulary
- **Elevación media** (`box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -12px rgba(0,0,0,0.6)`): fichas en móvil sobre el escenario.
- **Elevación alta** (`box-shadow: 0 2px 8px rgba(0,0,0,0.45), 0 32px 64px -20px rgba(0,0,0,0.75)`): tarjetas del menú, paleta, fichas de paso en escritorio, tarjeta del pasaporte.
- **Velo de menú** (`rgba(3,5,4,0.62)` con `blur(6px)`): cubre la página con el menú abierto; la paleta usa `rgba(3,5,4,0.6)` con `blur(4px)`.

### Material y luz del 3D
- **Renderizado:** WebGL2, mapeo tonal ACES Filmic con exposición 1.0, salida sRGB, sombras PCF suaves, fondo y niebla en Noche de planta (niebla de 38 a 95 m en la estación).
- **Postproceso:** MSAA ×4 en media precisión, oclusión ambiental GTAO (desactivada en equipos modestos), bloom de umbral alto (umbral 2.4, fuerza 0.45–0.55) para que solo brille lo que emite: LED, pantallas y rutas, nunca la pintura blanca.
- **Entorno:** RoomEnvironment en PMREM para los reflejos.
- **Luces:** estación con hemisférica fría tenue (0.32), sol cálido direccional (2.9) y relleno verdoso (0.5). Pack del hero en estudio: clave blanca (2.6), contraluz verde eléctrico (1.8), foco cálido (6) y hemisférica tenue (0.25).
- **Materiales físicos con texturas procedurales:** hormigón, asfalto y paredes muy rugosos (0.88–0.96); aluminio cepillado y acero con vetas en la rugosidad; carcasa del pack oscura con barniz; cobre metálico; celdas azul profundo con barniz; vidrio, placas solares y pintura de furgoneta con barniz alto; caucho y plásticos mate.
- **Emisivos:** LED verde (intensidad 7), LED rojo de celda dañada (6), luz de trabajo cálida (3.2). Solo los emisivos producen bloom.
- **Rótulos y pantallas:** texturas de canvas sin mapeo tonal (`toneMapped: false`), en Tinta con tinte verde.

### Named Rules
**The Tonal Layer Rule.** En la interfaz, la profundidad es tono y borde de 1 px; la sombra solo para lo que flota sobre el contenido.

**The Only Emitters Glow Rule.** El bloom tiene umbral alto: brillan LED, pantallas y rutas. Si brilla una superficie pintada, la luz está mal.

**The Normative Color Rule.** En el 3D, el color de las piezas sigue al objeto real (cableado HV naranja, etiqueta clase 9, chalecos y cascos de seguridad); el verde de marca solo entra como luz, LED, ruta y rótulo.

## Shapes

Dos geometrías conviven. Las acciones y los chips son píldoras completas (999px): botones, píldoras de barra, etiquetas, opciones, anotaciones, etiqueta de estado. Los contenedores son paneles redondeados: 16 px para fichas, tarjetas de menú, tablas, avisos y HUD; 24 px para paneles que contienen 3D, la paleta, el cierre verde, la tarjeta del pasaporte y las imágenes de cabecera. 10 px para elementos internos (filas de menú, campos, imágenes en fichas). 4 px para celdas y foco.

Las reglas son de 1 px; las listas de datos usan regla discontinua. Las cruces de registro son trazos de 1 px de 14 px de lado en Tinta baja, en las esquinas del escenario 3D. Las marcas de procedencia son cuadrados de 0.6–0.7rem con 2 px de radio: relleno en Tinta para documento del proyecto, contorno de 1.5 px para práctica del sector. Las celdas de batería (barra de lectura, medidores, marcador de lista) repiten el motivo del módulo con esquinas de 1–3 px.

## Components

### Buttons
Píldoras firmes, sin mayúsculas, con flecha que avanza 3 px al pasar el puntero.
- **Shape:** píldora completa (999px), alto 3.125rem (2.75rem en tamaño pequeño).
- **Primary:** fondo Verde eléctrico, texto Tinta de cierre, 500, padding 0 1.5rem.
- **Hover / Focus:** hover a Verde encendido (200 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`); pulsado escala 0.97; foco con doble anillo (2 px fondo + 2 px verde).
- **Ghost:** transparente con borde Regla marcada y texto Tinta; hover sube el borde a Tinta media y añade un velo blanco al 5 %.
- **Sobre el cierre verde:** el principal se invierte (fondo Tinta de cierre, texto verde) y el fantasma usa borde Tinta de cierre al 40 %.

### Píldoras de barra
- **Style:** Panel alto con borde Regla, alto 2.75rem, 500. «Pedir cita» en verde con punto; «Menú» con dos puntos que se juntan al abrir y se invierte a fondo Tinta.
- **Barra de lectura:** píldora con una batería de 10 celdas que se llena en verde con el progreso de lectura y su porcentaje en mono.

### Chips
- **Etiquetas de estado:** píldora 0.8125rem, 600, con punto del color del estado. Sana: velo verde y Verde lectura. Débil: velo ámbar. Mala: velo rojo. Neutra: Panel alto con Tinta media.
- **«Demostración»:** invertida (fondo Tinta, texto Noche de planta) con punto verde. Obligatoria junto a cualquier dato ficticio.
- **Opciones de formulario:** píldora con casilla cuadrada (radio redondo); marcada pasa a borde verde y velo verde.

### Cards / Containers
- **Corner Style:** 16 px (fichas, tablas, avisos), 24 px (escenarios y panel de cierre).
- **Background:** Panel; cabeceras y filas seleccionadas en Panel alto.
- **Shadow Strategy:** ninguna en reposo; Elevación alta solo cuando flota (ver Elevation & Depth).
- **Border:** 1 px Regla; fichas de paso y avisos con Regla marcada; ficha de seguridad con borde ámbar al 55 %.
- **Internal Padding:** 1.5rem (s-5) en fichas; 2rem (s-6) en placas a partir de 40rem.
- **Avisos:** Demostración (Panel alto, icono verde), Seguridad (velo ámbar), Peligro (velo rojo).
- **Pie de imagen:** «Imagen ilustrativa» o «Modelo 3D ilustrativo» en píldora oscura al 72 %, 0.6875rem, abajo a la derecha.

### Inputs / Fields
- **Style:** Panel, borde 1 px Regla marcada, 10 px de radio, alto 3rem, cursor verde.
- **Focus:** borde verde y anillo de 3 px en Velo verde.
- **Error / Disabled:** borde y mensaje en Rojo lectura (red-ink), 550.

### Navigation
- **Grupo de enlaces (≥ 88rem):** píldora de vidrio oscuro con enlaces en Tinta media; un indicador Grafito hover se desliza bajo el enlace señalado (320 ms) y la página actual lleva un punto verde de 4 px.
- **Menú:** la píldora «Menú» despliega tarjetas apiladas (Panel, 16 px, Elevación alta) que entran escalonadas cada 45 ms: índice numerado 1–8 con teclas, tarjeta de búsqueda con «Ctrl K», y nota «Propuesta académica» con punto ámbar. Detrás, un velo oscuro con desenfoque. Sin JS, el menú es una lista visible.
- **Paleta (Ctrl K o «/»):** diálogo de 40rem y 24 px de radio, campo de 3.75rem, resultados agrupados, seleccionado en Panel alto con icono verde, pie con teclas.
- **Teclas:** kbd en mono 0.75rem sobre Noche de planta, borde Regla marcada con base de 2 px, 6 px de radio.

### Estación 3D (firma)
Escena Three.js en tiempo real dentro de un panel de 24 px con cruces en las esquinas. Trece paradas de cámara guiadas por el scroll (la estación, llega la batería, recepción, inspección, cuarentena, diagnóstico, decisión, reutilizar, reparar, reciclar, almacén y transporte, informe, zona de demostración). Una batería en carro recorre la ruta; en el diagnóstico los módulos se despiezan. Las rutas de destino se distinguen por color y trazo: continua verde (segunda vida), discontinua ámbar (cuarentena y reparación), punteada roja (reciclaje). Siete zonas con código Z1–Z7 rotuladas en el suelo. El HUD (vidrio oscuro, 16 px) muestra «05 / 12» en mono verde, el nombre del paso y una barra de 2 px; una etiqueta de estado en píldora sigue a la batería y cambia su punto a verde, ámbar o rojo.

### Pack del hero (firma)
Pack de tracción en 3D (bandeja, módulos, pletinas de cobre, cableado HV naranja, BMS) que gira despacio y responde al puntero, con anotaciones ancladas a puntos del modelo: píldoras de vidrio con punto verde y halo, visibles a partir de 64rem.

### Respaldo sin 3D
Renders fijos de la propia escena (hero-pack.jpg, estacion.jpg) sustituyen al canvas cuando no hay WebGL2 o el movimiento está reducido. En la estación de portada, el respaldo es el plano 2D: rejilla de 40 px, muros en Tinta, zonas con código mono, banda ignífuga rayada en ámbar, salas que se encienden en velo verde (ámbar en cuarentena).

## Do's and Don'ts

### Do:
- **Do** usar el Verde eléctrico solo para acción, ruta activa y estado sano, con texto Tinta de cierre encima.
- **Do** separar planos con capas tonales (paper, paper-2, white, white-2) y bordes de 1 px; sombra solo en lo que flota.
- **Do** componer titulares en Host Grotesk 300–400 con interletraje entre -0.025em y -0.05em.
- **Do** poner cifras, HUD, teclas y códigos en JetBrains Mono con cifras tabulares.
- **Do** dar a cada acción forma de píldora y a cada contenedor 16 o 24 px de radio.
- **Do** marcar la procedencia: cuadrado relleno para documento del proyecto, cuadrado en contorno para práctica del sector.
- **Do** acompañar cualquier dato ficticio con el chip «Demostración» y cada imagen o modelo con «Imagen ilustrativa» o «Modelo 3D ilustrativo».
- **Do** enmarcar el 3D en paneles redondeados con cruces de 1 px en las esquinas y dar un render fijo o el plano 2D como respaldo.
- **Do** mantener el bloom con umbral alto y los materiales físicos con rugosidad procedural; el verde de marca entra en el 3D como luz, LED y ruta.

### Don't:
- **Don't** usar ámbar o rojo para decorar, destacar o variar: son seguridad y daño.
- **Don't** volver al plano técnico en papel claro, a Geist ni al verde #2c6a4d del mundo descartado.
- **Don't** poner un hero de foto con velo; el hero es el pack en 3D o su render.
- **Don't** usar la monoespaciada para titulares, párrafos o etiquetas de sección.
- **Don't** poner texto blanco sobre el verde eléctrico.
- **Don't** usar sombras duras sin desenfoque ni bloques planos desplazados.
- **Don't** usar botones rectangulares ni paneles de esquina viva.
- **Don't** mostrar 3D, scroll suave ni fijado con `prefers-reduced-motion: reduce`.
