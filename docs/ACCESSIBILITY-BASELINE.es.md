# Baseline de preparación de accesibilidad

Este documento describe el baseline técnico de accesibilidad de la Fase 9D-4 para Open Travel Platform / Kairoseth Travel.

**No es asesoramiento jurídico, una certificación de accesibilidad ni una afirmación de que los tests automáticos demuestren conformidad WCAG**. La accesibilidad requiere combinar implementación, checks automáticos, pruebas con teclado/tecnologías de apoyo y revisión humana de journeys representativos.

## Fuentes oficiales

- W3C Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/
- Directiva (UE) 2019/882, European Accessibility Act: https://eur-lex.europa.eu/eli/dir/2019/882/oj
- España, Ley 11/2023 sobre requisitos de accesibilidad de determinados productos y servicios: https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022

W3C recomienda WCAG 2.2 como objetivo actual dentro de WCAG 2 y señala que WCAG 2.2 amplía WCAG 2.1 de forma compatible. Por ello la plataforma utiliza **criterios técnicos orientados a WCAG 2.2 AA** para el trabajo nuevo sin afirmar una certificación global.

En España, la Ley 11/2023 incluye expresamente los servicios de comercio electrónico y los sitios web/servicios móviles de agencias de viajes y turoperadores dentro de su ámbito, sujeto a las definiciones, exclusiones y excepciones de la propia ley. Su Título I entró en vigor el 28 de junio de 2025. La misma ley contempla una exención para microempresas prestadoras de servicios y un mecanismo documentado de carga desproporcionada. La aplicabilidad jurídica a un despliegue concreto debe revisarse para ese operador; el core open-source no la decide automáticamente.

## Baseline implementado en 9D-4

El shell global aporta:

- enlace bilingüe “Saltar al contenido principal” visible al recibir foco por teclado antes de la navegación repetida;
- target de foco estable alrededor del contenido sin introducir un segundo landmark `<main>` anidado;
- `:focus-visible` fuerte para enlaces, botones, controles de formulario, `summary` y elementos explícitamente focusables;
- estilos de foco cargados después de estilos globales antiguos, de modo que controles que usaban `outline: none` vuelven a recibir indicador visible de foco por teclado;
- soporte `prefers-reduced-motion: reduce` que elimina smooth scrolling y reduce animaciones/transiciones;
- tratamiento de foco para forced colors / alto contraste;
- preservación del idioma del documento, landmarks header/footer y navegación con nombre accesible ya existentes.

## Smoke test bloqueante en navegador

Un test dedicado en Chromium valida el contrato global estable:

1. idioma del documento y un único landmark `<main>` en la home pública;
2. el primer Tab de teclado llega al skip link;
3. activar el skip link mueve el foco al target de contenido principal;
4. el siguiente control de navegación mantiene un outline visible de foco por teclado;
5. la navegación principal desktop dispone de nombre accesible;
6. la preferencia reduced-motion desactiva smooth scrolling/transiciones largas;
7. la home no genera overflow horizontal del documento a 320 CSS px.

Estos checks son intencionadamente pequeños y deterministas para poder bloquear CI. No sustituyen una auditoría completa de accesibilidad.

## Slice de formularios de autenticación cliente

Las superficies de login, registro, recuperación de contraseña y restablecimiento de contraseña del cliente usan ahora relaciones programáticas explícitas para instrucciones y feedback devuelto por el servidor:

- los labels visibles siguen siendo el nombre accesible de cada control;
- ayudas y resúmenes de error tienen IDs estables referenciados mediante `aria-describedby`;
- solo los campos realmente afectados por un fallo de validación devuelto exponen `aria-invalid="true"`, evitando marcar indiscriminadamente todos los controles;
- los errores que requieren atención inmediata usan `role="alert"`, mientras que confirmaciones de recuperación/restablecimiento usan regiones `role="status"` con anuncio educado;
- tras un error devuelto, el foco inicial se mueve al primer campo inválido accionable para que usuarios de teclado/lector de pantalla no tengan que redescubrir el formulario;
- las instrucciones de contraseña siguen asociadas programáticamente incluso cuando existe un error;
- los campos inválidos incorporan una señal visual adicional de borde/forma, además del estado semántico, para no depender únicamente del color.

Un test bloqueante dedicado en Chromium ejecuta estos formularios con autenticación persistente de cliente habilitada sobre MongoDB desechable. Verifica nombres accesibles, `aria-invalid`, `aria-describedby`, foco tras errores devueltos, regiones de error asertivas y regiones de éxito/estado educadas.

## Gate de revisión manual

Antes de afirmar que una release está preparada en accesibilidad, revisar manualmente journeys representativos EN/ES, incluyendo como mínimo:

- navegación pública → detalle de viaje/servicio → reserva;
- login / registro / recuperación / autenticación accesible;
- cuenta cliente, cumplimentación de Traveller Data y solicitudes de privacidad;
- elección de pago y cualquier handoff/retorno de proveedor que esté bajo control del operador;
- login Operator, cola de reservas, detalle de reserva y mutaciones habituales.

Para cada journey revisar:

- operación solo con teclado, orden lógico de foco y ausencia de keyboard traps;
- foco no oculto por UI sticky/fixed;
- headings/landmarks semánticos y nombres accesibles significativos;
- labels, instrucciones, required state, identificación y recuperación de errores;
- anuncios de cambios de estado cuando sean necesarios, sin depender solo de señales visuales;
- contraste de texto/fondo y contraste no textual;
- zoom al 200% y reflow/viewports pequeños;
- tamaño/espaciado de targets y alternativas a gestos de arrastre;
- alternativas de imágenes/media cuando el contenido sea significativo;
- uso con lector de pantalla en una combinación representativa desktop/móvil;
- superficies de terceros/pago documentadas por separado cuando no estén controladas por la plataforma.

## Alcance y riesgo residual

El baseline global de accesibilidad y el primer slice de formularios de autenticación cliente están implementados. Traveller Data/privacidad, interacciones de reserva/pago, formularios Operator, regiones dinámicas específicas de features, revisión de contraste/contenido y journeys manuales con tecnologías de apoyo siguen pendientes antes de poder cerrar 9D-4.

Un build verde automático nunca debe presentarse como prueba de que se cumplen todos los success criteria WCAG ni todas las obligaciones de la Ley 11/2023. El alcance jurídico del despliegue, servicios de terceros, calidad de contenido y findings manuales con tecnologías de apoyo siguen siendo inputs separados de release.
