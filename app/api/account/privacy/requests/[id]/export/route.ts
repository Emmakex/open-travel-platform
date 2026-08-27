import { buildApprovedPrivacyExport } from "@/lib/privacy-export";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";

export const dynamic = "force-dynamic";

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const identity = await requireCustomerIdentity();
  const { id } = await context.params;
  if (!/^prq-[A-Za-z0-9-]{10,80}$/.test(id)) {
    return Response.json({ error: "Privacy request not found." }, { status: 404 });
  }

  try {
    const data = await buildApprovedPrivacyExport({ identityId: identity.id, requestId: id });
    const body = JSON.stringify(data, null, 2);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="privacy-${data.request.type}-${id}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    const code = errorCode(error);
    if (code === "PRIVACY_REQUEST_NOT_FOUND") {
      return Response.json({ error: "Privacy request not found." }, { status: 404 });
    }
    if (code === "PRIVACY_EXPORT_NOT_APPROVED" || code === "PRIVACY_EXPORT_NOT_APPLICABLE") {
      return Response.json({ error: "Privacy export is not available yet." }, { status: 409 });
    }
    if (code === "PRIVACY_EXPORT_PROTECTED_DATA_UNAVAILABLE") {
      return Response.json({ error: "Privacy export is temporarily unavailable." }, { status: 503 });
    }
    throw error;
  }
}
