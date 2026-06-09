import Link from "next/link";
import { FaqSection } from "@/components/blog/FaqSection";
import { PortableTextContent } from "@/components/blog/PortableTextContent";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqSchema,
} from "@/lib/seo/structured-data";
import { getExplorePage } from "@/sanity/fetch";
import { resolveImageSrc } from "@/sanity/resolve-image";

export async function generateMetadata() {
  const page = await getExplorePage();
  return buildMetadata({
    title: page.seo?.title ?? page.title,
    description: page.seo?.description ?? page.subtitle,
    path: "/explore-nigerian-cuisine",
    seo: page.seo,
    image: resolveImageSrc(page.heroImage, 1200),
  });
}

export default async function ExploreNigerianCuisinePage() {
  const page = await getExplorePage();
  const faqJsonLd = faqSchema(page.faqs ?? []);

  return (
    <div className="bg-ivory pt-32">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            {
              name: "Explore Nigerian Cuisine",
              path: "/explore-nigerian-cuisine",
            },
          ]),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />

      <div className="relative h-[60vh] min-h-[480px]">
        <EditorialImage
          src={page.heroImage}
          alt={page.title}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-charcoal/40" />
        <div className="relative mx-auto flex h-full max-w-[1600px] items-end px-6 pb-16 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <p className="editorial-caption mb-4 text-ivory/75">Long-form guide</p>
            <h1 className="editorial-display text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-[0.95] text-ivory">
              {page.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/85">
              {page.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-32">
        <PortableTextContent value={page.introduction} />

        <div className="mt-24 space-y-32">
          {page.sections.map((section) => (
            <section
              key={section.heading}
              className={
                section.imagePosition === "full"
                  ? ""
                  : "grid items-center gap-12 lg:grid-cols-12"
              }
            >
              {section.image &&
                section.imagePosition !== "full" &&
                section.imagePosition !== "right" && (
                  <div className="relative aspect-[4/3] lg:col-span-6">
                    <EditorialImage
                      src={section.image}
                      alt={section.heading}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}

              <div
                className={
                  section.imagePosition === "full"
                    ? ""
                    : `lg:col-span-6 ${
                        section.imagePosition === "right"
                          ? "lg:order-first"
                          : ""
                      }`
                }
              >
                <h2 className="editorial-display text-4xl font-light text-charcoal md:text-5xl">
                  {section.heading}
                </h2>
                <PortableTextContent value={section.body} />
              </div>

              {section.image &&
                section.imagePosition === "right" && (
                  <div className="relative aspect-[4/3] lg:col-span-6">
                    <EditorialImage
                      src={section.image}
                      alt={section.heading}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}

              {section.image && section.imagePosition === "full" && (
                <div className="relative mt-12 aspect-[21/9]">
                  <EditorialImage
                    src={section.image}
                    alt={section.heading}
                    sizes="100vw"
                  />
                </div>
              )}
            </section>
          ))}
        </div>

        {page.faqs && <FaqSection faqs={page.faqs} title="Frequently Asked" />}

        <div className="mt-24 border-t border-charcoal/10 pt-16 text-center">
          <p className="mb-8 text-stone">
            Ready to taste it for yourself in Handsworth?
          </p>
          <Link href="/reservations" className="editorial-link">
            Reserve your table
          </Link>
        </div>
      </div>
    </div>
  );
}
