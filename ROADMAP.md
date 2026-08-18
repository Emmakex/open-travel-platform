# Roadmap

v1.0 defines the stable starter boundary: catalogue, identity, customer booking, staff operations, secure demo modes and adapter contracts.

Post-1.0 work should extend capabilities without coupling the core UI to one vendor.

## Candidate 1.x capabilities

### Production adapter examples
- Auth.js/OIDC identity adapter example;
- generic server-side booking REST adapter;
- CMS adapter example;
- CRM/ERP operations adapter example.

### Travel product depth
- itinerary/day models;
- accommodation/transport/service components;
- supplements and configurable pricing;
- multilingual catalogue fields;
- media abstraction and accessible galleries.

### Booking lifecycle
- reservation amendments;
- traveller/passenger records;
- supplier holds/confirmations;
- notification/email capability;
- payment capability boundary and reconciliation events.

### Operator workflows
- richer RBAC/permissions;
- assignment/ownership;
- notes and operational timeline;
- search/pagination/export;
- supplier/CRM synchronization states.

### Quality
- production-adapter integration contract tests;
- browser end-to-end scenarios;
- accessibility regression checks;
- performance budgets;
- broader observability examples.

## Non-goals for the core starter

The core should not become tied to a specific payment gateway, CMS, CRM, ERP, booking supplier or hosting platform. Provider-specific integrations should remain optional adapters/examples.
