import { cookies } from "next/headers";
import type { OperationsAuditEvent } from "@/domain/operations/types";
import { DEMO_OPERATIONS_AUDIT_COOKIE } from "@/lib/operations-config";

function isAuditEvent(value: unknown): value is OperationsAuditEvent {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OperationsAuditEvent>;

  return (
    typeof item.id === "string" &&
    typeof item.reservationId === "string" &&
    typeof item.actorIdentityId === "string" &&
    (item.actorRole === "operator" || item.actorRole === "admin") &&
    (item.fromStatus === "pending" || item.fromStatus === "confirmed" || item.fromStatus === "cancelled") &&
    (item.toStatus === "pending" || item.toStatus === "confirmed" || item.toStatus === "cancelled") &&
    typeof item.occurredAt === "string"
  );
}

export async function readDemoOperationsAudit() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_OPERATIONS_AUDIT_COOKIE)?.value;

  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAuditEvent).slice(-10) : [];
  } catch {
    return [];
  }
}

export async function writeDemoOperationsAudit(events: OperationsAuditEvent[]) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_OPERATIONS_AUDIT_COOKIE, JSON.stringify(events.slice(-10)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}
