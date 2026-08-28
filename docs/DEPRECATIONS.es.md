# Política de deprecaciones

<p align="center"><a href="./DEPRECATIONS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.5 — COMPLETADA**

## Propósito

La deprecación ofrece a operadores, contribuidores y consumidores downstream una ruta predecible para abandonar una capacidad pública antigua antes de su retirada ordinaria.

Una deprecación es un compromiso de compatibilidad: la superficie deprecated sigue funcionando durante su ventana declarada salvo que un problema excepcional de seguridad haga inseguro mantenerla.

Esta política aplica al comportamiento público del core, incluyendo:

- interfaces repository/adapter;
- contratos REST/eventos/firma;
- configuración pública/variables de entorno;
- comandos operativos y modos de despliegue documentados;
- campos/estados persistentes que los operadores externos deben migrar;
- puntos de extensión para contribuidores.

Detalles internos que no son contratos públicos no necesitan un lifecycle público de deprecación.

## Lifecycle

Las superficies públicas pasan por tres estados explícitos:

```text
ACTIVE → DEPRECATED → REMOVED
```

### ACTIVE

La superficie está soportada según las políticas actuales de release/compatibilidad.

### DEPRECATED

La superficie sigue funcional, pero no debe elegirse para nuevas integraciones/despliegues.

El aviso debe identificar:

- la superficie deprecated sin ambigüedad;
- reemplazo o destino de migración;
- primera release donde queda deprecated;
- release más temprana de retirada ordinaria;
- pasos de migración/configuración;
- compatibilidad/rollback;
- implicaciones de seguridad cuando aplique.

### REMOVED

La superficie ya no está soportada por esa release. La retirada debe registrarse en release notes/CHANGELOG y respetar el límite anunciado salvo una excepción urgente de seguridad.

## Regla de retirada ordinaria

La retirada ordinaria de una superficie pública backward-compatible ocurre únicamente en una release **MAJOR**.

PATCH o MINOR no deben eliminar ni reinterpretar incompatiblemente un contrato público, configuración o comportamiento de autoridad previamente soportado.

El aviso debe indicar el major mínimo de retirada, por ejemplo:

```text
Deprecated since: 1.4.0
Replacement: NEW_SETTING
Earliest ordinary removal: 2.0.0
```

Puede conservarse la superficie durante más tiempo. La versión indicada es un límite mínimo, no una obligación de retirarla inmediatamente.

## Ventana de deprecación

Para cambios ordinarios:

1. el reemplazo se entrega antes o junto con la deprecación;
2. la superficie deprecated permanece usable durante el resto de su major actual;
3. la guía de migración permanece disponible mientras ese major esté soportado;
4. la retirada no puede ocurrir antes del límite del siguiente major anunciado.

Si no existe reemplazo viable, el aviso debe indicarlo y explicar claramente la consecuencia de retirada/migración.

## Excepción de seguridad

Una vulnerabilidad o requisito externo puede hacer inseguro mantener soporte.

Se permite una deprecación/retirada acelerada solo si el aviso de seguridad/release indica claramente:

- por qué no puede seguirse el lifecycle ordinario;
- versiones/configuración/contratos afectados;
- reemplazo o mitigación segura;
- acción requerida del operador;
- impacto de migración/recuperación;
- versión efectiva de retirada/deshabilitación.

La urgencia no justifica cambiar silenciosamente la semántica in-place.

## Deprecación de configuración

Las variables de entorno y settings documentados son contratos operativos públicos para self-hosting.

Al reemplazarlos:

1. añadir el nuevo setting;
2. mantener el antiguo durante la ventana soportada cuando sea seguro;
3. documentar precedencia determinista si ambos están definidos;
4. emitir warning server-side cuando sea viable;
5. nunca registrar el valor secreto del setting;
6. retirar únicamente en el major anunciado.

No reutilices silenciosamente el nombre de una variable deprecated con otra semántica.

Un setting sensible a seguridad puede rechazarse antes mediante la excepción de seguridad, con guidance explícita de release.

## Interfaces in-process

Las interfaces públicas `repositories/*.ts` siguen SemVer del core y [`EXTENSION-COMPATIBILITY.es.md`](EXTENSION-COMPATIBILITY.es.md).

Cuando deban cambiar incompatiblemente:

- introducir transición compatible/aditiva cuando sea viable;
- usar nueva interfaz/versión/nombre en lugar de alterar autoridad silenciosamente;
- documentar la migración de implementaciones de terceros;
- conservar la superficie antigua hasta su major de retirada anunciado.

Cambiar autoridad, ownership, autenticación o idempotencia es breaking aunque TypeScript siga compilando.

## Contratos REST/eventos/firma

La deprecación wire conserva identidades de versión explícitas.

En una migración normal v1→v2:

1. v2 se introduce explícitamente;
2. v1 permanece estable durante la ventana;
3. consumidores migran deliberadamente a v2;
4. mutaciones v2 nunca hacen downgrade silencioso a v1;
5. v1 solo se retira en/después del límite anunciado.

Schema de evento y versión del esquema de firma webhook siguen siendo dimensiones independientes.

## Deprecación de datos persistentes

Campos/estados deprecated en datos durables siguen [`MIGRATIONS.es.md`](MIGRATIONS.es.md).

Preferir:

```text
expand → migrate/backfill → parar writes antiguos → verificar → contract/remove
```

No elimines un campo/estado solo porque el código actual ya no lo escriba. Confirma primero lectores soportados, rollback, backups y postcondiciones.

## Warnings

Los warnings deben ser útiles y seguros.

Deben incluir:

- identificador deprecated;
- reemplazo o referencia documental;
- límite/versión de retirada cuando se conozca.

Nunca deben incluir:

- passwords, API keys o tokens;
- Traveller Data/datos de cliente protegidos;
- payloads completos de proveedor;
- secretos de variables de entorno.

Los warnings de configuración privilegiada deben ser server-side.

## CHANGELOG y release notes

La release que inicia la deprecación debe registrarla bajo **Deprecated** (o sección explícita equivalente), incluyendo reemplazo y earliest removal.

La release que retire la superficie debe registrarla bajo **Removed** con guidance de upgrade/migración.

No reescribas entradas históricas publicadas cuando el lifecycle avance posteriormente.

## Soporte y backports

La deprecación no crea un compromiso LTS nuevo.

El baseline de soporte está definido por [`UPGRADES.es.md`](UPGRADES.es.md) y [`../SUPPORT.md`](../SUPPORT.md). Los backports son best-effort salvo anuncio explícito.

## Regla para contribuidores

Un PR que depreca o retira una superficie pública debe indicar:

- transición (`active→deprecated` o `deprecated→removed`);
- impacto SemVer/compatibilidad;
- reemplazo;
- primera release deprecated y earliest removal;
- migración/rollback;
- cambios de documentación/warnings;
- excepción de seguridad, si aplica.

Una retirada sin aviso previo es breaking por defecto y no debe presentarse como mantenimiento rutinario PATCH/MINOR.

## Automatización

El gate permanente de Fase 10.5 es:

```bash
npm run check:upgrade-deprecations
```

Protege vocabulario de lifecycle, retirada ordinaria solo en MAJOR, excepción de seguridad, reglas para configuración/wire/datos y sincronización con releases, migraciones, soporte, compatibilidad y contribución.
