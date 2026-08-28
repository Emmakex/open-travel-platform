# Inventario de puntos públicos de extensión y mapa de autoridad

<p align="center"><a href="./EXTENSION-POINT-INVENTORY.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3.1 — COMPLETADA**  
Protección actual: `npm run check:extension-contracts`

## Propósito

Este es el inventario respaldado por código de las fronteras públicas de extensión de primer nivel del core MIT y de la autoridad que puede ejercer cada una.

Un módulo no se convierte en API pública de plugins solo porque pueda sustituirse en un fork. Un punto de extensión in-process de primer nivel es una interfaz explícita bajo `repositories/` seleccionada mediante composición de la aplicación. Los webhooks firmados genéricos se documentan aparte como superficie pública downstream.

## Inventario verificado

El código contiene exactamente **9** interfaces públicas `repositories/*.ts`:

```text
repositories/booking-repository.ts
repositories/crm-sync-adapter.ts
repositories/erp-accounting-adapter.ts
repositories/failure-transport.ts
repositories/identity-repository.ts
repositories/operations-repository.ts
repositories/payment-repository.ts
repositories/supplier-fulfilment-adapter.ts
repositories/travel-repository.ts
```

| Capacidad | Interfaz | Implementaciones actuales | Autoridad |
|---|---|---|---|
| Catálogo | `TravelRepository` | demo / HTTP / MongoDB | fuente acotada |
| Identidad | `IdentityRepository` | demo / MongoDB / disabled | fuente confiable de identidad/perfil |
| Booking | `BookingRepository` | demo / MongoDB / REST v1 / disabled | autoridad acotada de reservas |
| Operaciones | `OperationsRepository` | demo / MongoDB / disabled | autoridad local de workflow staff |
| Pagos | `PaymentRepository` | MongoDB / disabled | ledger local autoritativo |
| Fulfilment proveedor | `SupplierFulfilmentAdapter` | disabled / REST v1 | sincronización subordinada al workflow |
| CRM | `CrmSyncAdapter` | disabled / REST v1 | solo downstream |
| ERP/contabilidad | `ErpAccountingAdapter` | disabled / REST v1 | solo downstream |
| Visibilidad de fallos | `FailureTransport` | disabled / REST | solo monitorización |

Los webhooks genéricos usan el outbox transaccional y entrega HTTPS firmada. Son downstream-only y no son una interfaz `repositories/*`.

## Vocabulario de autoridad

- **autoridad acotada de source/repository** — autoritativa solo dentro de la capacidad representada;
- **local autoritativa** — el dominio OTP local conserva estado/historial canónico;
- **subordinada al workflow** — el estado externo debe pasar auditoría y reglas locales;
- **solo downstream** — recibe datos normalizados y el acknowledgement no puede mutar dominios upstream;
- **solo monitorización** — la entrega puede fallar sin afectar el estado central.

## Detalle por capacidad

### TravelRepository

Puede aportar catálogo. No obtiene autoridad de booking, identidad, pagos u operaciones.

### IdentityRepository

Puede resolver identidad/perfil confiable. Los roles seleccionados desde navegador nunca son autoridad y esta interfaz no recibe escrituras de booking/pagos.

### BookingRepository

Puede implementar persistencia/fuente de reservas, pero sigue sujeto a ownership/scope, pricing confiable, inventario y estados. No obtiene autoridad de ledger, workflow staff ni datos protegidos.

### OperationsRepository

Mantiene el workflow local de staff, separado de customer booking y de CRM/ERP downstream.

### PaymentRepository

Es la frontera autoritativa provider-neutral del ledger de pagos/reembolsos. Stripe y Redsys son integraciones PSP/checkout, no implementaciones de `PaymentRepository`.

### SupplierFulfilmentAdapter

Informa status/reference normalizados. Las respuestas externas se auditan antes de aplicarse y deben pasar por la transición local. El proveedor no obtiene autoridad sobre totales, historial de pagos o inventario.

### CrmSyncAdapter

Solo downstream. La superficie actual está limitada a upsert normalizado de contactos/reservas. Una mutación inversa necesita un contrato separado y revisado.

### ErpAccountingAdapter

Solo downstream desde movimientos locales `succeeded`. Un acknowledgement ERP no puede reescribir ledger, bookings ni inventario.

### FailureTransport

Solo monitorización y best-effort. La disponibilidad del collector no altera autoridad de la aplicación.

## Superficies que no son extensiones públicas

No son contratos de primer nivel actualmente:

- implementación SMTP/email;
- módulos Stripe/Redsys como sustitutos de `PaymentRepository`;
- helpers/stores MongoDB internos;
- módulos arbitrarios `lib/*`, `app/*` o componentes;
- integraciones privadas Kairoseth/cliente.

## Mapa de versiones de red

| Superficie | Mecanismo de versión |
|---|---|
| Booking REST | `/v1` + `X-OTP-Contract-Version: 1` |
| Supplier REST | `/v1` + `X-OTP-Contract-Version: 1` |
| CRM REST | `/v1` + `X-OTP-Contract-Version: 1` |
| ERP/contabilidad REST | `/v1` + `X-OTP-Accounting-Contract-Version: 1` |
| Failure transport | `X-OTP-Failure-Contract-Version: 1` + versión de schema |
| Eventos de integración | `IntegrationEventEnvelope.version: 1` |
| Firma webhook | `X-OTP-Signature: v1=...` |
| Catálogo HTTP | contrato read-only legacy-v1 sin versión explícita |

Las reglas están en [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## Protección permanente

La Fase 10.3.4 protege este inventario con:

```bash
npm run check:extension-contracts
```

El gate compara los archivos reales `repositories/*.ts` con el modelo de nueve interfaces y falla si cambia sin una actualización contractual deliberada. También protege pureza y superficies sensibles a autoridad.

Consulta [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md).

## Hallazgos de cierre

- exactamente nueve interfaces públicas están verificadas;
- `PaymentRepository` forma parte explícita del inventario;
- CRM/ERP siguen siendo downstream-only;
- fulfilment sigue subordinado a auditoría/workflow local;
- webhooks genéricos siguen siendo solo downstream;
- email/MongoDB internos no son contratos de plugins;
- Stripe/Redsys siguen siendo integraciones PSP;
- el inventario queda protegido por un gate CI permanente.

## Documentación relacionada

- [`EXTENSION-CONTRACTS.es.md`](EXTENSION-CONTRACTS.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
