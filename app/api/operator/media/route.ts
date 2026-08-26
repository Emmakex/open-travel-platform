import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import {
  listMediaLibrary,
  maxTravelMediaBytes,
  uploadMediaToLibrary
} from "@/lib/media-library";
import { browserMutationHasTrustedOrigin } from "@/lib/request-security";
import { hasStaffCapability } from "@/lib/staff-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function getCatalogueIdentity() {
  const identity = await getIdentityRepository().getCurrentIdentity();
  return hasOperationsAccess(identity) && hasStaffCapability(identity, "catalogue") ? identity : null;
}

function safeFilename(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  return `${Date.now()}-${randomUUID()}-${cleaned || "travel-image"}`;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

export async function GET() {
  const identity = await getCatalogueIdentity();
  if (!identity) return json({ error: "forbidden" }, 403);

  const items = await listMediaLibrary();
  return json({ items });
}

export async function POST(request: Request) {
  if (!browserMutationHasTrustedOrigin(request)) {
    return json({ error: "invalid-origin" }, 403);
  }

  const identity = await getCatalogueIdentity();
  if (!identity) return json({ error: "forbidden" }, 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "invalid-form-data" }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ error: "file-required" }, 400);
  }

  if (!allowedTypes.has(file.type)) {
    return json({ error: "unsupported-type", allowed: Array.from(allowedTypes) }, 415);
  }

  if (file.size < 1 || file.size > maxTravelMediaBytes) {
    return json({ error: "invalid-size", maxBytes: maxTravelMediaBytes }, 413);
  }

  const alt = typeof formData.get("alt") === "string" ? String(formData.get("alt")).trim() : "";
  const credit = typeof formData.get("credit") === "string" ? String(formData.get("credit")).trim() : "";

  try {
    const item = await uploadMediaToLibrary({
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: safeFilename(file.name),
      originalName: file.name,
      contentType: file.type,
      alt: alt || undefined,
      credit: credit || undefined,
      uploadedBy: identity.email
    });

    return json({ item }, 201);
  } catch (error) {
    console.error("Media upload failed", error);
    return json({ error: "upload-failed" }, 500);
  }
}