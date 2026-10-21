# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no build step, served by any simple static server. CDN libraries allowed only with pinned versions: GSAP + ScrollTrigger, Lenis, Three.js. Nothing else without asking the user.

## Users

- Ciudadanos con coche, moto, bici o patinete eléctrico que tienen una batería gastada y no saben dónde llevarla.
- Pequeños talleres, concesionarios y empresas de reparto con flota de bicis y patinetes.
- Tribunal y compañeros de la defensa académica (JOYFE Centro Profesional, módulo Sostenibilidad aplicada al sistema productivo): leen la web para evaluar la propuesta.

## Product Purpose

Estación SegundaVida es una estación de barrio donde se deja una batería gastada, se escanea su pasaporte digital, se mide su estado de salud (SoH) y se decide su destino en orden: reutilizar → reparar → reciclar. Todo en menos de una semana, con informe al cliente. La web explica la idea, deja pedir cita y simula el escaneo del pasaporte.

## Positioning

Diagnostica cada batería en vez de solo recogerla; cercana al ciudadano y al pequeño taller (sobre todo bicis y patinetes); lee el pasaporte digital obligatorio en la UE desde el 18 de febrero de 2027 (Reglamento UE 2023/1542).

## Capabilities and Constraints

- Fuente de verdad única: `Estación de segunda vida de baterías.docx`. No inventar datos, cifras, nombres ni acuerdos.
- Umbrales de SoH: el documento no los fija. Se muestran como umbrales que la estación fija y explica al cliente; cualquier número es ejemplo ficticio.
- Sin backend: cita y simulador son demostraciones en cliente.
- Servicio gratuito para el ciudadano. Ingreso principal: armarios de segunda vida. Sin cifras económicas.

## Brand Commitments

- Nombre: Estación SegundaVida.
- Frase principal: «Una batería que ya no vale para mover un coche todavía puede guardar energía durante años.»
- Tono: cercano, claro y serio, español de España. Sin lenguaje de venta exagerado.

## Evidence on Hand

- Documento del proyecto (tablas de reglamento, destinos, grupos de interés, pilares, ODS, SMART, KPIs, riesgos, FAQ, 5 fuentes con URL).
- No hay datos reales de funcionamiento, clientes ni fotos. El contador público y el simulador usan datos ficticios etiquetados como demostración.

## Product Principles

1. Honestidad: es una propuesta sin probar; objetivos como «objetivo» / «propuesta», nunca como resultados.
2. Seguridad primero: cuarentena, alta tensión y litio siempre visibles y en su color propio.
3. El orden importa: reutilizar antes que reparar, reparar antes que reciclar.
4. El contenido se lee sin JS: el movimiento acompaña, no sostiene.

## Accessibility & Inclusion

WCAG 2.2 AA, teclado completo, enlace saltar al contenido, `prefers-reduced-motion` desactiva scroll suave, pinning y 3D. Móvil desde 360 px.
