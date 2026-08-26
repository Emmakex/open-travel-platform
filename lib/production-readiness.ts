import { getMongoDatabase, isMongoConfigured } from "@/lib/mongodb";

export type DeploymentProfile = "demo" | "live";

export type ProductionReadinessResult = {
  ready: boolean;
  profile: DeploymentProfile;
  checks: {
    configuration: "ok" | "fail";
    database: "ok" | "fail" | "skipped";
    worker: "ok" | "fail" | "skipped";
  };
};

function value(name: string) {
  return (process.env[name] ?? "").trim().toLowerCase();
}

export function getDeploymentProfile(): DeploymentProfile {
  return value("KTRAVEL_DEPLOYMENT_PROFILE") === "live" ? "live" : "demo";
}

function validPublicUrlForLiveProfile() {
  try {
    const url = new URL(process.env.KTRAVEL_PUBLIC_URL ?? "");
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function liveProfileUsesDemoCapability() {
  return [
    value("NEXT_PUBLIC_DATA_MODE"),
    value("TRAVEL_DATA_MODE"),
    value("IDENTITY_MODE"),
    value("STAFF_AUTH_MODE"),
    value("BOOKING_MODE"),
    value("OPERATIONS_MODE")
  ].some((mode) => mode === "demo");
}

function configurationRequiresMongo() {
  if (
    [
      value("TRAVEL_DATA_MODE"),
      value("IDENTITY_MODE"),
      value("STAFF_AUTH_MODE"),
      value("BOOKING_MODE"),
      value("OPERATIONS_MODE"),
      value("PAYMENT_LEDGER_MODE")
    ].some((mode) => mode === "mongodb")
  ) {
    return true;
  }

  return [
    value("SUPPLIER_FULFILMENT_ADAPTER_MODE"),
    value("CRM_SYNC_MODE"),
    value("ERP_ACCOUNTING_MODE")
  ].some((mode) => mode === "rest");
}

function outboundWorkerRequired() {
  return [
    value("SUPPLIER_FULFILMENT_ADAPTER_MODE"),
    value("CRM_SYNC_MODE"),
    value("ERP_ACCOUNTING_MODE")
  ].some((mode) => mode === "rest");
}

function workerConfigured() {
  return (process.env.KTRAVEL_INTEGRATION_WORKER_TOKEN ?? "").trim().length >= 32;
}

export async function getProductionReadiness(): Promise<ProductionReadinessResult> {
  const profile = getDeploymentProfile();
  const mongoRequired = configurationRequiresMongo();
  const workerRequired = outboundWorkerRequired();

  const configurationOk = profile !== "live" || (
    validPublicUrlForLiveProfile() &&
    !liveProfileUsesDemoCapability() &&
    value("DEMO_IDENTITY_ENABLED") !== "true" &&
    value("DEMO_BOOKING_ENABLED") !== "true" &&
    value("DEMO_OPERATIONS_ENABLED") !== "true"
  );

  let database: ProductionReadinessResult["checks"]["database"] = "skipped";
  if (mongoRequired) {
    if (!isMongoConfigured()) {
      database = "fail";
    } else {
      try {
        const db = await getMongoDatabase();
        await db.command({ ping: 1 });
        database = "ok";
      } catch {
        database = "fail";
      }
    }
  }

  const worker: ProductionReadinessResult["checks"]["worker"] = workerRequired
    ? (workerConfigured() ? "ok" : "fail")
    : "skipped";

  return {
    ready: configurationOk && database !== "fail" && worker !== "fail",
    profile,
    checks: {
      configuration: configurationOk ? "ok" : "fail",
      database,
      worker
    }
  };
}
