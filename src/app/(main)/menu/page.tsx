import { JsonLd } from "@/components/seo/JsonLd";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getMenuItems } from "@/sanity/fetch";
import type { MenuItemData, SanityImage } from "@/sanity/types";
import Link from "next/link";

type MenuDish = {
  title: string;
  description: string;
  price: string;
  category: string;
  image: SanityImage | string;
  badge?: string;
};

type MenuSection = {
  id: string;
  label: string;
  kicker: string;
  description: string;
};

const fallbackImage =
  "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg";

const localMenuImages: Record<string, string> = {
  "White Rice with Ofada Stew":
    "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
  "White Rice with Ayamase":
    "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
  "Jollof Rice":
    "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "Fried Rice":
    "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
  "Poundo with Egusi": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "Egusi Soup": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "Efo Riro": "/images/menu/naijagrill-efo-riro-soup.jpg",
  "Assorted Meat Pepper Soup":
    "/images/menu/naijagrill-assorted-meat-pepper-soup.jpg",
  "Peppered Hake Fish":
    "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
  "Grilled Tilapia":
    "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg",
  "Puff Puff": "/images/menu/naijagrill-small-chops-platter.jpg",
  "Vegetable Samosa": "/images/menu/naijagrill-small-chops-platter.jpg",
  "Spring Rolls": "/images/menu/naijagrill-small-chops-platter.jpg",
  "Fried Plantain": "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
  "Moi Moi": "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
};

const menuSections: MenuSection[] = [
  {
    id: "rice-specials",
    label: "Rice Specials",
    kicker: "Saucy plates",
    description: "Comfort plates built for stew, spice, plantain, and delivery.",
  },
  {
    id: "soups-swallows",
    label: "Soups & Swallows",
    kicker: "Big bowls",
    description: "Egusi, efo, okro, and swallows for a proper Nigerian meal.",
  },
  {
    id: "grill-suya",
    label: "Grill & Suya",
    kicker: "From the fire",
    description: "Smoky skewers, wings, and suya spice for sharing.",
  },
  {
    id: "seafood-pepper",
    label: "Seafood & Pepper Soup",
    kicker: "Pepper heat",
    description: "Hot broths, fish, and peppered plates with real kick.",
  },
  {
    id: "small-chops",
    label: "Small Chops",
    kicker: "Start here",
    description: "Crispy, snackable favourites for the table or delivery bag.",
  },
  {
    id: "sides-drinks",
    label: "Sides & Drinks",
    kicker: "Finish the order",
    description: "Add-ons that round out rice, soup, and grill orders.",
  },
];

const curatedMenu: MenuDish[] = [
  {
    title: "White Rice with Ofada Stew",
    description:
      "Steamed white rice with rich ofada sauce, peppers, locust beans, and assorted meat.",
    price: "from \u00a314.99",
    category: "rice-specials",
    badge: "Featured",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "White Rice with Ayamase",
    description:
      "Green pepper stew with deep savoury heat, served over fluffy white rice.",
    price: "from \u00a314.99",
    category: "rice-specials",
    badge: "Delivery favourite",
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Jollof Rice",
    description:
      "Party-style tomato rice with smoky pepper flavour and your choice of protein.",
    price: "from \u00a312.99",
    category: "rice-specials",
    image:
      "https://images.unsplash.com/photo-1626201850126-28cfee36c5da?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Fried Rice",
    description:
      "Colourful Nigerian fried rice with vegetables, seasoning, and grilled protein options.",
    price: "from \u00a312.99",
    category: "rice-specials",
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Poundo with Egusi",
    description:
      "Soft poundo served with melon seed egusi soup, greens, stockfish, and tender meat.",
    price: "from \u00a316.99",
    category: "soups-swallows",
    badge: "Featured",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Egusi Soup",
    description:
      "Thick melon seed soup with vegetables, palm oil, fish, and assorted meat.",
    price: "from \u00a314.99",
    category: "soups-swallows",
    image:
      "https://images.unsplash.com/photo-1604908554027-783da66d82b8?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Efo Riro",
    description:
      "Spinach stew cooked with peppers, iru, palm oil, and your chosen protein.",
    price: "from \u00a314.99",
    category: "soups-swallows",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Okro Soup",
    description:
      "Silky okro soup with seafood notes, meat, and your choice of swallow.",
    price: "from \u00a314.99",
    category: "soups-swallows",
    image:
      "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Beef Suya",
    description:
      "Thin-cut beef coated in yaji spice, grilled hot, and finished with onions.",
    price: "from \u00a310.99",
    category: "grill-suya",
    badge: "Featured",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Chicken Suya",
    description:
      "Grilled chicken with suya spice, fresh onions, tomatoes, and chilli.",
    price: "from \u00a310.99",
    category: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Suya Chicken Wings",
    description:
      "Crispy wings tossed with suya seasoning and served with a pepper dip.",
    price: "from \u00a38.99",
    category: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Grilled Tilapia",
    description:
      "Whole tilapia grilled with peppers, onions, herbs, and plantain on the side.",
    price: "from \u00a318.99",
    category: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Assorted Meat Pepper Soup",
    description:
      "Aromatic pepper soup with mixed meats, herbs, chilli, and warming spice.",
    price: "from \u00a313.99",
    category: "seafood-pepper",
    badge: "Featured",
    image:
      "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Peppered Hake Fish",
    description:
      "Hake fish in a bold pepper sauce with onions, peppers, and a citrus lift.",
    price: "from \u00a315.99",
    category: "seafood-pepper",
    badge: "Featured",
    image:
      "https://images.unsplash.com/photo-1601314002592-b8734bca6604?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Catfish Pepper Soup",
    description:
      "Peppery catfish broth with scent leaf, spices, and slow-building heat.",
    price: "from \u00a314.99",
    category: "seafood-pepper",
    image:
      "https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Puff Puff",
    description:
      "Golden sweet dough bites, soft inside and perfect before the main order.",
    price: "from \u00a34.99",
    category: "small-chops",
    image:
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Vegetable Samosa",
    description:
      "Crisp pastry filled with seasoned vegetables and served with dip.",
    price: "from \u00a34.99",
    category: "small-chops",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Spring Rolls",
    description:
      "Crunchy vegetable spring rolls with a sweet chilli dipping sauce.",
    price: "from \u00a34.99",
    category: "small-chops",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Fried Plantain",
    description: "Sweet ripe plantain fried until caramelised at the edges.",
    price: "from \u00a34.99",
    category: "sides-drinks",
    image:
      "https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Moi Moi",
    description:
      "Steamed bean pudding with pepper, onion, and a soft savoury finish.",
    price: "from \u00a35.99",
    category: "sides-drinks",
    image:
      "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "Soft Drinks",
    description: "Cold drinks to balance pepper soup, suya, and rice plates.",
    price: "from \u00a32.50",
    category: "sides-drinks",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1400&q=85",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Menu | Nigerian Food for Dine-In & Uber Eats",
    description:
      "Explore NaijaGrill's Nigerian menu in Handsworth, Birmingham - rice bowls, egusi, ayamase, suya, pepper soup, fish, sides, and delivery favourites.",
    path: "/menu",
  });
}

function categoryForSanitySection(section: string) {
  const map: Record<string, string> = {
    "rice-specials": "rice-specials",
    "soups-swallows": "soups-swallows",
    "grill-suya": "grill-suya",
    "seafood-pepper": "seafood-pepper",
    "small-chops": "small-chops",
    "sides-drinks": "sides-drinks",
    "from-the-fire": "grill-suya",
    "at-the-centre": "rice-specials",
    sides: "sides-drinks",
    desserts: "small-chops",
    drinks: "sides-drinks",
  };

  return map[section] ?? "rice-specials";
}

function formatPrice(price: number) {
  return `from £${price.toFixed(price % 1 === 0 ? 0 : 2)}`;
}

function menuImageForItem(item: MenuItemData) {
  return localMenuImages[item.title] ?? item.localImage ?? item.image ?? fallbackImage;
}

function buildMenuDishes(cmsItems: MenuItemData[]) {
  if (!cmsItems.length) {
    return curatedMenu.map((item) => ({
      ...item,
      image: localMenuImages[item.title] ?? item.image,
    }));
  }

  return cmsItems.map<MenuDish>((item) => ({
    title: item.title,
    description: item.description,
    price: formatPrice(item.price),
    category: categoryForSanitySection(item.section),
    image: menuImageForItem(item),
    badge: item.badge,
  }));
}

function absoluteImageUrl(image: MenuDish["image"]) {
  if (typeof image !== "string") return `${BUSINESS.website}/opengraph-image`;
  if (image.startsWith("http")) return image;
  return `${BUSINESS.website}${image}`;
}

function menuPageSchema(items: MenuDish[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "NaijaGrill Nigerian food menu",
    description:
      "Nigerian rice plates, soups and swallows, suya, grilled fish, pepper soup, small chops, sides, and drinks in Handsworth, Birmingham.",
    url: `${BUSINESS.website}/menu`,
    image: absoluteImageUrl(items[0]?.image ?? fallbackImage),
    hasMenuSection: menuSections.map((section) => ({
      "@type": "MenuSection",
      name: section.label,
      description: section.description,
      hasMenuItem: items
        .filter((item) => item.category === section.id)
        .map((item) => ({
          "@type": "MenuItem",
          name: item.title,
          description: item.description,
          image: absoluteImageUrl(item.image),
          offers: {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: item.price.replace("from £", ""),
            url: BUSINESS.order.uberEatsUrl,
          },
        })),
    })),
  };
}

export default async function MenuPage() {
  const cmsItems = await getMenuItems();
  const items = buildMenuDishes(cmsItems);
  const featuredItems = [
    "White Rice with Ofada Stew",
    "Poundo with Egusi",
    "White Rice with Ayamase",
    "Assorted Meat Pepper Soup",
    "Beef Suya",
    "Peppered Hake Fish",
  ]
    .map((title) => items.find((item) => item.title === title))
    .filter((item): item is MenuDish => Boolean(item));
  const deliveryItems = items.filter((item) =>
    [
      "White Rice with Ofada Stew",
      "White Rice with Ayamase",
      "Jollof Rice",
      "Beef Suya",
      "Suya Chicken Wings",
      "Puff Puff",
    ].includes(item.title),
  );
  const heroImage =
    "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg";

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ])}
      />
      <JsonLd data={menuPageSchema(items)} />

      <section className="relative min-h-[86vh] bg-charcoal text-ivory">
        <div className="absolute inset-0">
          <EditorialImage
            src={heroImage}
            alt="A table filled with colourful Nigerian food"
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(209,154,58,0.34),transparent_28%),linear-gradient(90deg,rgba(22,15,11,0.9),rgba(22,15,11,0.58),rgba(22,15,11,0.82))]" />
        </div>

        <div className="relative mx-auto grid min-h-[86vh] max-w-[1600px] items-end gap-12 px-6 pb-12 pt-40 md:px-12 lg:grid-cols-[1fr_0.78fr] lg:px-16 lg:pb-16">
          <div className="max-w-4xl">
            <p className="mb-5 inline-flex rounded-full border border-ivory/20 bg-ivory/10 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-ivory/90 backdrop-blur">
              Nigerian food, ready to order
            </p>
            <h1 className="text-balance font-display text-[clamp(3.2rem,7.5vw,7.4rem)] font-black leading-[0.85] tracking-[-0.05em] text-ivory">
              Big plates. Real pepper. No boring menu.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-[1.65] text-ivory/88 md:text-xl">
              Browse NaijaGrill favourites for dine-in, collection, and Uber
              Eats: ayamase, ofada stew, egusi, suya, pepper soup, grilled fish,
              small chops, rice plates, and sides.
            </p>
            <p className="mt-5 inline-flex rounded-full border border-ivory/18 bg-ivory/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-ivory/82 backdrop-blur">
              Uber Eats official ordering
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <UberEatsLink
                label="Menu hero"
                className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
              >
                <span className="rounded-full bg-charcoal px-2.5 py-1 text-[0.62rem] tracking-[0.12em] text-ivory">
                  Uber Eats
                </span>
                Order on Uber Eats
              </UberEatsLink>
              <Link
                href="/reservations"
                className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
              >
                Reserve a table
              </Link>
            </div>
          </div>

          <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-1">
            {featuredItems.slice(0, 3).map((item) => (
              <article
                key={item.title}
                className="grid grid-cols-[96px_1fr] items-center gap-4 rounded-[1.7rem] border border-ivory/15 bg-ivory/12 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-ivory/10">
                  <EditorialImage
                    src={item.image}
                    alt={item.title}
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold">
                    {item.badge ?? "Popular"}
                  </p>
                  <h2 className="mt-1 text-lg font-black leading-tight">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-ivory/75">
                    {item.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <nav
        aria-label="Menu categories"
        className="sticky top-[72px] z-40 border-b border-charcoal/10 bg-ivory/96 px-6 py-4 shadow-[0_12px_32px_rgba(22,15,11,0.08)] backdrop-blur-xl md:px-12 lg:px-16"
      >
        <div className="no-scrollbar mx-auto flex max-w-[1600px] snap-x gap-3 overflow-x-auto pr-[18vw] scroll-smooth md:pr-0">
          {menuSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="w-[68vw] shrink-0 snap-start rounded-full border border-charcoal/10 bg-cream/70 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:bg-gold/20 sm:w-auto"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-burgundy">
              Featured dishes
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] text-charcoal md:text-7xl">
              What people order
            </h2>
          </div>
          <p className="max-w-md text-base leading-[1.7] text-stone">
            Large, visual cards make the house favourites easy to scan without
            turning the page into an endless list.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredItems.map((item) => (
            <article
              key={item.title}
              className="smooth-card-motion group overflow-hidden rounded-[2rem] border border-charcoal/10 bg-cream/80 shadow-[0_22px_70px_rgba(22,15,11,0.08)] hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-charcoal/5">
                <EditorialImage
                  src={item.image}
                  alt={item.title}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <span className="absolute left-4 top-4 rounded-full bg-charcoal/86 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-ivory">
                  {item.badge ?? "Featured"}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-black leading-tight text-charcoal">
                    {item.title}
                  </h3>
                  <p className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-sm font-black text-burgundy">
                    {item.price}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-[1.7] text-stone">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="order"
        className="bg-charcoal px-6 py-16 text-ivory md:px-12 lg:px-16"
      >
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.52fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-gold">
              Delivery favourites
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-6xl">
              Built for Uber Eats orders.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-[1.75] text-ivory/74">
              Pick a main, add plantain or moi moi, and send it straight to
              checkout. Our live Uber Eats menu is set up for delivery across
              Handsworth and nearby Birmingham neighbourhoods.
            </p>
            <p className="mt-5 inline-flex rounded-full border border-ivory/14 bg-ivory/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-ivory/80">
              Uber Eats delivery menu
            </p>
            <UberEatsLink
              label="Menu delivery favourites"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-charcoal px-2.5 py-1 text-[0.62rem] tracking-[0.12em] text-ivory">
                Uber Eats
              </span>
              Order on Uber Eats
            </UberEatsLink>
          </div>

          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
            {deliveryItems.map((item) => (
              <article
                key={item.title}
                className="w-[260px] shrink-0 overflow-hidden rounded-[1.7rem] border border-ivory/10 bg-ivory/10"
              >
                <div className="relative aspect-[4/3]">
                  <EditorialImage
                    src={item.image}
                    alt={item.title}
                    sizes="260px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm font-bold text-gold">
                    {item.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.34fr_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-burgundy">
              Browse by mood
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-none tracking-[-0.04em] text-charcoal">
              Lots of choice, kept scannable.
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-stone">
              Each category shows a tight preview so guests can jump around,
              compare quickly, and order without wading through a wall of text.
            </p>
          </aside>

          <div className="grid gap-6">
            {menuSections.map((section) => {
              const sectionItems = items.filter(
                (item) => item.category === section.id,
              );

              return (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-28 rounded-[2rem] border border-charcoal/10 bg-cream/65 p-5 shadow-[0_22px_70px_rgba(22,15,11,0.06)] md:p-7"
                >
                  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-burgundy">
                        {section.kicker}
                      </p>
                      <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-charcoal md:text-4xl">
                        {section.label}
                      </h3>
                    </div>
                    <p className="max-w-sm text-sm leading-[1.6] text-stone">
                      {section.description}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {sectionItems.map((item) => (
                      <article
                        key={`${section.id}-${item.title}`}
                        className="smooth-card-motion grid grid-cols-[76px_1fr] gap-4 rounded-[1.35rem] bg-ivory/72 p-3 hover:bg-ivory"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-charcoal/5">
                          <EditorialImage
                            src={item.image}
                            alt={item.title}
                            sizes="76px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-black leading-tight text-charcoal">
                              {item.title}
                            </h4>
                            <p className="shrink-0 text-sm font-black text-burgundy">
                              {item.price}
                            </p>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-[1.45] text-stone">
                            {item.description}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-12 md:pb-28 lg:px-16">
        <div className="mx-auto grid max-w-[1600px] gap-6 rounded-[2.4rem] bg-burgundy p-6 text-ivory md:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-gold">
              Build your plate
            </p>
            <h2 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-6xl">
              One order, proper spread.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-[1.75] text-ivory/78">
              Pair rice with stew, add suya for the table, then finish with
              plantain, moi moi, puff puff, or a cold drink.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [
                "1",
                "Choose a main",
                "Ayamase rice, egusi, jollof, or pepper soup.",
              ],
              ["2", "Add fire", "Beef suya, wings, grilled tilapia, or hake."],
              ["3", "Finish it", "Plantain, moi moi, puff puff, and drinks."],
            ].map(([step, title, body]) => (
              <article
                key={step}
                className="rounded-[1.5rem] border border-ivory/12 bg-ivory/10 p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-sm font-black text-charcoal">
                  {step}
                </span>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-[1.6] text-ivory/72">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-charcoal px-6 py-18 text-center text-ivory md:px-12 md:py-24">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-gold">
          Hungry now?
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Order the favourites or book the full table.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Menu final CTA"
            className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
          >
            <span className="rounded-full bg-charcoal px-2.5 py-1 text-[0.62rem] tracking-[0.12em] text-ivory">
              Uber Eats
            </span>
            Order on Uber Eats
          </UberEatsLink>
          <Link
            href="/reservations"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Reserve your table
          </Link>
        </div>
      </section>
    </div>
  );
}
