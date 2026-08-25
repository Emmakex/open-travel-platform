import type { ReservationPriority } from "../domain/operations/types.ts";

const priorities = new Set<ReservationPriority>(["low", "normal", "high", "urgent"]);
const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function isReservationPriority(value: string): value is ReservationPriority {
  return priorities.has(value as ReservationPriority);
}

export function normalizeReservationTags(values: string[]) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const tag = raw.replace(controlCharacters, "").trim().replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > 40) return null;
    const key = tag.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
    if (normalized.length > 10) return null;
  }

  return normalized;
}

export function parseReservationTags(value: string) {
  return normalizeReservationTags(value.split(","));
}

export function normalizeInternalNote(value: string) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(controlCharacters, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

  if (!normalized || normalized.length > 2000) return null;
  return normalized;
}

export function tagsSnapshot(tags: string[]) {
  return tags.join(", ");
}
