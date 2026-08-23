# Kairoseth Travel — Full content & UX audit

Audit date: 2026-08-23

This review was completed before continuing reservation-amendment development. It covers the public experience, customer flows, catalogue-management UX and the live MongoDB-backed reference catalogue.

## Coverage

- 44 live public pages crawled: 22 English + 22 Spanish.
- Home, destinations, trips, services hub, activities, transport, travel protection, detail pages and public booking entry points.
- Static inventory across `app`, `components` and shared copy modules.
- 3,495 potential user-facing strings inventoried.
- 133 automated editorial flags reviewed as candidates, not assumed to be defects.
- 185 repeated-copy groups identified for manual review.

Automated flags are intentionally broader than the final editorial decision. Terms such as `inventory` can be appropriate in an Operator screen while being poor customer copy. Human review remains the final gate.

## Priority findings

### P0 — content that can mislead a traveller

1. **Travel protection / insurance product is not publish-ready.** The live reference product uses generic values such as `Premium` and `Total` without a named provider or linked policy terms. The platform must not invent coverage. A real provider and pre-contract/product terms are required before online sale.
2. **Activity commercial sections repeat the same paragraph.** Summary, highlight, Included and Not included must describe different concepts. Repeating the same text makes scope ambiguous.
3. **Transport content repeats the title instead of explaining the service.** Route, summary, highlights and inclusions need distinct customer information.
4. **Iceland Spanish destination data contains a factual mismatch.** The Spanish record shows the country as `Noruega`; it must be corrected to `Islandia`.
5. **Price presentation differed between activity card and detail.** The card used the configured base price while the detail used the lowest paid age band. The UI now derives the same commercial starting price in both places.

### P1 — customer-facing UX and editorial quality

- Duplicate SEO titles such as `Activities | Kairoseth Travel · Kairoseth Travel`.
- Service booking pages had no page-specific metadata.
- Public navigation exposed an Operator sign-in link to ordinary visitors.
- Footer and home copy positioned the site as a travel-technology/operations product instead of a travel experience.
- Customer booking/payment screens exposed implementation language such as `source of truth`, `payment ledger`, `persistent inventory` and verified-server wording.
- Empty availability states sounded like unfinished development (`check back later while options are added`).
- Transport copy mixed `transfer`, `transfers`, `Aeroport` and generic `mobility` terminology.
- Activity duration could be published as a bare number (`2.5`) without a unit.
- Spanish service content could silently fall back to English because complete translation was not required to publish.

### P2 — backoffice/editorial governance

- Service editor previously allowed publication with short/repeated content.
- No publishing rule required a useful image alt text.
- No publishing rule required separate Highlights / Included / Not included content.
- No publishing rule required complete Spanish customer copy.
- Insurance had no fields for provider or terms URL.
- Error messages occasionally asked staff to inspect server logs instead of giving an actionable product message.

## Product rules introduced by this cleanup

### Customer/public copy

- Explain the traveller outcome before implementation details.
- Never expose roadmap phases, PR/issue references, debug language or internal architecture terms.
- Avoid technology claims when the user only needs to know what happens next.
- Use natural Spanish, not literal technical translations.
- Empty states explain what the traveller can do now; they do not describe unfinished development.

### Catalogue publishing

A service can remain an incomplete **Draft** while it is being prepared. To switch it to **Published**, it must have:

- useful English and Spanish title/summary content;
- a summary of meaningful length;
- at least two highlights;
- at least one Included item;
- at least one Not included item;
- distinct commercial copy rather than duplicated paragraphs;
- a cover image and useful alt text;
- required type-specific fields;
- localized activity/transport/coverage labels.

Activities must include a duration unit. Travel-protection products additionally require:

- real provider name;
- meaningful coverage type rather than generic `Premium`, `Total`, `Basic`, etc.;
- HTTPS link to provider/product terms;
- any actual maximum-trip rule used by the product.

## Voice of Kairoseth Travel

The preferred voice is:

- clear, warm and capable;
- concrete rather than promotional filler;
- confident without making unverified promises;
- easy to scan on mobile;
- consistent in English and Spanish;
- traveller-first in the public area and task-first in Operator.

Examples:

- Prefer **“Choose a date and time”** over **“Upcoming inventory slots”**.
- Prefer **“Your payment is being confirmed”** over **“Awaiting verified server notification”**.
- Prefer **“No online times are available right now”** over **“Check back later while options are added”**.
- Prefer **“Add it to your plans”** over **“Independent product”**.

## Reference deployment follow-up

The code changes improve the platform and prevent new low-quality service publications. Existing MongoDB records are not silently rewritten by a deployment. The current live reference records must therefore be edited through Operator using the approved content in `REFERENCE-CATALOGUE-COPY.md`.

The insurance/protection record must remain Draft until the real provider and policy/product conditions are supplied. This audit intentionally does not fabricate insurance coverage.
