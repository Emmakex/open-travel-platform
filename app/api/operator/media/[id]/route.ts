import { NextResponse } from "next/server";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import { deleteMediaFromLibrary, getMediaUsage } from "@/lib/media-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canManageMedia() {
  const identity = await getIdentityRepository().getCurrentIdentity();
  return hasOperationsAccess(identity);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await canManageMedia())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const usage = await getMediaUsage(id);
  if (usage.total > 0) {
    return NextResponse.json({ error: "media-in-use", usage }, { status: 409 });
  }

  try {
    await deleteMediaFromLibrary(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Media deletion failed", { id, error });
    return NextResponse.json({ error: "delete-failed" }, { status: 500 });
  }
}
