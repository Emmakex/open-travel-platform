import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasOperationsAccess } from "@/lib/access-control";
import { getIdentityRepository } from "@/lib/identity-repository";
import {
  listMediaLibrary,
  maxTravelMediaBytes,
  uploadMediaToLibrary
} from "@/lib/media-library";
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

export async function GET() {
  const identity = await getCatalogueIdentity();
  if (!identity) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const items = await listMediaLibrary();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const identity = await getCatalogueIdentity();
  if (!identity) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid-form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file-required" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported-type", allowed: Array.from(allowedTypes) },
      { status: 415 }
    );
  }

  if (file.size < 1 || file.size > maxTravelMediaBytes) {
    return NextResponse.json(
      { error: "invalid-size", maxBytes: maxTravelMediaBytes },
      { status: 413 }
    );
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

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Media upload failed", error);
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }
}
