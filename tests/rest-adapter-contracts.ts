import assert from "node:assert/strict";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import type { CreateReservationInput } from "@/domain/booking/types";
import type {
  SupplierFulfilmentComponent,
  SupplierFulfilmentItem
} from "@/domain/operations/types";
import type {
  CrmContactSnapshot,
  CrmReservationSnapshot,
  CrmSyncCommand
} from "@/repositories/crm-sync-adapter";
import type { ErpAccountingSyncCommand } from "@/repositories/erp-accounting-adapter";
import type { SupplierAdapterCommand } from "@/repositories/supplier-fulfilment-adapter";

type CapturedRequest = {
  method: string;
  path: string;
  headers: http.IncomingHttpHeaders;
  body: unknown;
};

const captured: CapturedRequest[] = [];
const attempts = new Map<string, number>();

function attempt(key: string) {
  const next = (attempts.get(key) ?? 0) + 1;
  attempts.set(key, next);
  return next;
}

function errorCode(reason: unknown) {
  return reason && typeof reason === "object" && "code" in reason
    ? String((reason as { code?: unknown }).code ?? "")
    : "";
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) as unknown : null;
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  contractHeader: string,
  contractVersion = "1",
  contentType = "application/json; charset=utf-8"
) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": contentType,
    [contractHeader]: contractVersion,
    "Content-Length": Buffer.byteLength(text)
  });
  response.end(text);
}

function bookingReservation(input: CreateReservationInput) {
  return {
    ...input,
    id: `reservation-${input.tripId}`,
    status: "pending",
    createdAt: "2099-01-01T00:00:00.000Z"
  };
}

async function route(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = request.method === "POST" ? await readJsonBody(request) : null;
  captured.push({
    method: request.method ?? "GET",
    path: `${url.pathname}${url.search}`,
    headers: request.headers,
    body
  });

  if (url.pathname === "/v1/availability") {
    const tripId = url.searchParams.get("tripId") ?? "";
    if (tripId === "booking-version") {
      return sendJson(response, 200, { availability: [] }, "X-OTP-Contract-Version", "2");
    }
    if (tripId === "booking-content") {
      return sendJson(response, 200, { availability: [] }, "X-OTP-Contract-Version", "1", "text/plain");
    }
    if (tripId === "booking-oversize") {
      return sendJson(
        response,
        200,
        { availability: [], padding: "x".repeat(20_000) },
        "X-OTP-Contract-Version"
      );
    }
    const returnedTripId = tripId === "booking-scope" ? "other-trip" : tripId;
    return sendJson(response, 200, {
      availability: [{
        id: `availability-${tripId}`,
        tripId: returnedTripId,
        departureDate: "2099-05-01",
        returnDate: "2099-05-08",
        remainingSpaces: 4,
        unitPrice: 125
      }]
    }, "X-OTP-Contract-Version");
  }

  if (url.pathname === "/v1/reservations" && request.method === "POST") {
    const envelope = body as { reservation?: CreateReservationInput };
    const input = envelope.reservation;
    assert(input, "Booking adapter must send a reservation envelope.");
    const key = `booking-create:${input.tripId}`;
    if (input.tripId === "booking-retry" && attempt(key) === 1) {
      return sendJson(response, 503, { error: "temporary" }, "X-OTP-Contract-Version");
    }
    if (input.tripId === "booking-reject") {
      attempt(key);
      return sendJson(response, 400, { error: "rejected" }, "X-OTP-Contract-Version");
    }
    attempt(key);
    return sendJson(response, 200, { reservation: bookingReservation(input) }, "X-OTP-Contract-Version");
  }

  if (url.pathname.startsWith("/v1/fulfilment/")) {
    const requestId = String(request.headers["x-otp-request-id"] ?? "");
    const operation = url.pathname.split("/").at(-1) ?? "status";
    const count = attempt(`supplier:${requestId}`);
    if (requestId === "supplier-retry" && count === 1) {
      return sendJson(response, 503, { error: "temporary" }, "X-OTP-Contract-Version");
    }
    if (requestId === "supplier-content") {
      return sendJson(response, 200, { fulfilment: { status: "requested" } }, "X-OTP-Contract-Version", "1", "text/plain");
    }
    if (requestId === "supplier-version") {
      return sendJson(response, 200, { fulfilment: { status: "requested" } }, "X-OTP-Contract-Version", "2");
    }
    if (requestId === "supplier-bad-status") {
      return sendJson(response, 200, { fulfilment: { status: "not-requested" } }, "X-OTP-Contract-Version");
    }
    const status = operation === "request" ? "requested" : operation === "cancel" ? "cancelled" : "confirmed";
    return sendJson(response, 200, {
      fulfilment: { status, reference: "SUP-EXT-001", message: "normalized" }
    }, "X-OTP-Contract-Version");
  }

  if (url.pathname === "/v1/crm/contacts/upsert" || url.pathname === "/v1/crm/reservations/upsert") {
    const requestId = String(request.headers["x-otp-request-id"] ?? "");
    const count = attempt(`crm:${requestId}`);
    if (requestId === "crm-retry" && count === 1) {
      return sendJson(response, 503, { error: "temporary" }, "X-OTP-Contract-Version");
    }
    if (requestId === "crm-reject") {
      return sendJson(response, 400, { error: "rejected" }, "X-OTP-Contract-Version");
    }
    if (requestId === "crm-content") {
      return sendJson(response, 200, { externalId: "crm-1", outcome: "upserted" }, "X-OTP-Contract-Version", "1", "text/plain");
    }
    return sendJson(response, 200, {
      externalId: url.pathname.includes("contacts") ? "crm-contact-1" : "crm-reservation-1",
      outcome: "upserted"
    }, "X-OTP-Contract-Version");
  }

  if (url.pathname === "/v1/accounting/movements/upsert") {
    const requestId = String(request.headers["x-otp-request-id"] ?? "");
    const count = attempt(`erp:${requestId}`);
    if (requestId === "erp-retry" && count === 1) {
      return sendJson(response, 503, { error: "temporary" }, "X-OTP-Accounting-Contract-Version");
    }
    if (requestId === "erp-content") {
      return sendJson(response, 200, { externalId: "erp-1", outcome: "upserted" }, "X-OTP-Accounting-Contract-Version", "1", "text/plain");
    }
    if (requestId === "erp-version") {
      return sendJson(response, 200, { externalId: "erp-1", outcome: "upserted" }, "X-OTP-Accounting-Contract-Version", "2");
    }
    return sendJson(response, 200, { externalId: "erp-movement-1", outcome: "upserted" }, "X-OTP-Accounting-Contract-Version");
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "not-found" }));
}

function createBookingInput(tripId: string): CreateReservationInput {
  return {
    identityId: "customer-contract-test",
    tripId,
    availabilityId: `availability-${tripId}`,
    partySize: 2,
    inventorySpaces: 2,
    unitPrice: 125,
    tripPriceTotal: 250,
    totalPrice: 250,
    currency: "EUR",
    tripTitle: "Contract test trip",
    departureDate: "2099-05-01",
    returnDate: "2099-05-08"
  };
}

function supplierCommand(operation: "request" | "status" | "cancel", requestId: string): SupplierAdapterCommand {
  const component: SupplierFulfilmentComponent = {
    targetType: "trip-reservation",
    targetId: "reservation-contract-test",
    componentType: "trip",
    componentKey: "trip:primary",
    componentLabel: "Primary trip",
    customerCurrency: "EUR"
  };
  const item: SupplierFulfilmentItem = {
    ...component,
    id: "fulfilment-contract-test",
    status: operation === "request" ? "not-requested" : "requested",
    supplierName: "Contract Supplier",
    supplierReference: "LOCAL-SUP-001",
    supplierCost: 999,
    supplierCurrency: "USD",
    deadline: "2099-04-01",
    createdAt: "2099-01-01T00:00:00.000Z",
    createdByStaffId: "staff-contract",
    createdByDisplayName: "Contract Staff"
  };
  return {
    operation,
    component,
    item,
    requestId,
    idempotencyKey: operation === "status" ? undefined : `idem-${requestId}`
  };
}

function requestsFor(path: string) {
  return captured.filter((item) => item.path.startsWith(path));
}

async function main() {
  assert.notEqual(process.env.NODE_ENV, "production", "Local adapter contract tests must not run with NODE_ENV=production.");

  const server = http.createServer((request, response) => {
    route(request, response).catch((error) => {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "test-server-error" }));
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/`;
  process.env.REST_BOOKING_BASE_URL = baseUrl;
  process.env.REST_BOOKING_BEARER_TOKEN = "booking-contract-token";
  process.env.REST_BOOKING_TIMEOUT_MS = "3000";
  process.env.REST_BOOKING_MAX_RESPONSE_BYTES = "16384";
  process.env.REST_SUPPLIER_FULFILMENT_BASE_URL = baseUrl;
  process.env.REST_SUPPLIER_FULFILMENT_BEARER_TOKEN = "supplier-contract-token";
  process.env.REST_SUPPLIER_FULFILMENT_TIMEOUT_MS = "3000";
  process.env.REST_SUPPLIER_FULFILMENT_MAX_RESPONSE_BYTES = "8192";
  process.env.REST_CRM_BASE_URL = baseUrl;
  process.env.REST_CRM_BEARER_TOKEN = "crm-contract-token";
  process.env.REST_CRM_TIMEOUT_MS = "3000";
  process.env.REST_CRM_MAX_RESPONSE_BYTES = "8192";
  process.env.REST_ERP_ACCOUNTING_BASE_URL = baseUrl;
  process.env.REST_ERP_ACCOUNTING_BEARER_TOKEN = "erp-contract-token";
  process.env.REST_ERP_ACCOUNTING_TIMEOUT_MS = "3000";
  process.env.REST_ERP_ACCOUNTING_MAX_RESPONSE_BYTES = "8192";

  try {
    const [bookingModule, supplierModule, crmModule, erpModule] = await Promise.all([
      import("@/adapters/rest-booking-repository"),
      import("@/adapters/rest-supplier-fulfilment-adapter"),
      import("@/adapters/rest-crm-sync-adapter"),
      import("@/adapters/rest-erp-accounting-adapter")
    ]);

    const booking = new bookingModule.RestBookingRepository();
    const supplier = new supplierModule.RestSupplierFulfilmentAdapter();
    const crm = new crmModule.RestCrmSyncAdapter();
    const erp = new erpModule.RestErpAccountingAdapter();

    const created = await booking.createReservation(createBookingInput("booking-retry"));
    assert.equal(created.tripId, "booking-retry");
    const bookingRetryRequests = captured.filter(
      (item) => item.path === "/v1/reservations" && (item.body as { reservation?: { tripId?: string } })?.reservation?.tripId === "booking-retry"
    );
    assert.equal(bookingRetryRequests.length, 2, "Booking transient failure must retry exactly once.");
    assert.equal(bookingRetryRequests[0]?.headers.authorization, "Bearer booking-contract-token");
    assert.equal(bookingRetryRequests[0]?.headers["x-otp-contract-version"], "1");
    assert(bookingRetryRequests[0]?.headers["idempotency-key"], "Booking mutation must send an idempotency key.");
    assert.equal(
      bookingRetryRequests[0]?.headers["idempotency-key"],
      bookingRetryRequests[1]?.headers["idempotency-key"],
      "Booking retry must reuse the same idempotency key."
    );

    await assert.rejects(
      booking.createReservation(createBookingInput("booking-reject")),
      (error: unknown) => errorCode(error) === "REST_BOOKING_REJECTED"
    );
    const bookingRejectRequests = captured.filter(
      (item) => item.path === "/v1/reservations" && (item.body as { reservation?: { tripId?: string } })?.reservation?.tripId === "booking-reject"
    );
    assert.equal(bookingRejectRequests.length, 1, "Booking 400 response must not be retried.");
    await assert.rejects(booking.listAvailability("booking-scope"), (error: unknown) => errorCode(error) === "REST_BOOKING_SCOPE_MISMATCH");
    await assert.rejects(booking.listAvailability("booking-version"), (error: unknown) => errorCode(error) === "REST_BOOKING_CONTRACT_VERSION");
    await assert.rejects(booking.listAvailability("booking-content"), (error: unknown) => errorCode(error) === "REST_BOOKING_CONTRACT_INVALID");
    await assert.rejects(booking.listAvailability("booking-oversize"), (error: unknown) => errorCode(error) === "REST_BOOKING_RESPONSE_TOO_LARGE");

    const supplierResult = await supplier.execute(supplierCommand("request", "supplier-retry"));
    assert.equal(supplierResult.status, "requested");
    const supplierRetryRequests = captured.filter((item) => item.headers["x-otp-request-id"] === "supplier-retry");
    assert.equal(supplierRetryRequests.length, 2, "Supplier transient failure must retry exactly once.");
    assert.equal(supplierRetryRequests[0]?.headers.authorization, "Bearer supplier-contract-token");
    assert.equal(supplierRetryRequests[0]?.headers["idempotency-key"], "idem-supplier-retry");
    assert.equal(supplierRetryRequests[1]?.headers["idempotency-key"], "idem-supplier-retry");
    const supplierBody = supplierRetryRequests[0]?.body as Record<string, unknown>;
    const supplierFulfilment = supplierBody.fulfilment as Record<string, unknown>;
    assert.equal(supplierBody.operation, "request");
    assert.equal(supplierFulfilment.supplierName, "Contract Supplier");
    assert.equal("supplierCost" in supplierFulfilment, false, "Supplier REST payload must not expose internal supplier cost.");
    assert.equal("supplierCurrency" in supplierFulfilment, false, "Supplier REST payload must not expose internal supplier currency.");
    assert.equal("customerCurrency" in supplierFulfilment, false, "Supplier REST payload must not expose customer financial context.");
    assert.equal((await supplier.execute(supplierCommand("status", "supplier-status"))).status, "confirmed");
    assert.equal((await supplier.execute(supplierCommand("cancel", "supplier-cancel"))).status, "cancelled");
    await assert.rejects(supplier.execute(supplierCommand("request", "supplier-bad-status")), (error: unknown) => errorCode(error) === "SUPPLIER_ADAPTER_CONTRACT_INVALID");
    await assert.rejects(supplier.execute(supplierCommand("request", "supplier-content")), (error: unknown) => errorCode(error) === "SUPPLIER_ADAPTER_CONTRACT_INVALID");
    await assert.rejects(supplier.execute(supplierCommand("request", "supplier-version")), (error: unknown) => errorCode(error) === "SUPPLIER_ADAPTER_CONTRACT_VERSION");

    const contactSnapshot = {
      localId: "customer-crm-contract",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      phone: "+34930000000",
      country: "ES",
      preferredLocale: "es",
      paymentTotal: 999,
      passportNumber: "MUST-NOT-LEAK"
    } as CrmContactSnapshot & { paymentTotal: number; passportNumber: string };
    const contactCommand: CrmSyncCommand<CrmContactSnapshot> = {
      snapshot: contactSnapshot,
      requestId: "crm-retry",
      idempotencyKey: "idem-crm-retry"
    };
    const crmContact = await crm.upsertContact(contactCommand);
    assert.equal(crmContact.externalId, "crm-contact-1");
    const crmRetryRequests = captured.filter((item) => item.headers["x-otp-request-id"] === "crm-retry");
    assert.equal(crmRetryRequests.length, 2, "CRM transient failure must retry exactly once.");
    assert.equal(crmRetryRequests[0]?.headers.authorization, "Bearer crm-contract-token");
    assert.equal(crmRetryRequests[0]?.headers["idempotency-key"], "idem-crm-retry");
    assert.equal(crmRetryRequests[1]?.headers["idempotency-key"], "idem-crm-retry");
    const crmContactBody = crmRetryRequests[0]?.body as { contact: Record<string, unknown> };
    assert.equal("paymentTotal" in crmContactBody.contact, false);
    assert.equal("passportNumber" in crmContactBody.contact, false);

    const reservationSnapshot = {
      reservationType: "trip",
      localId: "reservation-crm-contract",
      contactLocalId: "customer-crm-contract",
      productId: "trip-contract",
      productTitle: "Contract trip",
      status: "confirmed",
      partySize: 2,
      startDate: "2099-05-01",
      endDate: "2099-05-08",
      createdAt: "2099-01-01T00:00:00.000Z",
      totalPrice: 999,
      currency: "EUR",
      travellers: [{ passportNumber: "MUST-NOT-LEAK" }]
    } as CrmReservationSnapshot & { totalPrice: number; currency: string; travellers: unknown[] };
    await crm.upsertReservation({ snapshot: reservationSnapshot, requestId: "crm-reservation", idempotencyKey: "idem-crm-reservation" });
    const crmReservationRequest = captured.find((item) => item.headers["x-otp-request-id"] === "crm-reservation");
    const crmReservationBody = crmReservationRequest?.body as { reservation: Record<string, unknown> };
    assert.equal("totalPrice" in crmReservationBody.reservation, false, "CRM reservation payload must not expose finance.");
    assert.equal("currency" in crmReservationBody.reservation, false, "CRM reservation payload must not expose finance currency.");
    assert.equal("travellers" in crmReservationBody.reservation, false, "CRM reservation payload must not expose traveller arrays.");
    await assert.rejects(
      crm.upsertContact({ ...contactCommand, requestId: "crm-reject", idempotencyKey: "idem-crm-reject" }),
      (error: unknown) => errorCode(error) === "CRM_SYNC_REJECTED"
    );
    assert.equal(captured.filter((item) => item.headers["x-otp-request-id"] === "crm-reject").length, 1, "CRM 400 must not retry.");
    await assert.rejects(
      crm.upsertContact({ ...contactCommand, requestId: "crm-content", idempotencyKey: "idem-crm-content" }),
      (error: unknown) => errorCode(error) === "CRM_SYNC_CONTRACT_INVALID"
    );

    const erpCommand: ErpAccountingSyncCommand & { snapshot: ErpAccountingSyncCommand["snapshot"] & { customerEmail: string; travellers: unknown[] } } = {
      requestId: "erp-retry",
      idempotencyKey: "idem-erp-retry",
      snapshot: {
        localId: "payment-contract-test",
        targetType: "trip",
        targetId: "reservation-contract-test",
        movementType: "payment",
        amount: 321.45,
        currency: "EUR",
        provider: "stripe",
        method: "card",
        providerReference: "pi_contract_123",
        occurredAt: "2099-01-01T12:00:00.000Z",
        customerEmail: "must-not-leak@example.test",
        travellers: [{ passportNumber: "MUST-NOT-LEAK" }]
      }
    };
    const erpResult = await erp.upsertMovement(erpCommand);
    assert.equal(erpResult.externalId, "erp-movement-1");
    const erpRetryRequests = captured.filter((item) => item.headers["x-otp-request-id"] === "erp-retry");
    assert.equal(erpRetryRequests.length, 2, "ERP transient failure must retry exactly once.");
    assert.equal(erpRetryRequests[0]?.headers.authorization, "Bearer erp-contract-token");
    assert.equal(erpRetryRequests[0]?.headers["idempotency-key"], "idem-erp-retry");
    assert.equal(erpRetryRequests[1]?.headers["idempotency-key"], "idem-erp-retry");
    const erpBody = erpRetryRequests[0]?.body as { movement: Record<string, unknown> };
    assert.equal(erpBody.movement.amount, 321.45, "ERP payload must preserve authoritative amount exactly.");
    assert.equal(erpBody.movement.currency, "EUR", "ERP payload must preserve authoritative currency exactly.");
    assert.equal(erpBody.movement.provider, "stripe");
    assert.equal(erpBody.movement.providerReference, "pi_contract_123");
    assert.equal("customerEmail" in erpBody.movement, false, "ERP payload must exclude customer PII.");
    assert.equal("travellers" in erpBody.movement, false, "ERP payload must exclude traveller data.");
    await assert.rejects(
      erp.upsertMovement({ ...erpCommand, requestId: "erp-content", idempotencyKey: "idem-erp-content" }),
      (error: unknown) => errorCode(error) === "ERP_ACCOUNTING_CONTRACT_INVALID"
    );
    await assert.rejects(
      erp.upsertMovement({ ...erpCommand, requestId: "erp-version", idempotencyKey: "idem-erp-version" }),
      (error: unknown) => errorCode(error) === "ERP_ACCOUNTING_CONTRACT_VERSION"
    );

    assert(requestsFor("/v1/reservations").length >= 3);
    console.log(
      "REST adapter contract validation passed: real local HTTP transport, auth, contract versions, JSON MIME, bounded responses, retry/idempotency, scope checks and payload allowlists are consistent."
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
