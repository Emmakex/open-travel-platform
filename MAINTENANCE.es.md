# Política de mantenimiento de Open Travel Platform

<p align="center"><a href="./MAINTENANCE.md">English</a> · <strong>Español</strong></p>

## Estado

Open Travel Platform **v1.2.0** es el baseline open-source estable y provider-neutral.

El proyecto público queda ahora **feature-frozen y en modo solo mantenimiento**. No existe un roadmap activo de nuevas funcionalidades después del cierre completado de la Fase 11 de distribución y despliegue.

El repositorio permanece público y utilizable bajo licencia MIT. Se deja deliberadamente sin archivar para que terceros puedan clonarlo, revisar su historial, reportar defectos relevantes y mantener sus propios forks.

## Alcance de mantenimiento

Todavía pueden considerarse cambios cuando sean necesarios para preservar el baseline estable, especialmente:

- correcciones de seguridad y respuesta a vulnerabilidades;
- bugs críticos de corrección, fiabilidad o integridad de datos;
- correcciones de compatibilidad necesarias para mantener compilable u operable el baseline documentado v1.2.0;
- actualizaciones de dependencias/runtime necesarias por seguridad o continuidad operativa;
- correcciones o aclaraciones documentales;
- fixes estrechamente acotados del pipeline verificado de release/distribución.

El mantenimiento debe preservar los contratos públicos existentes y evitar ampliar el alcance del producto. Cuando haga falta una nueva release source, siguen aplicando SemVer, migraciones, auditoría y las reglas de releases inmutables existentes.

## Fuera de alcance

El roadmap público de OTP no planifica nuevas capacidades comerciales/de producto, incluyendo:

- nuevas funcionalidades para usuario final u Operator;
- expansión de UX comercial o evolución visual específica de Kairoseth;
- nuevos adapters o integraciones privadas/de cliente;
- capacidades de IA y automatización específicas del producto;
- billing, licencias, packaging o administración comercial de Kairoseth;
- workflows o infraestructura específicos de clientes;
- nuevas fases destinadas a hacer crecer OTP como producto comercial activo.

Por ello, una solicitud de funcionalidad puede cerrarse como `not planned` aunque la idea sea válida para un producto downstream o un fork.

## Separación de Kairoseth Travel

**Kairoseth Travel** es la implementación comercial/de referencia oficial y la línea de desarrollo activa, desplegada en <https://travel.kairoseth.com>.

Kairoseth Travel puede reutilizar conceptos, contratos o código de OTP según la licencia y las fronteras arquitectónicas del repositorio. La dirección de dependencia permanece en un solo sentido:

```text
Open Travel Platform (baseline público estable)
        ↓
Kairoseth Travel (producto privado/comercial activo)
```

OTP nunca debe depender de código privado de Kairoseth Travel, configuración de clientes ni adapters propietarios.

El trabajo nuevo de Kairoseth Travel no se devuelve automáticamente a OTP. Cualquier mantenimiento futuro de OTP, si lo hubiera, debe ser deliberadamente acotado, revisado y validado como mantenimiento del baseline público.

## Identidad de la release estable

El baseline feature-frozen es:

```text
Release source: v1.2.0
Source SHA: aae9b2dcd4529cafba37cc44e7cdfec740731508
Imagen OCI verificada:
ghcr.io/emmakex/open-travel-platform@sha256:aeda693786e6f7c69fd61348a1098acc5bdf09ddaf859cfe16314ce72d7ba6ac
```

El GitHub Release incluye `distribution-verification-1.2.0.json`, registro machine-readable del source SHA y digest OCI verificados.

## Expectativas de soporte

El mantenimiento open-source sigue siendo best-effort. El proyecto no promete un roadmap activo de features, una rama LTS ni soporte comercial a través de este repositorio.

Los reportes de seguridad siguen `SECURITY.md`. Los bugs públicos deben ser reproducibles sobre el baseline estable OTP y nunca deben incluir credenciales, datos de clientes ni Traveller Data protegida.

El desarrollo y soporte comercial de Kairoseth Travel son independientes de esta política pública de mantenimiento.