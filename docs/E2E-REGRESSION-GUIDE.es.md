# Guía de regresiones E2E de navegador

Esta guía registra fallos de tests de navegador que no deben volver a diagnosticarse desde cero en cada pull request.

## Referencia histórica: PR #115

El PR #115 (`Phase 9D-4: accessible booking and payment feedback`) dejó dos patrones recurrentes de fallo en Playwright:

1. **Fuga de alcance de tests.** El comando histórico `test:e2e` se amplió temporalmente desde un único recorrido persistente de reserva a todos los specs de Playwright. Los nuevos tests de accesibilidad empezaron a ejecutarse en entornos que no estaban preparados para ellos.
2. **Aserciones sensibles al idioma.** El recorrido persistente de Operator esperaba el literal bruto `pending`, mientras la interfaz mostraba correctamente la etiqueta localizada `Pending` / `Pendiente`.

Las correcciones fueron:

- mantener el recorrido histórico explícitamente limitado a `tests/e2e/persistent-booking.spec.ts --project=chromium`;
- dar a cada nuevo gate de navegador su propio spec explícito y su entorno controlado;
- no comprobar copy visible de Operator en un solo idioma cuando la superficie está localizada;
- preferir IDs estables y atributos semánticos para comportamiento, y regex bilingües de role/name cuando el nombre accesible sea precisamente lo que se quiere validar.

## Regresión relacionada: PR #116

El PR #116 mostró la variante de selectores del mismo problema. Un selector genérico `form button[type="submit"]` encontraba los controles de idioma EN/ES además de la acción real del formulario, provocando un `strict-mode violation` de Playwright aunque la aplicación, el seed MongoDB, TypeScript y el build productivo estuvieran correctos.

La regla permanente es: **no apuntar a botones submit genéricos en páginas localizadas.** Debe usarse un rol semántico con un nombre accesible bilingüe para la acción concreta, por ejemplo `Create my account|Crear mi cuenta`, `Confirm reservation|Confirmar reserva` o `Sign in to operations|Entrar en operaciones`.

## Reglas obligatorias para nuevos PR con navegador

Antes de añadir o modificar un gate Playwright:

- **No usar un comando desnudo `playwright test`** en scripts de package ni workflows dedicados. Debe indicarse el spec exacto y el proyecto Chromium.
- **No ampliar `test:e2e`.** Es el recorrido histórico persistente cliente reserva → verificación Operator y debe permanecer aislado.
- **Tratar el copy de cliente/Operator como localizado.** Las aserciones sobre títulos, estados, botones, nombres de formulario o nombres accesibles deben soportar EN/ES, salvo que se comprueben IDs/atributos neutrales al idioma.
- **No usar selectores submit genéricos en páginas localizadas.** Los controles de idioma también pueden ser formularios/botones. Debe apuntarse a la acción con `getByRole("button", { name: /EN|ES/ })` u otra relación semántica estable.
- **Preferir selectores semánticos.** Usar `getByRole`, IDs estables, `role`, `aria-live`, `aria-invalid`, `aria-describedby` y relaciones programáticas antes que selectores visuales o estructurales frágiles.
- **Mantener entornos explícitos.** Las bases MongoDB deben ser CI-only/desechables, el servidor Next.js debe ser el build de producción y cada workflow debe declarar los modos persistentes que necesita.
- **Ejecutar invariantes antes de Chromium.** Los fallos de configuración/contrato deben aparecer antes de lanzar el recorrido de navegador.

## Aplicación en PR #116

El PR #116 aplica y amplía el patrón de regresión del PR #115 al cierre de accesibilidad de Operator:

- el spec de accesibilidad Operator permanece aislado bajo `test:accessibility-operator`;
- los nombres localizados de formularios y botones de acción aceptan inglés y español;
- el recorrido usa botones semánticos nombrados en lugar de submit genéricos;
- el invariant de accesibilidad Operator rechaza `form button[type="submit"]` en este recorrido y protege explícitamente las expectativas bilingües.

## Checklist de revisión

Para cada PR futuro que añada un spec de navegador, revisar:

- ¿El spec se ejecuta mediante un comando dedicado y explícito?
- ¿Puede el cambio provocar que otro workflow descubra accidentalmente el nuevo spec?
- ¿Alguna aserción depende de copy solo inglés o solo español?
- ¿Algún selector genérico de `submit` puede encontrar formularios auxiliares o de idioma?
- ¿Puede sustituirse un literal o selector CSS estructural por un selector semántico estable?
- ¿El entorno del test activa exactamente los servicios/capacidades persistentes que necesita el recorrido?

Si alguna respuesta no está clara, comparar el cambio con el PR #115 y el seguimiento del PR #116 antes de hacer merge.
