# Política de branding e identidad de Open Travel Platform

<p align="center"><a href="./TRADEMARKS.md">English</a> · <strong>Español</strong></p>

Estado: **Fase 10.7 — COMPLETADA**

## Propósito

Open Travel Platform se distribuye como core de software provider-neutral bajo licencia MIT. La licencia del software y la identidad del proyecto responden a cuestiones diferentes:

- [`LICENSE`](LICENSE) concede derechos para usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y vender copias del software MIT, sujeto a sus términos;
- esta política explica cómo pueden utilizarse los nombres del proyecto y del despliegue de referencia para evitar confusión sobre origen, afiliación, endorsement o carácter oficial.

Esta política **no cambia ni restringe la licencia MIT del código** y no afirma ni implica que ningún identificador esté registrado como marca en ninguna jurisdicción. No utilices el símbolo `®` para estos identificadores salvo que una futura comunicación autoritativa confirme expresamente el registro y el uso permitido.

## Identidades del proyecto

### Open Travel Platform

**Open Travel Platform** identifica el core open-source público, su repositorio upstream, documentación y releases.

Se permite y fomenta la referencia descriptiva veraz. Ejemplos:

- “basado en Open Travel Platform”;
- “fork de Open Travel Platform”;
- “compatible con Open Travel Platform v1.x” cuando se haya verificado realmente;
- “soporte independiente para Open Travel Platform” cuando quede claro quién presta el servicio;
- enlaces, reviews, tutoriales, charlas y documentación técnica que se refieran correctamente al proyecto.

### Kairoseth Travel

**Kairoseth Travel** identifica la implementación oficial alojada/comercial de referencia descrita por este repositorio. El despliegue de referencia actual es `travel.kairoseth.com`.

Forks, despliegues, productos o servicios de terceros no deben denominarse **Kairoseth Travel**, utilizar `Kairoseth`/`Kairoseth Travel` como identidad principal de producto/servicio/dominio/cuenta ni sugerir que son el servicio oficial alojado sin permiso explícito del mantenedor/titular correspondiente.

Se permiten referencias descriptivas veraces como “el despliegue de referencia Kairoseth Travel” cuando no impliquen afiliación ni endorsement.

## Distribuciones modificadas y servicios alojados independientes

La licencia MIT permite modificar el software. Una distribución modificada o un servicio alojado operado de forma independiente debe utilizar **su propio nombre principal e identidad visual** para que los usuarios sepan quién lo publica, opera y soporta.

Redacción recomendada:

```text
Acme Travel — basado en Open Travel Platform
```

o:

```text
Acme Travel es un despliegue independiente basado en Open Travel Platform.
No es el servicio oficial Kairoseth Travel.
```

Un producto modificado o independiente no debe presentarse como “Open Travel Platform oficial”, “Kairoseth Travel oficial”, “certificado”, “aprobado”, “partner” o equivalente salvo que ese estatus haya sido concedido expresamente.

## Mirrors y forks de código fuente no modificado

Los forks y mirrors del código pueden conservar el historial del repositorio e identificar de forma veraz a Open Travel Platform como upstream.

Un fork de GitHub, mirror o copia de archivo no se convierte en canal oficial de releases de Open Travel Platform por conservar el nombre upstream en metadata o historial.

Cuando un fork se convierte en producto distribuido o servicio alojado independiente debe usar una marca principal distinta y describir secundariamente su relación con Open Travel Platform.

## Identidad por defecto de la aplicación

La configuración demo/evaluación usa intencionadamente:

```text
NEXT_PUBLIC_SITE_NAME=Open Travel Platform
```

Ese default es apropiado para evaluación local, desarrollo upstream y demostraciones del proyecto upstream.

Despliegues públicos/comerciales independientes y distribuciones materialmente modificadas deben configurar `NEXT_PUBLIC_SITE_NAME` y la presentación asociada con su propia identidad principal. Pueden incluir una mención secundaria veraz como “Powered by Open Travel Platform” o “Basado en Open Travel Platform” siempre que no implique endorsement oficial.

## “Powered by”, “basado en” y compatibilidad

Son usos normalmente aceptables, cuando son ciertos y secundarios respecto a la marca propia del producto independiente:

- “Powered by Open Travel Platform”;
- “Basado en Open Travel Platform”;
- “Compatible con Open Travel Platform X.Y”;
- “Integración/soporte independiente para Open Travel Platform”.

No utilices expresiones que impliquen certificación, partnership oficial o endorsement que no hayan sido concedidos.

Las afirmaciones de compatibilidad deben indicar versión o familia contractual cuando sea relevante y no deben afirmar compatibilidad no verificada.

## Dominios, redes sociales y nombres de producto

No utilices **Kairoseth**, **Kairoseth Travel**, `travel.kairoseth.com` ni identidades confundibles como nombre de producto independiente, servicio alojado, dominio, paquete, listing de app o cuenta social sin permiso explícito.

No utilices **Open Travel Platform** como nombre principal de un producto/servicio comercial independiente o modificado de forma que haga pensar razonablemente que está publicado, alojado, soportado o respaldado por el proyecto upstream.

El uso descriptivo en texto para explicar compatibilidad u origen es distinto de presentar la identidad del proyecto como marca propia del operador.

## Logos y elementos visuales

Este repositorio actualmente **no** designa ni distribuye un paquete oficial de logos de Open Travel Platform o Kairoseth Travel bajo esta política. Las ilustraciones demo de destinos/viajes no son logos oficiales del proyecto.

Si en el futuro se añaden logos oficiales, su uso permitido deberá documentarse explícitamente. No debe asumirse que una licencia de código autoriza automáticamente a presentar un producto de terceros como distribución oficial con branding.

## Claims de oficial, certificado, aprobado o partner

Los siguientes términos se reservan para situaciones en las que el estatus correspondiente haya sido realmente concedido:

- oficial;
- certificado;
- aprobado;
- endorsed/respaldado;
- partner / partnership;
- autorizado.

La compatibilidad técnica por sí sola no crea ninguno de estos estatus.

## Servicios comerciales, consultoría y soporte

Empresas y personas independientes pueden prestar servicios alrededor del software MIT de Open Travel Platform.

Usa una identificación clara del proveedor, por ejemplo:

- “Acme Consulting — servicios independientes de implementación de Open Travel Platform”;
- “Soporte independiente para Open Travel Platform”.

Evita nombres como “Open Travel Platform Official Support” o “Kairoseth Travel Support” para servicios no afiliados.

## Identificadores legacy `KTRAVEL_*`

El core público contiene actualmente variables `KTRAVEL_*` conservadas como **identificadores técnicos legacy de configuración**.

Su presencia:

- no convierte un despliegue independiente en Kairoseth Travel;
- no concede permiso para usar branding de Kairoseth;
- no crea afiliación ni endorsement.

Como los nombres de variables documentados son contratos operativos públicos, no deben renombrarse silenciosamente. Cualquier futura migración de namespace seguirá [`docs/DEPRECATIONS.es.md`](docs/DEPRECATIONS.es.md), [`docs/UPGRADES.es.md`](docs/UPGRADES.es.md) y [`docs/MIGRATIONS.es.md`](docs/MIGRATIONS.es.md), con aliases compatibles/deprecación antes de retirada ordinaria.

## Marcas de terceros

Nombres como Stripe, Redsys, MongoDB, Next.js y otros productos/vendors pertenecen a sus respectivos titulares. Las referencias de este repositorio son descriptivas de tecnología/integración y no implican endorsement ni partnership.

El branding de terceros sigue sujeto a sus propias políticas aplicables.

## Branding en contribuciones

Una contribución no debe:

- introducir branding específico de cliente o vendor en el core provider-neutral sin justificación revisada;
- añadir claims de “oficial”, “certificado”, “partner” o endorsement sin base autoritativa;
- hacer silenciosamente obligatorio el branding Kairoseth para forks/self-hosting;
- añadir assets de marca/logo cuyos derechos y uso permitido en el repositorio no estén claros.

Cambios de nombres públicos, identidad visual por defecto, dominios, nombres de paquete o configuración legacy relacionada con branding deben clasificar impacto de compatibilidad/migración y seguir las políticas de release/deprecación establecidas.

## Permiso y aclaraciones

Cuando un uso propuesto pueda hacer que un producto/servicio de terceros parezca oficial, o necesite usar Kairoseth/Kairoseth Travel como marca principal, debe obtenerse permiso explícito del mantenedor/titular correspondiente antes de publicarlo.

La ausencia de respuesta no constituye permiso para un uso restringido o ambiguo.

## Sin efecto sobre los derechos del código

Una solicitud para corregir branding confuso no revoca ni reduce los derechos ya concedidos por la licencia MIT para usar, modificar o redistribuir el software licenciado. La solución práctica es diferenciar claramente el producto/servicio independiente de la identidad upstream/de referencia mientras se sigue cumpliendo la licencia de software.

## Regla de cierre

La Fase 10.7 sigue el gate permanente: implementación, validación, documentación EN/ES sincronizada, revisión de diff, CI obligatorio verde, merge a `main` y verificación de `main` antes de iniciar la auditoría/release final de Fase 10.
