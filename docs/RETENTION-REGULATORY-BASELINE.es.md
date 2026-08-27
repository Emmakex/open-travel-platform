# Baseline regulatorio y de retención

Este documento define la frontera técnica de retención de la Fase 9D-3 para Open Travel Platform / Kairoseth Travel.

**No es asesoramiento jurídico, un calendario de retención específico de una jurisdicción ni una certificación de cumplimiento**. El core MIT evita deliberadamente codificar un único plazo legal universal para reservas, pagos, auditorías o expedientes de privacidad. Cada despliegue productivo debe documentar y aprobar su calendario real de retención con los responsables adecuados de privacidad/legal, finanzas, seguridad y operaciones.

## Fuentes oficiales utilizadas

- RGPD / Reglamento (UE) 2016/679, especialmente artículo 5.1.e sobre limitación del plazo de conservación y artículo 17 sobre supresión/excepciones: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Código de Comercio español, artículo 30 sobre conservación de documentación empresarial: https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627
- Ley 58/2003 General Tributaria, especialmente artículos 66 y 70 sobre prescripción y obligaciones formales: https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186
- Directiva (UE) 2015/2302 relativa a viajes combinados y servicios de viaje vinculados: https://eur-lex.europa.eu/eli/dir/2015/2302/oj
- Marco español de consumo/viajes combinados (Real Decreto Legislativo 1/2007): https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555

Estas referencias explican por qué la retención no puede reducirse a “borrar todo después de N días”. El RGPD exige no mantener datos identificables más tiempo del necesario para la finalidad del tratamiento, mientras que la supresión puede quedar limitada cuando exista otra obligación jurídica o sea necesario conservar datos para formular, ejercer o defender reclamaciones. Las normas mercantiles/fiscales españolas también pueden exigir conservar evidencias empresariales durante plazos distintos según el tipo de registro y la circunstancia.

## Modelo técnico de política

`lib/privacy-retention-policy.ts` asigna cada entrada de `privacyDataInventory` a una estrategia de retención y a un responsable operativo.

Estrategias:

- `ttl`: el store ya dispone de metadata de expiración acotada y solo puede pasar a ser elegible para expiración después de ese timestamp;
- `case-review`: la retención depende del expediente y de la política del despliegue;
- `business-record-review`: reservas, pagos o evidencias operativas deben revisarse frente a necesidades contractuales, de consumo, contables, fiscales y de reclamaciones;
- `security-review`: las evidencias de seguridad/auditoría necesitan una decisión específica de seguridad/privacidad.

El registry nunca devuelve una instrucción de borrado de registros de negocio. El evaluador solo devuelve:

- `retain`;
- `review-required`;
- `eligible-for-expiry`.

`eligible-for-expiry` es deliberadamente más débil que “borrar ahora”. La eliminación real sigue siendo responsabilidad del lifecycle/TTL específico del store o de una migración autorizada de forma separada.

## Precedencia de holds

Un hold documentado siempre prevalece sobre la elegibilidad de expiración.

Ejemplos: disputa activa, investigación de fraude/seguridad, revisión contable/fiscal, reclamación jurídica u otra razón de retención aprobada por el despliegue. El software no decide la validez jurídica del hold; conserva la capacidad técnica de bloquear una expiración automática mientras el responsable autorizado documenta el motivo.

## Matriz actual

| Área de inventario | Responsable | Estrategia | Acción destructiva automática |
| --- | --- | --- | --- |
| Cuenta cliente | Privacidad | case-review | No |
| Sesiones cliente | Seguridad | ttl | Solo TTL/revocación existente |
| Auditoría de autenticación | Seguridad | security-review | No |
| Reservas de viaje | Operaciones | business-record-review | No |
| Reservas de servicios | Operaciones | business-record-review | No |
| Ledger de pagos | Finanzas | business-record-review | No |
| Traveller Data protegido | Privacidad | ttl | Solo TTL existente |
| Auditoría de operaciones | Operaciones | business-record-review | No |
| Tareas operativas de cliente | Operaciones | case-review | No |
| Outbox de integraciones | Operaciones | case-review | No |
| Expedientes de derechos de privacidad | Privacidad | case-review | No |

## Checklist para un despliegue España / UE

Antes de habilitar en producción cualquier purge nuevo fuera de un store ya gestionado por TTL, documentar al menos:

1. store/ID de inventario y categorías de datos;
2. finalidad de tratamiento/negocio;
3. fundamento jurídico/contractual/contable/seguridad revisado para ese despliegue;
4. evento de inicio del cómputo y duración o trigger de revisión;
5. acción final: borrar, anonimizar, agregar o conservar bajo hold;
6. responsable y fecha de aprobación;
7. reglas de hold/excepción y cómo prevalecen sobre la expiración;
8. propagación a processors/integraciones downstream cuando corresponda;
9. implicaciones de backup/restore y momento a partir del cual los datos restaurados deben volver a expirar o anonimizarse;
10. evidencia de que la política se refleja en la información de privacidad al cliente cuando sea exigible.

La regla de seis años del Código de Comercio español y el marco de cuatro años de prescripción de la Ley General Tributaria son **inputs de referencia**, no valores por defecto universales para todas las colecciones de base de datos. El periodo aplicable y su evento de inicio deben decidirse para el registro y finalidad concretos.

## Relación con 9D-1 y 9D-2

- 9D-1 crea expedientes autenticados de derechos de privacidad y exige revisión de retención para la supresión;
- 9D-2 ejecuta exportaciones aprobadas de acceso/portabilidad, limitación y supresión controlada solo cuando su gate de retención lo permite;
- 9D-3 aporta el registry técnico de política de retención y una evaluación fail-closed de expiración para mantener esas decisiones alineadas con el inventario completo de datos personales.

El trabajo regulatorio futuro puede añadir persistencia de políticas específicas del despliegue y tooling Operator, pero el core genérico debe seguir evitando convertir silenciosamente orientación legal en reglas irreversibles de borrado automático.
