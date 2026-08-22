import { GridFSBucket, ObjectId, type GridFSFile } from "mongodb";
import { getMongoDatabase } from "@/lib/mongodb";
import { travelCollectionNames } from "@/adapters/mongo-travel-repository";

export const travelMediaBucketName = "travel_media";
export const maxTravelMediaBytes = 8 * 1024 * 1024;

export type MediaLibraryItem = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  alt?: string;
  credit?: string;
};

type TravelMediaMetadata = {
  originalName?: string;
  contentType?: string;
  alt?: string;
  credit?: string;
  uploadedBy?: string;
};

function mediaUrl(id: string) {
  return `/media/${id}`;
}

function toItem(file: GridFSFile): MediaLibraryItem {
  const metadata = (file.metadata ?? {}) as TravelMediaMetadata;
  const id = file._id.toString();

  return {
    id,
    url: mediaUrl(id),
    filename: file.filename,
    originalName: metadata.originalName || file.filename,
    contentType: metadata.contentType || "application/octet-stream",
    size: file.length,
    uploadedAt: file.uploadDate.toISOString(),
    alt: metadata.alt || undefined,
    credit: metadata.credit || undefined
  };
}

async function getBucket() {
  return new GridFSBucket(await getMongoDatabase(), { bucketName: travelMediaBucketName });
}

export async function listMediaLibrary(limit = 100): Promise<MediaLibraryItem[]> {
  const bucket = await getBucket();
  const files = await bucket.find({}).sort({ uploadDate: -1 }).limit(Math.max(1, Math.min(limit, 200))).toArray();
  return files.map(toItem);
}

export async function getMediaLibraryItem(id: string): Promise<MediaLibraryItem | null> {
  if (!ObjectId.isValid(id)) return null;
  const bucket = await getBucket();
  const file = await bucket.find({ _id: new ObjectId(id) }).next();
  return file ? toItem(file) : null;
}

export async function uploadMediaToLibrary(input: {
  buffer: Buffer;
  filename: string;
  originalName: string;
  contentType: string;
  alt?: string;
  credit?: string;
  uploadedBy?: string;
}) {
  const bucket = await getBucket();
  const upload = bucket.openUploadStream(input.filename, {
    metadata: {
      originalName: input.originalName,
      contentType: input.contentType,
      alt: input.alt || undefined,
      credit: input.credit || undefined,
      uploadedBy: input.uploadedBy || undefined
    } satisfies TravelMediaMetadata
  });

  await new Promise<void>((resolve, reject) => {
    upload.once("error", reject);
    upload.once("finish", () => resolve());
    upload.end(input.buffer);
  });

  const item = await getMediaLibraryItem(upload.id.toString());
  if (!item) throw new Error("Uploaded media record could not be read back from GridFS.");
  return item;
}

export async function downloadMediaFromLibrary(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const bucket = await getBucket();
  const objectId = new ObjectId(id);
  const file = await bucket.find({ _id: objectId }).next();
  if (!file) return null;

  const chunks: Buffer[] = [];
  const stream = bucket.openDownloadStream(objectId);
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return {
    item: toItem(file),
    buffer: Buffer.concat(chunks)
  };
}

export async function getMediaUsage(id: string) {
  const src = mediaUrl(id);
  const database = await getMongoDatabase();
  const query = {
    $or: [
      { "coverImage.src": src },
      { gallery: { $elemMatch: { src } } }
    ]
  };

  const [destinations, trips] = await Promise.all([
    database.collection(travelCollectionNames.destinations).countDocuments(query),
    database.collection(travelCollectionNames.trips).countDocuments(query)
  ]);

  return { destinations, trips, total: destinations + trips };
}

export async function deleteMediaFromLibrary(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const usage = await getMediaUsage(id);
  if (usage.total > 0) {
    const error = new Error("Media is in use by catalogue records.");
    Object.assign(error, { code: "MEDIA_IN_USE", usage });
    throw error;
  }

  const bucket = await getBucket();
  await bucket.delete(new ObjectId(id));
  return true;
}
