import { NextResponse } from "next/server";
import { getLocale } from "@/lib/get-locale";
import { getOperationsRepository } from "@/lib/operations-repository";
import { recordOperatorExportAudit } from "@/lib/operator-export-audit";
import { operatorExportResponse, parseExportFormat } from "@/lib/operator-export-response";
import {
  protectedTravellerTabularExport,
  readProtectedTravellerExportRows
} from "@/lib/protected-traveller-export";
import { browserMutationHasTrustedOrigin } from "@/lib/request-security";
import { requireStaffCapability } from "@/lib/require-staff-capability";
import { getServiceReservationForOperator } from "@/lib/service-reservations";
import { hasStaffCapability } from "@/lib/staff-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!browserMutationHasTrustedOrigin(request)) {
    return NextResponse.json({ error: "invalid-origin" }, {
      status: 403,
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  }

  const staff = await requireStaffCapability("traveller-data");
  if (!hasStaffCapability(staff, "reservations")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const format = parseExportFormat(formValue(formData, "format"));
  if (!format) return NextResponse.json({ error: "invalid-format" }, { status: 400 });
  const targetType = formValue(formData, "targetType");
  const targetId = formValue(formData, "targetId");
  const reason = formValue(formData, "reason");
  if ((targetType !== "trip" && targetType !== "service") || !targetId) {
    return NextResponse.json({ error: "invalid-target" }, { status: 400 });
  }
  if (reason.length < 10 || reason.length > 500) {
    return NextResponse.json({ error: "reason-required" }, { status: 400 });
  }

  let travellers;
  if (targetType === "trip") {
    const reservation = await getOperationsRepository().getReservation(targetId);
    if (!reservation) return NextResponse.json({ error: "not-found" }, { status: 404 });
    if (reservation.status === "cancelled") return NextResponse.json({ error: "cancelled-target" }, { status: 409 });
    travellers = reservation.travellers ?? [];
  } else {
    const reservation = await getServiceReservationForOperator(targetId);
    if (!reservation) return NextResponse.json({ error: "not-found" }, { status: 404 });
    if (reservation.status === "cancelled") return NextResponse.json({ error: "cancelled-target" }, { status: 409 });
    travellers = reservation.travellers;
  }

  if (!travellers.length) return NextResponse.json({ error: "no-travellers" }, { status: 409 });
  if (travellers.length > 500) return NextResponse.json({ error: "export-too-large", maxRows: 500 }, { status: 413 });

  const rows = await readProtectedTravellerExportRows({ targetType, reservationId: targetId, travellers });
  const locale = await getLocale();
  const table = protectedTravellerTabularExport(rows, locale);

  // Sensitive exports are fail-closed: persistent audit must succeed before any
  // decrypted value is returned to the browser.
  await recordOperatorExportAudit({
    exportType: "protected-travellers",
    format,
    actorIdentityId: staff.id,
    actorRole: staff.role,
    actorDisplayName: staff.displayName,
    sensitive: true,
    rowCount: table.rows.length,
    columns: table.columns.map((column) => column.key),
    reason,
    targetType,
    targetId,
    filters: { targetType, targetId }
  });

  return operatorExportResponse({
    table,
    format,
    filename: `protected-travellers-${targetId}`
  });
}