import Image from "next/image";
import type { TravelMedia } from "@/domain/travel/types";

export function TravelMediaGallery({
  items,
  title
}: {
  items?: TravelMedia[];
  title: string;
}) {
  if (!items?.length) return null;

  const visible = items.slice(0, 3);

  return (
    <div className={`travel-gallery travel-gallery-count-${visible.length}`} aria-label={`${title} gallery`}>
      {visible.map((item, index) => (
        <figure className={`travel-gallery-item travel-gallery-item-${index + 1}`} key={`${item.src}-${index}`}>
          <Image
            src={item.src}
            alt={item.alt ?? title}
            fill
            sizes={index === 0 ? "(max-width: 880px) 100vw, 66vw" : "(max-width: 880px) 50vw, 33vw"}
          />
          {item.caption ? <figcaption>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
