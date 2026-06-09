import { EditorialImage } from "@/components/ui/EditorialImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getMenuItems } from "@/sanity/fetch";
import Link from "next/link";

const sectionLabels: Record<string, string> = {
  "from-the-fire": "From the Fire",
  "at-the-centre": "At the Centre",
  sides: "Sides",
  desserts: "Desserts",
  drinks: "Drinks",
};

export async function generateMetadata() {
  return buildMetadata({
    title: "Menu | Seasonal Nigerian Cuisine",
    description:
      "Explore the NaijaGrill menu — suya, jollof, egusi, and premium Nigerian dishes in Handsworth, Birmingham.",
    path: "/menu",
  });
}

export default async function MenuPage() {
  const items = await getMenuItems();
  const sections = [...new Set(items.map((item) => item.section))];

  return (
    <div className="bg-ivory pt-32">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ])}
      />
      <div className="relative h-[50vh] min-h-[400px]">
        <EditorialImage
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2400&q=85"
          alt="Artfully plated Nigerian dishes"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-charcoal/40" />
        <div className="relative mx-auto flex h-full max-w-[1600px] items-end px-6 pb-16 md:px-12 lg:px-16">
          <div>
            <p className="editorial-caption mb-4 text-ivory/75">Menu</p>
            <h1 className="editorial-display text-[clamp(2.5rem,6vw,5rem)] font-light text-ivory">
              Seasonal. Intentional.
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-32">
        {sections.map((section) => (
          <section key={section} className="mb-20 last:mb-0">
            <h2 className="editorial-caption mb-12 border-b border-charcoal/10 pb-6">
              {sectionLabels[section] ?? section}
            </h2>
            <ul className="space-y-10">
              {items
                .filter((item) => item.section === section)
                .map((item) => (
                  <li
                    key={item._id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="max-w-lg">
                      <h3 className="editorial-display text-3xl font-light text-charcoal">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-stone">
                        {item.description}
                      </p>
                    </div>
                    <p className="editorial-display shrink-0 text-2xl font-light text-gold">
                      &pound;{item.price}
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        ))}

        <div className="mt-24 text-center">
          <Link href="/reservations" className="editorial-link">
            Reserve your table
          </Link>
        </div>
      </div>
    </div>
  );
}
