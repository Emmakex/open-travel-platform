# Validación E2E persistente en navegador

La Fase 9B ejecuta el recorrido crítico desde cliente hasta operaciones en Chromium contra el servidor Next.js de producción y un replica set MongoDB desechable.

## Recorrido crítico

`tests/e2e/persistent-booking.spec.ts` verifica exclusivamente mediante la interfaz del navegador:

1. un cliente nuevo abre `/account/register` y crea una cuenta persistente en MongoDB;
2. el cliente autenticado abre la página real de reserva del viaje de Barcelona;
3. selecciona la salida MongoDB controlada e introduce un viajero adulto real;
4. `Confirm reservation` envía la Server Action real y redirige al detalle protegido de la reserva;
5. el área cliente muestra la referencia generada y el viajero;
6. un contexto de navegador separado abre `/operator/sign-in`;
7. el Admin bootstrap persistente se crea/autentica mediante el flujo normal de personal;
8. el Admin abre `/operator/reservations/{reservationId}` y ve exactamente la misma reserva y viajero.

La prueba no inyecta cookies de sesión ni llama a repositorios para crear el cliente o la reserva.

## Topología de ejecución

GitHub Actions ejecuta un job dedicado `Browser E2E (non-blocking)` con:

- `@playwright/test` 1.62.1 fijado exactamente;
- Chromium instalado por Playwright;
- `mongo:8.0.29` como replica set de un solo nodo;
- `TRAVEL_DATA_MODE=mongodb`;
- `IDENTITY_MODE=mongodb`;
- `STAFF_AUTH_MODE=mongodb`;
- `BOOKING_MODE=mongodb`;
- `OPERATIONS_MODE=mongodb`;
- `PAYMENT_LEDGER_MODE=mongodb`;
- capacidades demo de identidad/reservas/operaciones desactivadas;
- `npm run build` seguido del servidor `npm start` gestionado por Playwright.

Así se prueba deliberadamente la aplicación compilada de producción y no `next dev`.

## Política de CI

El job de navegador es actualmente **informativo y no bloqueante**. Se sigue ejecutando siempre y permanece visible en GitHub Actions, incluidos sus diagnósticos cuando falla, pero un fallo exclusivo del journey de navegador no hace fallar el workflow global ni bloquea un merge.

Siguen siendo bloqueantes los invariants estáticos, la concurrencia/rollback real de reservas en MongoDB, la idempotencia de pagos y webhooks, TypeScript, el build de producción, los smoke tests HTTP y la auditoría de dependencias.

Esta política mantiene el E2E como señal útil de regresión mientras terminamos de estabilizarlo. Solo debería volver a ser bloqueante cuando el recorrido sea consistentemente fiable en CI.

## Seguridad del seed

`tests/e2e/seed.ts` elimina y siembra su base, por lo que se niega a ejecutarse salvo que:

- `MONGODB_DB_NAME` empiece por `ktravel_ci_`;
- `MONGODB_URI` utilice `mongodb://`;
- el hostname MongoDB sea `localhost` o `127.0.0.1`.

Reutiliza `seedDemoCatalogueToMongo()` y añade una única salida futura controlada para `trip-barcelona-city`.

## Bootstrap de personal

El job CI proporciona un email, contraseña y nombre desechables para `KTRAVEL_BOOTSTRAP_ADMIN_*`. El Admin se crea mediante el flujo existente `ensureBootstrapAdmin()` al abrir la pantalla normal de acceso de personal. El test no inserta directamente un usuario privilegiado en MongoDB.

## Ejecución local

Con un replica set local desechable y las variables persistentes configuradas:

```bash
npm run test:e2e:seed
npm run build
npx playwright install chromium
npm run test:e2e
```

Nunca apuntes el seed a Atlas ni a una base compartida.
