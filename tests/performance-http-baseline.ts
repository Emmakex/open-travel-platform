import { performance } from "node:perf_hooks";

const baseUrl = (process.env.PERFORMANCE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

type Scenario = {
  name: string;
  path: string;
  requests: number;
  concurrency: number;
  p95BudgetMs: number;
  allowedStatuses: number[];
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

const scenarios: Scenario[] = [
  {
    name: "liveness",
    path: "/api/health/live",
    requests: 48,
    concurrency: 8,
    p95BudgetMs: 750,
    allowedStatuses: [200]
  },
  {
    name: "public-catalogue",
    path: "/",
    requests: 30,
    concurrency: 6,
    p95BudgetMs: 1800,
    allowedStatuses: [200]
  },
  {
    name: "trip-booking-read",
    path: "/trips/barcelona-city-break/book",
    requests: 24,
    concurrency: 6,
    p95BudgetMs: 2200,
    allowedStatuses: [200]
  },
  {
    name: "customer-sign-in-read",
    path: "/account/sign-in",
    requests: 24,
    concurrency: 6,
    p95BudgetMs: 1800,
    allowedStatuses: [200]
  },
  {
    name: "operator-sign-in-read",
    path: "/operator/sign-in",
    requests: 24,
    concurrency: 6,
    p95BudgetMs: 2000,
    allowedStatuses: [200]
  }
];

function percentile(sorted: number[], quantile: number) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function requestOnce(scenario: Scenario) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${scenario.path}`, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "ktravel-ci-performance-baseline/1" }
    });
    // Consume the body so connection/resource behavior is included in the measurement.
    await response.arrayBuffer();
    return {
      durationMs: performance.now() - started,
      ok: scenario.allowedStatuses.includes(response.status),
      status: response.status
    };
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
  for (let index = 0; index < 3; index += 1) {
    const result = await requestOnce(scenario);
    if (!result.ok) {
      throw new Error(`Warm-up failed for ${scenario.name}: status=${result.status}${"error" in result ? ` error=${result.error}` : ""}`);
    }
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
      const index = cursor;
      cursor += 1;
      if (index >= scenario.requests) return;
      const result = await requestOnce(scenario);
      durations.push(result.durationMs);
      if (!result.ok) {
        failures += 1;
        console.error(`[performance] ${scenario.name} request ${index + 1} failed: status=${result.status}${"error" in result ? ` error=${result.error}` : ""}`);
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

  if (result.failures > 0) {
    throw new Error(`${scenario.name} recorded ${result.failures}/${scenario.requests} failed or unexpected responses`);
  }
  if (result.p95Ms > scenario.p95BudgetMs) {
    throw new Error(`${scenario.name} p95 ${result.p95Ms}ms exceeded CI baseline budget ${scenario.p95BudgetMs}ms`);
  }
  return result;
}

async function main() {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(baseUrl)) {
    throw new Error("Performance baseline must run only against a local disposable application server.");
  }

  const results: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    console.log(JSON.stringify({ event: "performance_baseline_scenario", ...result }));
  }

  const totalRequests = results.reduce((sum, result) => sum + result.requests, 0);
  const totalFailures = results.reduce((sum, result) => sum + result.failures, 0);
  console.log(JSON.stringify({
    event: "performance_baseline_complete",
    baseUrl,
    scenarioCount: results.length,
    totalRequests,
    totalFailures,
    results
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
