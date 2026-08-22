import Image from "next/image";
import type { TravelMedia } from "@/domain/travel/types";

const objectPositionByFocalPoint: Record<NonNullable<TravelMedia["focalPoint"]>, string> = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center"
};

export function TravelImage({
  media,
  fallbackAlt,
  className,
  sizes,
  priority = false,
  quality = 82
}: {
  media: TravelMedia;
  fallbackAlt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
}) {
  return (
    <Image
      className={className}
      src={media.src}
      alt={media.alt ?? fallbackAlt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      style={{ objectPosition: objectPositionByFocalPoint[media.focalPoint ?? "center"] }}
    />
  );
}
