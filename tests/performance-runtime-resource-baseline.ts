import { spawn, type ChildProcessByStdio } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { Readable } from "node:stream";

const port = Number(process.env.PERFORMANCE_RESOURCE_PORT || "3100");
const baseUrl = `http://127.0.0.1:${port}`;
const standaloneServer = path.join(process.cwd(), ".next", "standalone", "server.js");

type ResourceServerProcess = ChildProcessByStdio<null, Readable, Readable>;

const SUSTAINED_REQUESTS = 240;
const SUSTAINED_CONCURRENCY = 12;
const SPIKE_REQUESTS = 320;
const SPIKE_CONCURRENCY = 32;
const SUSTAINED_P95_BUDGET_MS = 2_000;
const SPIKE_P95_BUDGET_MS = 3_000;
const RSS_GROWTH_BUDGET_MB = 512;
const ABSOLUTE_RSS_BUDGET_MB = 768;
const FD_GROWTH_BUDGET = 160;
const POST_FD_GROWTH_BUDGET = 48;
const POST_FD_RECOVERY_TIMEOUT_MS = 8_000;
const POST_FD_RECOVERY_POLL_MS = 500;
const THREAD_GROWTH_BUDGET = 32;

const routes = [
  "/api/health/live",
  "/",
  "/trips/barcelona-city-break/book",
  "/account/sign-in",
  "/operator/sign-in"
];

type ResourceSnapshot = {
  rssMb: number;
  highWaterMb: number;
  fileDescriptors: number;
  threads: number;
};

type LoadResult = {
  name: "sustained" | "spike";
  requests: number;
  concurrency: number;
  failures: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  meanMs: number;
  requestsPerSecond: number;
};

type FdRecoveryResult = {
  recovered: boolean;
  elapsedMs: number;
  snapshot: ResourceSnapshot;
  samples: ResourceSnapshot[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(sorted: number[], quantile: number) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function parseStatusKb(status: string, field: string) {
  const match = status.match(new RegExp(`^${field}:\\s+(\\d+)\\s+kB$`, "m"));
  if (!match) throw new Error(`Unable to read ${field} from /proc status.`);
  return Number(match[1]);
}

function parseStatusNumber(status: string, field: string) {
  const match = status.match(new RegExp(`^${field}:\\s+(\\d+)$`, "m"));
  if (!match) throw new Error(`Unable to read ${field} from /proc status.`);
  return Number(match[1]);
}

function readResourceSnapshot(pid: number): ResourceSnapshot {
  const status = readFileSync(`/proc/${pid}/status`, "utf8");
  return {
    rssMb: round(parseStatusKb(status, "VmRSS") / 1024),
    highWaterMb: round(parseStatusKb(status, "VmHWM") / 1024),
    fileDescriptors: readdirSync(`/proc/${pid}/fd`).length,
    threads: parseStatusNumber(status, "Threads")
  };
}

async function requestOnce(route: string) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: { "user-agent": "ktravel-ci-runtime-resource/1" }
    });
    await response.arrayBuffer();
    return {
      durationMs: performance.now() - started,
      ok: response.status === 200,
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

async function waitForServer(child: ResourceServerProcess) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Standalone server exited before becoming ready with code ${child.exitCode}.`);
    const result = await requestOnce("/api/health/live");
    if (result.ok) return;
    await sleep(250);
  }
  throw new Error("Standalone production server did not become ready within 30 seconds.");
}

async function warmRoutes() {
  for (const route of routes) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await requestOnce(route);
      if (!result.ok) throw new Error(`Warm-up failed for ${route}: status=${result.status}`);
    }
  }
}

async function waitForFdRecovery(pid: number, baselineFileDescriptors: number): Promise<FdRecoveryResult> {
  const started = performance.now();
  const samples: ResourceSnapshot[] = [];
  let best = readResourceSnapshot(pid);
  samples.push(best);

  while (true) {
    const elapsedMs = performance.now() - started;
    if (best.fileDescriptors <= baselineFileDescriptors + POST_FD_GROWTH_BUDGET) {
      return { recovered: true, elapsedMs: round(elapsedMs), snapshot: best, samples };
    }
    if (elapsedMs >= POST_FD_RECOVERY_TIMEOUT_MS) {
      return { recovered: false, elapsedMs: round(elapsedMs), snapshot: best, samples };
    }

    await sleep(POST_FD_RECOVERY_POLL_MS);
    const snapshot = readResourceSnapshot(pid);
    samples.push(snapshot);
    if (snapshot.fileDescriptors < best.fileDescriptors) best = snapshot;
  }
}

async function runLoad(name: LoadResult["name"], requests: number, concurrency: number, p95BudgetMs: number) {
  const durations: number[] = [];
  let failures = 0;
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= requests) return;
      const route = routes[index % routes.length];
      const result = await requestOnce(route);
      durations.push(result.durationMs);
      if (!result.ok) {
        failures += 1;
        console.error(`[runtime-resource] ${name} request ${index + 1} ${route} failed: status=${result.status}${"error" in result ? ` error=${result.error}` : ""}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const wallMs = performance.now() - started;
  const sorted = durations.slice().sort((a, b) => a - b);
  const total = durations.reduce((sum, value) => sum + value, 0);
  const result: LoadResult = {
    name,
    requests,
    concurrency,
    failures,
    p50Ms: round(percentile(sorted, 0.5)),
    p95Ms: round(percentile(sorted, 0.95)),
    p99Ms: round(percentile(sorted, 0.99)),
    maxMs: round(sorted.at(-1) ?? 0),
    meanMs: round(sorted.length ? total / sorted.length : 0),
    requestsPerSecond: round(wallMs > 0 ? (requests * 1000) / wallMs : 0)
  };

  if (result.failures > 0) throw new Error(`${name} load recorded ${result.failures}/${requests} failed or unexpected responses.`);
  if (result.p95Ms > p95BudgetMs) throw new Error(`${name} p95 ${result.p95Ms}ms exceeded CI resource baseline budget ${p95BudgetMs}ms.`);
  return result;
}

async function terminateServer(child: ResourceServerProcess) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  const exited = new Promise<boolean>((resolve) => child.once("exit", () => resolve(true)));
  const graceful = await Promise.race([exited, sleep(5_000).then(() => false)]);
  if (!graceful && child.exitCode === null) child.kill("SIGKILL");
}

async function main() {
  if (process.platform !== "linux") throw new Error("Runtime resource baseline requires Linux /proc telemetry.");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`Invalid PERFORMANCE_RESOURCE_PORT: ${port}`);

  const child = spawn(process.execPath, [standaloneServer], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverOutput = "";
  child.stdout.on("data", (chunk) => { serverOutput = `${serverOutput}${String(chunk)}`.slice(-20_000); });
  child.stderr.on("data", (chunk) => { serverOutput = `${serverOutput}${String(chunk)}`.slice(-20_000); });

  const samples: ResourceSnapshot[] = [];
  let sampler: NodeJS.Timeout | undefined;

  try {
    await waitForServer(child);
    await warmRoutes();
    const baseline = readResourceSnapshot(child.pid!);
    samples.push(baseline);

    sampler = setInterval(() => {
      try {
        if (child.exitCode === null && child.pid) samples.push(readResourceSnapshot(child.pid));
      } catch {
        // The final liveness and explicit process-exit checks remain authoritative.
      }
    }, 50);

    const sustained = await runLoad("sustained", SUSTAINED_REQUESTS, SUSTAINED_CONCURRENCY, SUSTAINED_P95_BUDGET_MS);
    const spike = await runLoad("spike", SPIKE_REQUESTS, SPIKE_CONCURRENCY, SPIKE_P95_BUDGET_MS);

    if (sampler) clearInterval(sampler);
    sampler = undefined;
    if (child.exitCode !== null) throw new Error(`Standalone server exited under load with code ${child.exitCode}.`);

    const fdRecovery = await waitForFdRecovery(child.pid!, baseline.fileDescriptors);
    samples.push(...fdRecovery.samples);
    const postLoad = fdRecovery.snapshot;
    const postLoadLiveness = await requestOnce("/api/health/live");
    if (!postLoadLiveness.ok) throw new Error(`Post-load liveness failed with status ${postLoadLiveness.status}.`);

    const maxRssMb = Math.max(...samples.map((sample) => sample.rssMb));
    const maxHighWaterMb = Math.max(...samples.map((sample) => sample.highWaterMb));
    const maxFileDescriptors = Math.max(...samples.map((sample) => sample.fileDescriptors));
    const maxThreads = Math.max(...samples.map((sample) => sample.threads));
    const rssGrowthMb = round(maxRssMb - baseline.rssMb);

    if (maxRssMb > ABSOLUTE_RSS_BUDGET_MB) throw new Error(`Maximum RSS ${maxRssMb}MB exceeded ${ABSOLUTE_RSS_BUDGET_MB}MB CI budget.`);
    if (rssGrowthMb > RSS_GROWTH_BUDGET_MB) throw new Error(`RSS growth ${rssGrowthMb}MB exceeded ${RSS_GROWTH_BUDGET_MB}MB CI budget.`);
    if (maxFileDescriptors > baseline.fileDescriptors + FD_GROWTH_BUDGET) throw new Error(`File descriptors grew from ${baseline.fileDescriptors} to ${maxFileDescriptors}, exceeding bounded CI growth.`);
    if (!fdRecovery.recovered) throw new Error(`Post-load file descriptors ${postLoad.fileDescriptors} did not recover near baseline ${baseline.fileDescriptors} within ${POST_FD_RECOVERY_TIMEOUT_MS}ms.`);
    if (maxThreads > baseline.threads + THREAD_GROWTH_BUDGET) throw new Error(`Threads grew from ${baseline.threads} to ${maxThreads}, exceeding bounded CI growth.`);

    console.log(JSON.stringify({ event: "runtime_resource_load", runtime: "standalone", ...sustained }));
    console.log(JSON.stringify({ event: "runtime_resource_spike", runtime: "standalone", ...spike }));
    console.log(JSON.stringify({
      event: "runtime_resource_complete",
      runtime: "standalone",
      baseline,
      postLoad,
      fdRecoveryMs: fdRecovery.elapsedMs,
      maxRssMb: round(maxRssMb),
      maxHighWaterMb: round(maxHighWaterMb),
      rssGrowthMb,
      maxFileDescriptors,
      maxThreads,
      sampleCount: samples.length,
      postLoadLiveness: "passed",
      serverSurvivedSpike: true
    }));
  } catch (error) {
    console.error(serverOutput);
    throw error;
  } finally {
    if (sampler) clearInterval(sampler);
    await terminateServer(child);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
