import { randomUUID } from "node:crypto";

export type OperationalLogLevel = "info" | "warn" | "error";
export type OperationalLogScalar = string | number | boolean | null;
export type OperationalLogFields = Record<string, OperationalLogScalar | undefined>;

export type OperationalLogInput = {
  level: OperationalLogLevel;
  event: string;
  component: string;
  correlationId?: string;
  fields?: OperationalLogFields;
  error?: unknown;
};

const serviceName = "open-travel-platform";
const schemaVersion = 1;
const maximumTextLength = 240;
const requestIdPattern = /^[A-Za-z0-9._:-]{8,128}$/;
const safeTokenPattern = /^[A-Za-z0-9._:-]{1,120}$/;
const sensitiveKeyPattern = /(?:authorization|cookie|password|secret|token|signature|email|phone|address|passport|dni|document|health|traveller|raw|body|payload|card|pan|cvv|customer|reference|amount|currency|price|cost)/i;

function normalizeText(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.slice(0, maximumTextLength);
}

export function safeOperationalToken(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return safeTokenPattern.test(normalized) ? normalized : undefined;
}

export function sanitizeOperationalFields(fields: OperationalLogFields | undefined) {
  if (!fields) return undefined;
  const output: Record<string, OperationalLogScalar> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (sensitiveKeyPattern.test(key) || value === undefined) continue;
    if (typeof value === "string") {
      const normalized = normalizeText(value);
      if (normalized !== undefined) output[key] = normalized;
      continue;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) output[key] = value;
      continue;
    }
    if (typeof value === "boolean" || value === null) output[key] = value;
  }

  return Object.keys(output).length ? output : undefined;
}

export function describeOperationalError(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const errorType = error instanceof Error ? safeOperationalToken(error.name) : undefined;
  const code = "code" in error ? safeOperationalToken((error as { code?: unknown }).code) : undefined;
  if (!errorType && !code) return undefined;
  return {
    ...(errorType ? { errorType } : {}),
    ...(code ? { errorCode: code } : {})
  };
}

export function getRequestCorrelationId(request: Request) {
  const provided = request.headers.get("x-request-id")?.trim() ?? "";
  if (requestIdPattern.test(provided)) return provided;
  return `req-${randomUUID()}`;
}

export function correlationHeaders(correlationId: string): HeadersInit {
  return { "X-Request-Id": correlationId };
}

export function emitOperationalLog(input: OperationalLogInput) {
  try {
    const event = safeOperationalToken(input.event) ?? "operational-event";
    const component = safeOperationalToken(input.component) ?? "unknown";
    const fields = sanitizeOperationalFields(input.fields);
    const error = describeOperationalError(input.error);
    const record = {
      schemaVersion,
      timestamp: new Date().toISOString(),
      service: serviceName,
      level: input.level,
      event,
      component,
      ...(input.correlationId && requestIdPattern.test(input.correlationId)
        ? { correlationId: input.correlationId }
        : {}),
      ...(fields ? { fields } : {}),
      ...(error ? error : {})
    };
    const line = JSON.stringify(record);
    if (input.level === "error") console.error(line);
    else if (input.level === "warn") console.warn(line);
    else console.info(line);
  } catch {
    // Logging must never turn an operational failure into a secondary failure.
  }
}
