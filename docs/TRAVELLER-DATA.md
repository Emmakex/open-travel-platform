# Post-purchase traveller data

Kairoseth Travel deliberately separates **booking data** from **advanced traveller data**.

Basic traveller data used to price and create a reservation (name, date of birth, nationality and guardian relationship where relevant) is collected during booking. Passport/identity-document, residence and other supplier/legal fields are requested **after the reservation has been created**, and only when the reservation snapshot says they are required.

This is a product architecture document, not legal advice. Each deployment remains responsible for determining which rules apply to its legal role, routes, suppliers and markets.

## Data-minimisation rule

The default is **no additional traveller fields**.

A trip or service may select one requirement profile:

- `none` — no extra post-purchase fields;
- `travel-document` — document type/number, issuing country and expiry;
- `international-air` — sex plus travel-document fields, for routes/suppliers that actually require passenger API/document information;
- `spanish-lodging` — fields associated with Spanish lodging registration obligations where the deployment is itself a subject obliged by Real Decreto 933/2021;
- `maritime` — additional passenger data for applicable passenger-ship operations;
- `custom` — deployment/supplier-specific fields chosen explicitly.

The selected requirements are **snapshotted onto the reservation at purchase time**. Later catalogue edits therefore do not silently change historical customer obligations.

## Operator activation workflow

The feature is activated **per product**, never globally for every traveller.

For a trip, open:

```text
Operator → Catalogue → Trips → Edit trip
```

For an activity, transport service or insurance product, open the corresponding product editor under:

```text
Operator → Catalogue → Services
```

Then use **Post-purchase traveller data / Datos de viajeros después de la compra**:

1. Leave **No additional data / Sin datos adicionales** when the product does not need extra traveller information.
2. Select the appropriate preset only when a supplier, route or legal obligation genuinely requires it.
3. Review the customer-editing deadline and retention period.
4. Save the product.
5. The configuration becomes active for **new reservations only**. Existing reservations keep the traveller-requirements snapshot captured when they were created.

Operator uses three intentionally simple states:

- **NOT REQUIRED / NO REQUERIDO** — the reservation has no post-purchase traveller-data task;
- **PENDING / PENDIENTE** — at least one traveller still has required fields missing;
- **COMPLETE / COMPLETO** — every traveller has completed the required fields.

The operator reservation view shows the aggregate status and a per-traveller status without exposing decrypted identity/document values in the overview.

## Customer UX

The customer should not need to understand presets, legal rules or internal configuration.

When a new reservation contains post-purchase traveller requirements:

- **My account / Mi cuenta** highlights the task for the next upcoming trip;
- the reservation or service detail shows a prominent **Action required / Acción pendiente** message while information is missing;
- the primary CTA is **Complete traveller information / Completar datos de viajeros**;
- once all travellers are complete, the status changes to **Traveller information complete / Datos de viajeros completos**;
- the CTA becomes a secondary **Review traveller information / Revisar datos de viajeros** action while editing remains open.

The traveller-data form shows progress as `completed travellers / total travellers`, and each traveller is labelled **Complete** or **Action required**.

## GDPR / RGPD principles

Regulation (EU) 2016/679 applies to the processing of this data. In particular:

- Article 5 requires purpose limitation, data minimisation, storage limitation and appropriate security;
- Article 6 requires a lawful basis, commonly contract necessity and/or a legal obligation where genuinely applicable;
- Article 9 gives health data special-category protection;
- Article 13 requires the deployment to provide the applicable privacy information at the point where personal data is collected;
- Article 25 requires data protection by design and by default;
- Article 32 requires appropriate security measures for the risk.

Kairoseth therefore does not include medical/health questions in the standard traveller profiles. If an insurer or supplier genuinely needs health data, that should be implemented as a separate, reviewed workflow with the appropriate Article 9 condition (for example explicit consent where legally appropriate), rather than adding health fields to the generic traveller form.

The generic core cannot hard-code a complete Article 13 notice because controller identity, contact/DPO information, purposes, lawful bases, recipients, international transfers and rights depend on the actual deployment. Production deployments must provide that deployment-specific privacy information in or immediately beside the traveller-data collection flow.

Official text: https://eur-lex.europa.eu/eli/reg/2016/679/oj

## Spain: package travel

The consolidated Spanish Consumer Protection Act (Real Decreto Legislativo 1/2007) requires package organisers/retailers to give applicable pre-contractual information including passport/visa requirements and health formalities (Article 153), as well as payment terms.

That duty to **inform** customers does not by itself create a universal requirement to collect every traveller's passport number at checkout. Kairoseth therefore keeps document collection post-purchase and product/route-specific.

Official consolidated text: https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555

## Spain: lodging registration (RD 933/2021)

Real Decreto 933/2021 applies to subjects within its lodging/rental scope. For professional lodging activity, its Annex I lists traveller data including name/surnames, sex, identity-document details, nationality, date of birth, habitual residence and contact details. Article 5 establishes a three-year record-retention period for professional obliged subjects.

The `spanish-lodging` preset therefore defaults to **1095 days** of retention. It must only be selected when the deployment's actual legal role is subject to that obligation.

Important: in June 2025 the Spanish Data Protection Agency (AEPD) expressly stated that the lodging-registration duty **does not authorise requesting a copy of the DNI or passport**, because a full copy contains additional data and violates data minimisation. Kairoseth's traveller-data flow therefore has no passport/DNI image-upload field.

Official sources:

- BOE RD 933/2021: https://www.boe.es/eli/es/rd/2021/10/26/933/con
- AEPD note (17 June 2025): https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-informa-de-que-no-esta-permitido-solicitar-copia-dni-o-pasaporte-en-hospedajes

## Air passenger / border data

Air-carrier passenger information is route- and carrier-specific. Regulation (EU) 2025/12 creates the new harmonised API framework for flights into the Union and will repeal the previous Directive 2004/82/EC framework when the new regime becomes applicable. Its general application is tied to the future start of the EU API/PNR router, so Kairoseth must not assume a universal passenger-field set for every flight today.

Use `international-air` only where the actual carrier/route requires the fields and keep airline-specific payloads in a future supplier adapter.

Official text: https://eur-lex.europa.eu/eli/reg/2025/12

## Minors travelling abroad

Spanish minors resident in Spain can require a specific authorisation to travel abroad when travelling without a parent/legal representative. The exact requirement depends on residence, accompaniment, destination and circumstances. Kairoseth therefore **does not infer this automatically from age alone**. `minorTravelAuthorization` is available as a custom requirement when the operator has determined that it applies.

Kairoseth stores only the authorisation status in this phase, not a scanned copy of the authorisation.

Official information: https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/autorizacion-para-viaje-de-menores-al-extranjero/

## Security model

Advanced traveller fields are stored separately from `travel_reservations` / `travel_service_reservations` in:

- `travel_traveller_details`
- audit metadata in `travel_traveller_data_audit`

Values are encrypted using **AES-256-GCM** with the server-only `TRAVELLER_DATA_KEY`.

Accepted key formats:

- 32-byte base64; or
- 64-character hexadecimal.

Example generation:

```bash
openssl rand -base64 32
```

The key must remain stable for the deployment. It must never be exposed as a `NEXT_PUBLIC_*` variable or committed to the repository.

Operator completion views expose **completion metadata only**, not decrypted document/residence values.

Audit events record which field names changed, but never the old/new field values.

## Retention

Each requirement snapshot includes `retentionDaysAfterEnd`.

Encrypted records store a `retentionUntil` date and MongoDB uses a TTL index to remove records after that point. Standard travel-document profiles default to a short 30-day post-service period; `spanish-lodging` defaults to 1095 days because the Spanish rule requires three-year retention for professional obliged subjects.

Deployments should review these defaults against the actual legal basis and supplier contract. A longer retention period must not be selected merely because it is operationally convenient.

## End-to-end customer workflow

1. Customer purchases/reserves the trip or service using only booking/pricing data.
2. The reservation snapshots the product's traveller requirements.
3. My account and the reservation detail display the real traveller-data state.
4. `/account/traveller-data/<trip|service>/<reservation-id>` shows only the required fields for that reservation.
5. The customer may save/update data until the configured pre-start deadline.
6. Progress changes from **Pending** to **Complete** as each traveller satisfies the snapshot requirements.
7. Values are encrypted at rest and the completion status becomes visible in Operator.
8. TTL retention removes encrypted data after the configured post-service period.

## Deployment checklist

Before enabling any preset in production:

- configure a stable `TRAVELLER_DATA_KEY`;
- determine the actual operational/legal reason for requesting the selected fields;
- confirm the retention period;
- provide deployment-specific Article 13 privacy information;
- create a **new** test reservation after saving the product configuration;
- verify customer state: `Pending → Complete`;
- verify Operator sees the same completion state without decrypted values;
- verify old reservations did not change when the product preset was edited.

## Deliberate non-goals in this phase

- no DNI/passport image upload;
- no medical questionnaire in the generic traveller flow;
- no automatic assumption that every international traveller needs a passport record;
- no automatic minor-authorisation requirement solely because a traveller is under 18;
- no provider-specific airline/hotel payload in the core domain;
- no decrypted sensitive values in general Operator list/overview screens.
