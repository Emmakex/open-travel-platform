# Contratos de extensión y adapters de referencia

<p align="center"><a href="./EXTENSION-CONTRACTS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.3 — candidata a cierre; COMPLETADA solo tras CI verde + merge + verificación de `main`**  
Slices: **10.3.1 COMPLETADA · 10.3.2 COMPLETADA · 10.3.3 COMPLETADA · 10.3.4 candidata a COMPLETADA**  
Gate permanente: `npm run check:extension-contracts`

## Propósito

La Fase 10.3 formaliza las fronteras provider-neutral de Open Travel Platform y las protege contra deriva silenciosa.

Artefactos autoritativos:

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md) — inventario público y mapa de autoridad;
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md) — compatibilidad/versionado/deprecación/migración;
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md) — implementaciones de referencia para contribuidores;
- [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md) — contrato de validación automatizada permanente.

## Regla central de autoridad

Un adapter recibe autoridad solo sobre la capacidad que implementa explícitamente.

- catálogo no puede convertirse en autoridad de booking/pagos;
- booking sigue limitado por ownership, alcance, inventario y pricing confiable;
- `PaymentRepository` sigue siendo el ledger local provider-neutral;
- Stripe/Redsys son integraciones PSP/checkout, no repositories del ledger;
- resultados de proveedor deben pasar por auditoría y workflow local;
- CRM y ERP/contabilidad siguen siendo downstream-only;
- `FailureTransport` y webhooks genéricos son superficies de entrega no autoritativas;
- retornos de navegador de pagos nunca confirman de forma autoritativa;
- payloads específicos de proveedor permanecen dentro de adapters y se normalizan antes de entrar al dominio.

## 10.3.1 — Inventario y mapa de autoridad — COMPLETADA

El inventario respaldado por código verifica exactamente nueve interfaces de primer nivel bajo `repositories/`:

| Capacidad | Frontera | Autoridad |
|---|---|---|
| Catálogo | `TravelRepository` | fuente acotada de catálogo |
| Identidad | `IdentityRepository` | fuente confiable de identidad/perfil |
| Booking | `BookingRepository` | autoridad acotada de reservas |
| Operaciones | `OperationsRepository` | autoridad local de workflow staff |
| Pagos | `PaymentRepository` | ledger local autoritativo |
| Fulfilment | `SupplierFulfilmentAdapter` | sincronización subordinada al workflow |
| CRM | `CrmSyncAdapter` | solo downstream |
| ERP/contabilidad | `ErpAccountingAdapter` | solo downstream |
| Visibilidad de fallos | `FailureTransport` | solo monitorización |

Los webhooks firmados genéricos son una superficie downstream separada.

Consulta [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md).

## 10.3.2 — Compatibilidad/versionado — COMPLETADA

Política principal:

- interfaces públicas in-process siguen SemVer del core;
- rutas/headers REST v1 existentes permanecen estables;
- catálogo actual sin versión queda congelado como semántica legacy-v1;
- versión de schema de evento y versión de firma webhook evolucionan de forma independiente;
- autoridad/autenticación/idempotencia/estados/allowlists forman parte del contrato;
- adapters de mutación no pueden hacer downgrade wire silencioso;
- evolución breaking exige versión/migración/deprecación explícitas;
- cambios de API vendor deben absorberse dentro del adapter cuando el contrato normalizado del core pueda mantenerse.

Consulta [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

## 10.3.3 — Adapters de referencia — COMPLETADA

Referencias oficiales basadas en implementaciones reales y probadas:

- `RestBookingRepository` — autoridad acotada de repository;
- `RestSupplierFulfilmentAdapter` + `performSupplierAdapterOperation()` — subordinado a workflow y audit-before-apply;
- `RestCrmSyncAdapter` — downstream-only;
- `RestFailureTransport` — referencia opcional de monitorización.

Demuestran credenciales server-only, HTTPS/redirect safety, transporte acotado, validación runtime, errores estables, idempotencia determinista, allowlists explícitas, contención de autoridad y migración deliberada v1→v2.

Consulta [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md).

## 10.3.4 — Validación permanente — candidata a COMPLETADA

El nuevo gate estático permanente es:

```bash
npm run check:extension-contracts
```

Implementación:

```text
scripts/extension-contract-check.mjs
```

Queda registrado dentro de `npm run verify` y comprueba:

- inventario exacto de `repositories/`;
- pureza provider-neutral de las interfaces;
- superficies downstream-only de CRM/ERP;
- límites de autoridad de Supplier y orden audit-before-apply;
- neutralidad PSP de `PaymentRepository`;
- identificadores v1 de contratos/headers/schemas/firma;
- protecciones HTTPS, redirects, timeout, tamaño y parsing de adapters de referencia;
- consistencia documental EN/ES;
- presencia del workflow CI dedicado.

CI bloqueante dedicado:

```text
.github/workflows/extension-contracts.yml
```

Ejecuta:

```bash
npm run check:extension-contracts
npm run test:rest-adapter-contracts
```

La segunda orden conserva validación runtime sobre un servidor HTTP local real. El workflow principal `CI` también mantiene esa suite contractual.

Consulta [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md).

## Cambios contractuales intencionados

Un cambio legítimo futuro debe actualizar el gate, no evitarlo:

1. cambiar deliberadamente el contrato;
2. clasificar impacto de compatibilidad;
3. introducir versión/migración cuando sea breaking;
4. actualizar inventario/autoridad/referencias;
5. actualizar `extension-contract-check.mjs` con la nueva invariante deseada;
6. actualizar pruebas runtime;
7. sincronizar documentación EN/ES, README, ROADMAP y CHANGELOG;
8. exigir CI verde y merge antes de avanzar.

## Frontera de adapters propietarios

Adapters específicos de Kairoseth/cliente/vendor pueden permanecer privados e importar contratos públicos OTP. El core MIT no debe depender de paquetes privados ni de sus credenciales.

## Gate de cierre de Fase 10.3

```text
10.3.1  Inventario + mapa de autoridad              COMPLETADA
10.3.2  Compatibilidad/versionado                   COMPLETADA
10.3.3  Adapters de referencia                      COMPLETADA
10.3.4  Validación automatizada permanente          candidata a COMPLETADA
```

**La Fase 10.3 será oficialmente COMPLETADA solo cuando el PR de cierre 10.3.4 tenga CI requerido verde, esté mergeado a `main` y `main` haya sido verificado.** No puede empezar otro trabajo de Fase 10 antes de ese gate.

## Documentación relacionada

- [`EXTENSION-POINT-INVENTORY.es.md`](EXTENSION-POINT-INVENTORY.es.md)
- [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md)
- [`REFERENCE-ADAPTERS.es.md`](REFERENCE-ADAPTERS.es.md)
- [`EXTENSION-VALIDATION.es.md`](EXTENSION-VALIDATION.es.md)
- [`ADAPTER-GUIDE.md`](ADAPTER-GUIDE.md)
- [`../ROADMAP.es.md`](../ROADMAP.es.md)
