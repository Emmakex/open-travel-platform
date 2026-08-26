import { NextResponse } from "next/server";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { deleteMediaFromLibrary, getMediaUsage } from "@/lib/media-library";
import { browserMutationHasTrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canManageMedia() {
  const identity = await getIdentityRepository().getCurrentIdentity();
  return hasOperationsAccess(identity);
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!browserMutationHasTrustedOrigin(request)) {
    return json({ error: "invalid-origin" }, 403);
  }

  if (!(await canManageMedia())) {
    return json({ error: "forbidden" }, 403);
  }

  const { id } = await context.params;
  const usage = await getMediaUsage(id);
  if (usage.total > 0) {
    return json({ error: "media-in-use", usage }, 409);
  }

  try {
    await deleteMediaFromLibrary(id);
    return json({ deleted: true });
  } catch (error) {
    console.error("Media deletion failed", { id, error });
    return json({ error: "delete-failed" }, 500);
  }
}