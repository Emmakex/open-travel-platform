import { performance } from "node:perf_hooks";
import { getBookingRepository } from "@/lib/booking-repository";
import { createCustomerSession, registerCustomer } from "@/lib/customer-auth";
import { KTRAVEL_SESSION_COOKIE, KTRAVEL_STAFF_SESSION_COOKIE } from "@/lib/identity-config";
import { getMongoClient } from "@/lib/mongodb";
import { createStaffSession, ensureBootstrapAdmin, listStaffUsers } from "@/lib/staff-auth";

const baseUrl = (process.env.PERFORMANCE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

type Scenario = {
  name: string;
  path: string;
  cookie: string;
  requests: number;
  concurrency: number;
  p95BudgetMs: number;
};

type ScenarioResult = {
  name: string;
  path: string;
  requests: number;
  concurrency: number;
  failures: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  meanMs: number;
  requestsPerSecond: number;
};

function percentile(sorted: number[], quantile: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function prepareFixture() {
  const customer = await registerCustomer({
    email: "performance-auth-customer@example.test",
    password: "Performance-Authenticated-Customer-2026",
    firstName: "Performance",
    lastName: "Customer",
    country: "Spain",
    preferredLocale: "en"
  });
  const customerSession = await createCustomerSession(customer.id);

  const bootstrap = await ensureBootstrapAdmin();
  if (!bootstrap.configured) throw new Error("Persistent bootstrap admin is required for authenticated performance setup.");
  const staff = (await listStaffUsers()).find((member) => member.role === "admin" && member.status === "active");
  if (!staff) throw new Error("Persistent admin account was not created for authenticated performance setup.");
  const staffSession = await createStaffSession(staff.id);

  const reservation = await getBookingRepository().createReservation({
    identityId: customer.id,
    tripId: "trip-barcelona-city",
    availabilityId: "departure-e2e-barcelona",
    partySize: 1,
    inventorySpaces: 1,
    travellers: [
      {
        id: "traveller-performance-1",
        firstName: "Performance",
        lastName: "Traveller",
        dateOfBirth: "2070-01-15",
        nationality: "Spanish",
        isLead: true,
        ageAtDeparture: 29,
        pricingBandId: "adult",
        pricingCode: "adult",
        pricingLabel: "Adult",
        pricingLabelEs: "Adulto",
        unitPrice: 540,
        consumesInventory: true
      }
    ],
    unitPrice: 540,
    tripPriceTotal: 540,
    totalPrice: 540,
    currency: "EUR",
    tripTitle: "Barcelona City Break",
    departureDate: "2099-06-10",
    returnDate: "2099-06-13"
  });

  return {
    reservationId: reservation.id,
    customerCookie: `${KTRAVEL_SESSION_COOKIE}=${customerSession.token}`,
    staffCookie: `${KTRAVEL_STAFF_SESSION_COOKIE}=${staffSession.token}`
  };
}

async function requestOnce(scenario: Scenario) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${scenario.path}`, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: {
        cookie: scenario.cookie,
        "user-agent": "ktravel-ci-authenticated-read-baseline/1"
      }
    });
    await response.arrayBuffer();
    return { durationMs: performance.now() - started, ok: response.status === 200, status: response.status };
  } catch (error) {
    return {
      durationMs: performance.now() - started,
      ok: false,
      status: 0,
      error: error instanceof Error ? error.name : "UnknownError"
    };
  }
}

async function warmScenario(scenario: Scenario) {
  for (let index = 0; index < 2; index += 1) {
    const result = await requestOnce(scenario);
    if (!result.ok) throw new Error(`Warm-up failed for ${scenario.name}: status=${result.status}`);
  }
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  await warmScenario(scenario);
  const durations: number[] = [];
  let failures = 0;
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= scenario.requests) return;
      const result = await requestOnce(scenario);
      durations.push(result.durationMs);
      if (!result.ok) {
        failures += 1;
        console.error(`[performance-auth] ${scenario.name} request ${index + 1} failed: status=${result.status}${"error" in result ? ` error=${result.error}` : ""}`);
      }
    }
  }

  await Promise.all(Array.from({ length: scenario.concurrency }, () => worker()));
  const wallMs = performance.now() - started;
  const sorted = durations.slice().sort((a, b) => a - b);
  const total = durations.reduce((sum, value) => sum + value, 0);
  const result: ScenarioResult = {
    name: scenario.name,
    path: scenario.path,
    requests: scenario.requests,
    concurrency: scenario.concurrency,
    failures,
    minMs: round(sorted[0] ?? 0),
    p50Ms: round(percentile(sorted, 0.5)),
    p95Ms: round(percentile(sorted, 0.95)),
    p99Ms: round(percentile(sorted, 0.99)),
    maxMs: round(sorted.at(-1) ?? 0),
    meanMs: round(sorted.length ? total / sorted.length : 0),
    requestsPerSecond: round(wallMs > 0 ? (scenario.requests * 1000) / wallMs : 0)
  };

  if (result.failures > 0) throw new Error(`${scenario.name} recorded ${result.failures}/${scenario.requests} failed responses`);
  if (result.p95Ms > scenario.p95BudgetMs) throw new Error(`${scenario.name} p95 ${result.p95Ms}ms exceeded CI budget ${scenario.p95BudgetMs}ms`);
  return result;
}

async function main() {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(baseUrl)) {
    throw new Error("Authenticated performance baseline must run only against a local disposable application server.");
  }

  const fixture = await prepareFixture();
  const scenarios: Scenario[] = [
    { name: "customer-account", path: "/account", cookie: fixture.customerCookie, requests: 24, concurrency: 4, p95BudgetMs: 2500 },
    { name: "customer-reservations", path: "/account/reservations", cookie: fixture.customerCookie, requests: 24, concurrency: 4, p95BudgetMs: 2800 },
    { name: "customer-reservation-detail", path: `/account/reservations/${encodeURIComponent(fixture.reservationId)}`, cookie: fixture.customerCookie, requests: 20, concurrency: 4, p95BudgetMs: 3200 },
    { name: "operator-dashboard", path: "/operator", cookie: fixture.staffCookie, requests: 24, concurrency: 4, p95BudgetMs: 2800 },
    { name: "operator-reservations", path: "/operator/reservations", cookie: fixture.staffCookie, requests: 24, concurrency: 4, p95BudgetMs: 3200 },
    { name: "operator-reservation-detail", path: `/operator/reservations/${encodeURIComponent(fixture.reservationId)}`, cookie: fixture.staffCookie, requests: 20, concurrency: 4, p95BudgetMs: 3500 },
    { name: "operator-reservation-workflow", path: `/operator/reservations/${encodeURIComponent(fixture.reservationId)}/workflow`, cookie: fixture.staffCookie, requests: 20, concurrency: 4, p95BudgetMs: 3800 }
  ];

  const results: ScenarioResult[] = [];
  try {
    for (const scenario of scenarios) {
      const result = await runScenario(scenario);
      results.push(result);
      console.log(JSON.stringify({ event: "authenticated_read_performance_scenario", ...result }));
    }
    console.log(JSON.stringify({
      event: "authenticated_read_performance_complete",
      scenarioCount: results.length,
      totalRequests: results.reduce((sum, result) => sum + result.requests, 0),
      totalFailures: results.reduce((sum, result) => sum + result.failures, 0),
      results
    }));
  } finally {
    await (await getMongoClient()).close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
