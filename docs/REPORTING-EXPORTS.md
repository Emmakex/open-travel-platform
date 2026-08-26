# Reporting and exports

Phase 7B-4 adds operational CSV/XLSX exports, financial reconciliation views and a tightly controlled export path for protected post-purchase traveller data.

## Operator workspace

The protected workspace is available at:

```text
/operator/reports
```

Visible sections depend on the current staff capabilities.

- **Reservations**: trip reservations, service reservations and customer exports.
- **Finance**: reconciliation, outstanding balances and revenue by product/service.
- **Traveller data + Reservations**: protected traveller-data export for a selected active reservation.

The server re-checks capabilities on every export route. Hiding a button in the UI is never treated as authorization.

## CSV and XLSX

Operational and finance datasets are available in both CSV and XLSX.

The two formats are generated from the same `TabularExport` definition so column meaning cannot silently diverge between formats.

The XLSX writer is intentionally small and generates a standard OOXML workbook with:

- one worksheet;
- a frozen header row;
- an automatic filter;
- bounded column widths;
- inline strings rather than spreadsheet formulas.

CSV values that begin with spreadsheet formula control characters (`=`, `+`, `-`, `@`, tab or carriage return) are prefixed as literal text before serialization. This mitigates CSV/spreadsheet formula injection when an export is opened interactively.

All download responses use:

```text
Cache-Control: private, no-store, max-age=0
X-Content-Type-Options: nosniff
```

## Date filters

The workspace supports optional `from` / `to` filters. These filters apply to the record **creation date**, not the departure/service date.

If the two dates are supplied in reverse order, the server normalizes them to the correct chronological range.

## Finance reports

Finance-capable staff can export:

- reconciliation by reservation/service target;
- active outstanding balances and overdue installment amounts;
- booked value, net collected, refunded and outstanding value grouped by product/service.

Currencies are never summed together. The reporting UI keeps totals separated by currency and each export includes its currency column.

Reservation status and payment status remain separate concepts throughout reporting.

## Standard export audit

When MongoDB operations mode is active, normal exports write metadata to:

```text
travel_operator_export_audit
```

The audit record stores:

- export type and format;
- actor ID, role and display name;
- timestamp;
- row count;
- exported column names;
- normalized date filters;
- whether the export was sensitive.

It **does not store exported cell values**.

In non-persistent/demo operations mode, ordinary exports can still be generated, but no persistent audit record is available.

## Protected traveller-data export

Protected post-purchase traveller values are intentionally separate from ordinary operational exports.

The sensitive endpoint:

```text
POST /operator/reports/protected-travellers/export
```

requires all of the following:

1. authenticated staff session;
2. `traveller-data` capability;
3. `reservations` capability;
4. an active trip or service reservation;
5. an explicit operational reason between 10 and 500 characters;
6. configured traveller-data encryption key;
7. persistent MongoDB operations mode so the export audit can be stored successfully.

This endpoint is POST-only so the operational reason and selected reservation identifier are not placed in the query string or browser URL history.

### Fail-closed ordering

Sensitive exports are fail-closed. The sequence is:

1. authorize staff;
2. validate target and reason;
3. read/decrypt retained traveller records for that one reservation;
4. build the export table;
5. persist the sensitive export audit record;
6. only then return the CSV/XLSX bytes.

If the persistent audit cannot be written, no sensitive file is returned.

### Scope

The protected export includes the ordinary reservation traveller identity fields plus post-purchase fields that are still within their configured retention window.

It does not turn protected traveller data into a general customer export and does not bypass the existing encrypted traveller-data store.

## Export limits

Ordinary report exports are capped at 10,000 rows per request. Protected traveller exports are capped at 500 travellers for the selected reservation.

Large-scale BI/data-warehouse integrations belong in a future adapter rather than an unbounded browser download.

## Permanent invariants

Run:

```bash
npm run check:reporting-exports
```

The gate verifies, among other things:

- CSV formula-injection protection;
- real XLSX ZIP/OOXML output;
- safe filenames;
- date-filter normalization;
- finance/report table invariants;
- authorization boundaries on ordinary/finance exports;
- protected exports are POST-only;
- protected exports require both Traveller data and Reservations permission;
- an operational reason is mandatory;
- the sensitive audit call occurs before the response is returned;
- the audit model does not define protected traveller values;
- private/no-store response headers remain present.
