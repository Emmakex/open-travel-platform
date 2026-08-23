# Reglas de calidad para desarrollo

Estas reglas se aplican a **cada cambio, funcionalidad, corrección o refactorización** que pueda afectar a una experiencia visible para el usuario en Open Travel Platform / Kairoseth Travel.

Forman parte de la Definición de Terminado y no son un acabado opcional.

## Regla 1 — La validación UX es obligatoria

Cualquier cambio que afecte a una página, componente, formulario, estado, flujo, mensaje o interacción debe revisarse desde el punto de vista del usuario antes del merge.

Un cambio visible no está terminado hasta comprobar:

- diseño de escritorio;
- diseño móvil y responsive;
- jerarquía visual y espaciado;
- etiquetas, campos, botones y áreas táctiles;
- estados de carga, vacío, éxito, validación y error cuando correspondan;
- navegación por teclado y foco en controles interactivos;
- consistencia EN/ES de todos los textos visibles;
- ausencia de desbordes, controles cortados o formularios con apariencia nativa sin integrar;
- acciones nombradas con lenguaje de producto/usuario, no lenguaje de implementación;
- que el flujo pueda entenderse sin conocer el roadmap de desarrollo.

Si un cambio no es visible para el usuario, el PR puede marcar esta validación como no aplicable explicando el motivo.

## Regla 2 — Nunca debe salir texto interno de desarrollo en la interfaz

Las interfaces públicas, de cliente y de personal deben describir **el producto y la acción**, nunca el proceso de desarrollo.

No deben aparecer textos como:

- nombres de roadmap o fases (`Phase 6B`, `Fase 6B`, etc.);
- números de PR o issue;
- `WIP`, `TODO`, `FIXME` o mensajes de debug;
- explicaciones de implementación como “primer bloque”, “primer slice”, “bloque temporal”, “prueba interna” o similares;
- terminología técnica que solo tenga sentido para desarrolladores cuando exista un nombre normal de producto.

El contexto de desarrollo debe quedarse en:

- descripciones de pull requests;
- issues;
- documentos de roadmap;
- documentación técnica y de arquitectura;
- comentarios de código cuando corresponda.

## Validación automática

`npm run check:ux` revisa los directorios de interfaz (`app` y `components`) para detectar marcadores habituales de desarrollo interno.

CI ejecuta esta comprobación en cada pull request y en `main`.

La validación automática es solo una capa. **No sustituye la revisión visual**, porque el diseño, legibilidad, interacción y comportamiento responsive necesitan inspección humana.

## Gate obligatorio de pull request

Cada PR con cambios visibles debe completar el checklist UX/contenido de `.github/pull_request_template.md` antes del merge.

La secuencia obligatoria es:

1. implementar;
2. ejecutar validaciones automáticas;
3. revisar visualmente las pantallas y estados afectados;
4. revisar todos los textos visibles para asegurar que son lenguaje de producto;
5. hacer merge solo cuando pasen las validaciones automáticas y manuales.

## Definición de Terminado

Un cambio solo está terminado cuando funcionalidad, seguridad, integridad de datos, UX y textos visibles son adecuados para producción.
