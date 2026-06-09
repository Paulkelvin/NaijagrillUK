import { EditorialImage } from "@/components/ui/EditorialImage";
import type { GalleryImageData } from "@/sanity/types";

const widthClasses = ["w-full lg:w-[72%]", "w-full lg:ml-auto lg:w-[58%]", "w-full lg:w-[65%]"];

export function GallerySection({ images }: { images: GalleryImageData[] }) {
  if (!images.length) return null;

  return (
    <section className="mt-32 border-t border-charcoal/10 pt-32">
      <p className="editorial-caption mb-8">Gallery</p>
      <h2 className="editorial-display mb-20 text-4xl font-light text-charcoal md:text-5xl">
        Moments from the room.
      </h2>

      <div className="space-y-16 md:space-y-24">
        {images.map((item, index) => (
          <figure key={item._id} className={widthClasses[index % widthClasses.length]}>
            <div className="relative aspect-[16/10]">
              <EditorialImage
                src={item.image}
                alt={item.alt ?? item.title}
                sizes="(max-width: 1024px) 100vw, 70vw"
              />
            </div>
            {item.caption && (
              <figcaption className="mt-4 text-sm text-stone">{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
