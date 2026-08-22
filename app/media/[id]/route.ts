import { downloadMediaFromLibrary } from "@/lib/media-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const media = await downloadMediaFromLibrary(id);

  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(media.buffer, {
    headers: {
      "Content-Type": media.item.contentType,
      "Content-Length": String(media.buffer.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
