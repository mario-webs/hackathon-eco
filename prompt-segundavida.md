# Prompt · Web de la Estación SegundaVida

Actúa como diseñador UX/UI senior y desarrollador frontend creativo. Vas a construir la web del proyecto **Estación SegundaVida**, una estación de barrio que da una segunda vida a las baterías de coches, motos, bicis y patinetes eléctricos. La fuente de verdad es el documento `Estación de segunda vida de baterías.docx` de esta carpeta: léelo entero antes de empezar y no inventes datos, cifras, nombres ni acuerdos que no estén ahí.

Trabaja directamente en esta carpeta, creando los archivos. No me devuelvas el código pegado en el chat.

---

## 0. Antes de escribir código: skills

Usa estas skills en este orden. Si una no aplica, dilo en una línea y sigue.

1. **/find-skills** — busca skills que mejoren esta web en concreto (scroll storytelling, Three.js/WebGL, diagramas de proceso, accesibilidad, rendimiento de animaciones). Revisa también las que ya están instaladas y pueden encajar: `design-taste-frontend`, `centered-stage-integrator`, `hyperreal-ui-polish`, `animate`, `animation-performance`, `frontend-ui-engineering`. Dime cuáles vas a usar y por qué antes de instalar nada.
2. **/impeccable** — define la dirección de arte, el sistema de diseño (tokens, tipografía, espaciado, color) y la jerarquía de cada página. Guarda las decisiones en `DESIGN.md`.
3. **/3d-scroll-refiner** — diseña la pieza 3D principal (ver apartado 3).
4. **/scroll-world** — *opcional*. Solo si te lo confirmo, porque genera vídeo con Higgsfield/Monid y **cuesta dinero**. Pregúntame antes. Sin confirmación, haz el recorrido por la estación con scroll + 3D en el navegador.
5. **/emil-design-eng** — pase de detalle al terminar cada página: estados hover/focus/active, curvas y duraciones, microinteracciones, bordes, sombras, ritmo.
6. **/humanizer** — reescribe todos los textos de la web al final. Tono cercano, claro y serio, en español de España. Fuera muletillas de IA, frases de cierre grandilocuentes y lenguaje de venta exagerado.

---

## 1. Idea y tono

- **Qué es:** un punto cercano donde cualquiera deja su batería gastada. Se escanea su pasaporte digital, se mide su estado de salud y se decide su destino: **reutilizar → reparar → reciclar**, en ese orden.
- **Frase principal (hero):** «Una batería que ya no vale para mover un coche todavía puede guardar energía durante años.»
- **Qué la diferencia:** diagnostica cada batería en vez de solo recogerla, está pensada para el ciudadano y el pequeño taller, y lee el pasaporte digital obligatorio en la UE desde el 18 de febrero de 2027.
- **Honestidad:** es una propuesta sin probar en la realidad. Las cifras de objetivos son estimaciones del primer año y la web debe presentarlas así («objetivo», «propuesta»), nunca como resultados.
- **Contexto:** proyecto académico de JOYFE Centro Profesional (módulo de Sostenibilidad aplicada al sistema productivo).

## 2. Dirección visual

Que `/impeccable` cierre la paleta, pero parte de esta idea: **energía que se recarga**.

- Base clara y limpia, con un verde eléctrico/lima como color de "carga" y un ámbar o rojo controlado solo para seguridad y cuarentena. Nada de verde pastel genérico de "eco".
- Tipografía con carácter para titulares y una sans muy legible para texto (Google Fonts).
- **Barra de progreso de lectura en forma de batería** que se carga al hacer scroll.
- Iconografía lineal propia (SVG inline), sin emojis.
- Referencias de calidad: webs premiadas de producto industrial y energía (Awwwards, One Page Love). Busca alguna actual antes de decidir.
- Todos los colores, sombras, radios y duraciones como variables CSS en `:root`. Modo oscuro opcional si no complica.

## 3. Pieza 3D (con /3d-scroll-refiner)

Un pack de baterías en Three.js que acompaña el scroll en la portada:

1. Entra completo y gira despacio.
2. Al bajar, se abre en **vista explosionada**: módulos y celdas separados.
3. Las celdas se colorean según su estado de salud (sanas / débiles / dañadas).
4. Se reagrupan en tres montones, uno por destino: armario de segunda vida, vehículo reparado, reciclaje.

Modelo hecho con geometrías simples (sin descargar modelos pesados). Si el dispositivo es lento o el usuario tiene `prefers-reduced-motion`, sustituye el 3D por una ilustración estática o SVG animado discreto.

## 4. Estructura de archivos

Varias páginas, CSS y JS separados por responsabilidad. Sin build: debe abrirse con un servidor estático simple.

```
/index.html              Portada narrativa (scroll storytelling + 3D)
/como-funciona.html      Recorrido de la batería y los tres destinos
/la-estacion.html        Zonas, seguridad y personal
/pasaporte.html          Pasaporte digital, normativa UE y simulador QR
/impacto.html            Sostenibilidad, ODS, objetivos SMART y KPIs
/proyecto.html           Grupos de interés, financiación, riesgos y FAQ
/cita.html               Pedir cita y baterías aceptadas
/css/tokens.css          Variables de diseño
/css/base.css            Reset, tipografía, layout, utilidades
/css/components.css      Header, botones, tarjetas, tablas, footer
/css/pages/*.css         Estilos propios de cada página
/js/main.js              Menú, navegación, barra-batería, reveals
/js/scroll.js            Lenis + GSAP ScrollTrigger
/js/battery-3d.js        Escena Three.js
/js/passport-sim.js      Simulador de pasaporte
/js/booking.js           Formulario de cita
/assets/                 SVG e imágenes
```

Librerías permitidas, por CDN y con versión fija: GSAP + ScrollTrigger, Lenis, Three.js. Nada más sin preguntarme.

## 5. Contenido por página

Todo el contenido sale del documento. Resúmelo para web, no lo copies en bloque.

**Header común:** logo de SegundaVida, menú a todas las páginas, CTA «Pedir cita», menú móvil accesible.

### index.html — Portada
- Hero con la frase principal, la pieza 3D y dos CTA: «Cómo funciona» y «Pedir cita».
- El problema en 4 bloques que aparecen con el scroll: pierden capacidad pero no mueren · son peligrosas si se gestionan mal · contienen litio, cobalto, níquel y cobre · Europa obliga a cambiar.
- Avance de los tres destinos y del pasaporte digital, con enlace a sus páginas.
- Contador público de kWh reutilizados y kg de materiales recuperados, marcado claramente como **demostración** (aún no hay datos reales).

### como-funciona.html
- Recorrido en 5 pasos, como línea animada y pinned con el scroll: llega la batería → recepción y escaneo del QR → ¿está dañada? (desvío a cuarentena) → diagnóstico → destino e informe al cliente. Todo en menos de una semana.
- Tabla/tarjetas de los **tres destinos** (cuándo, qué se hace, ejemplos de uso) y por qué ese orden.
- Cómo se decide: el estado de salud (SoH) frente a unos umbrales que se explican al cliente.

### la-estacion.html
- Las 7 zonas (recepción, cuarentena, laboratorio, taller de reparación, taller de segunda vida, almacén de salida, zona de demostración) como recorrido por un plano o vista isométrica.
- Seguridad como bloque destacado: formación en alta tensión, detección de temperatura y humo, extinción para litio, almacenamiento separado, transporte homologado, autorización como gestor de residuos.
- Personal: técnico/a en baterías, ayudante (puesto de prácticas de FP), atención al público.

### pasaporte.html
- Qué es el pasaporte de batería («el DNI digital de cada batería»).
- Línea de tiempo del Reglamento (UE) 2023/1542: 18 feb 2027, finales de 2027, 2028 y 2031, con los porcentajes del documento.
- **Simulador:** el usuario elige una batería de ejemplo (o "escanea" un QR ficticio) y ve su ficha, su estado de salud y su destino probable. Datos marcados como ficticios. Incluye el caso de batería anterior a 2027 sin pasaporte.

### impacto.html
- Tres pilares (ambiental, social, económico).
- Las 4R aplicadas.
- ODS 7, 9, 12 y 13 con el motivo de cada uno.
- Objetivos SMART del primer año y tabla de KPIs (indicador, unidad, objetivo, frecuencia), presentados como objetivos.

### proyecto.html
- Grupos de interés (qué aporta y qué gana cada uno), en tarjetas o tabla filtrable.
- Cómo se financia: fuentes de ingresos (la principal, armarios de segunda vida) y gastos. Servicio gratuito para el ciudadano. Sin cifras inventadas.
- Riesgos y soluciones (los 5 del documento) y el límite del proyecto.
- FAQ con las preguntas de la defensa, en acordeón accesible.
- Fuentes con enlaces.

### cita.html
- Formulario: tipo de vehículo, tipo de batería, ¿tiene pasaporte?, ¿está dañada?, fecha preferida y contacto. Si marca "dañada", mostrar aviso de seguridad (no transportarla de cualquier forma).
- Sin backend: valida en cliente y muestra confirmación simulada, avisando de que es una demo.
- Lista de baterías aceptadas.

**Footer común:** JOYFE Centro Profesional, nota de proyecto académico, enlaces a fuentes, aviso de que las cifras son estimaciones.

## 6. Requisitos técnicos

- HTML5 semántico (`header`, `nav`, `main`, `section`, `article`, `footer`), un solo `h1` por página, ARIA solo donde haga falta.
- Accesibilidad WCAG 2.2 AA: contraste, foco visible, navegación por teclado completa, enlace "saltar al contenido", textos alternativos.
- Responsive real (móvil primero, 360 px en adelante), sin scroll horizontal.
- `prefers-reduced-motion`: desactiva scroll suave, pinning y 3D; el contenido debe leerse igual.
- Animaciones solo con `transform` y `opacity`. 60 fps en un portátil normal. Carga diferida del 3D.
- Sin errores en consola. Las páginas funcionan aunque falle un CDN (el contenido nunca depende del JS para verse).

## 7. Cómo trabajar

1. Lee el documento y propón: skills elegidas, dirección de arte y mapa de páginas. **Espera mi visto bueno.**
2. Construye primero la base común (tokens, header, footer, menú) y la portada.
3. Sigue página a página. Al acabar cada una, ábrela en el navegador (Playwright), haz captura en escritorio y móvil y corrige lo que se vea mal.
4. Pase final con `/emil-design-eng` y `/humanizer` sobre todas las páginas.
5. Entrégame un resumen corto: qué hay, cómo abrirlo, qué datos son de demostración y qué ha quedado pendiente.
