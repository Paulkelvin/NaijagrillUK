import { GallerySection } from "@/components/story/GallerySection";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getGalleryImages } from "@/sanity/fetch";

export async function generateMetadata() {
  return buildMetadata({
    title: "Our Story",
    description:
      "The story of NaijaGrill — premium Nigerian cuisine in Handsworth, Birmingham.",
    path: "/story",
  });
}

export default async function StoryPage() {
  const gallery = await getGalleryImages();

  return (
    <div className="bg-ivory pt-32">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Our Story", path: "/story" },
        ])}
      />
      <div className="mx-auto max-w-[1600px] px-6 pb-24 md:px-12 md:pb-36 lg:px-16">
        <div className="max-w-3xl">
          <p className="editorial-caption mb-8">Our Story</p>
          <h1 className="editorial-display text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-charcoal">
            Built on memory, refined for Birmingham.
          </h1>
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="relative aspect-[3/4] lg:col-span-5">
            <EditorialImage
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85"
              alt="Hands preparing ingredients in a professional kitchen"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          <div className="flex flex-col justify-center space-y-8 text-base leading-[1.9] text-stone md:text-lg lg:col-span-6 lg:col-start-7">
            <p>
              Naija Grill began in family kitchens — the sound of pestle against
              mortar, the patience of a pot left to its own rhythm, the
              generosity of feeding everyone who walked through the door.
            </p>
            <p>
              On Rookery Road in Handsworth, we carry that spirit into a dining
              room shaped by precision: sourcing from trusted suppliers, firing
              over charcoal, and plating with the quiet confidence of a luxury
              hospitality brand.
            </p>
            <p>
              We are not trying to translate Nigerian food for a Western
              palate. We are presenting it as it deserves to be seen — complex,
              celebratory, and utterly at home among Birmingham&apos;s finest
              tables.
            </p>
          </div>
        </div>

        <GallerySection images={gallery} />
      </div>
    </div>
  );
}
