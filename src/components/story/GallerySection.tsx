import { EditorialImage } from "@/components/ui/EditorialImage";
import type { GalleryImageData } from "@/sanity/types";

const tileClasses = [
  "md:col-span-2 md:row-span-2 min-h-[420px]",
  "min-h-[250px]",
  "min-h-[250px]",
  "min-h-[300px]",
  "md:col-span-2 min-h-[300px]",
];

export function GallerySection({ images }: { images: GalleryImageData[] }) {
  if (!images.length) return null;

  const visibleImages = images.slice(0, 5);

  return (
    <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-end">
          <div>
            <p className="editorial-caption mb-4 text-gold">Gallery</p>
            <h2 className="editorial-display text-balance text-[clamp(2.45rem,4vw,4.8rem)] font-light leading-[0.98] text-charcoal">
              Glimpses of fire, food, and full tables.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-[1.65] text-stone md:ml-auto md:text-base">
            A compact look at the details around the dining room: hands at
            work, plates moving, the glow of service, and the warmth guests
            remember after the evening ends.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-4">
          {visibleImages.map((item, index) => (
            <figure
              key={item._id}
              className={`group relative overflow-hidden rounded-[1.8rem] bg-charcoal shadow-[0_20px_70px_rgba(22,15,11,0.1)] ${
                tileClasses[index % tileClasses.length]
              }`}
            >
              <EditorialImage
                src={item.image}
                alt={item.alt ?? item.title}
                sizes="(max-width: 768px) 100vw, 38vw"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
              {item.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm leading-[1.5] text-ivory/82">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
