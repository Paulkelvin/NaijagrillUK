import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS, formattedAddress, googleMapsDirectionsUrl } from "@/lib/business";

// A self-hosted link-in-bio page (the Linktree pattern) for the Instagram
// profile link. Deliberately lives outside the (main) route group so it
// renders standalone — no site header or footer — which is what makes a bio
// link feel like a bio link rather than a website page someone got dropped
// into.
//
// Kept out of the search index on purpose: it's a thin page of outbound
// links whose entire audience arrives directly from a social profile, never
// from search. Indexing it would add a low-value page to a site that already
// has real "Discovered - currently not indexed" pressure in Search Console
// (see docs/seo-platform/FOLLOW_UPS.md), for no upside. It is also therefore
// deliberately absent from sitemap.ts.
export const metadata: Metadata = {
  title: `${BUSINESS.legalName} | Order, Book & Find Us`,
  description: "Order, book a table, find us, or say hello — every NaijaGrill link in one place.",
  robots: { index: false, follow: true },
};

type LinkTone = "primary" | "secondary";

interface BioLink {
  label: string;
  sub?: string;
  href: string;
  tone: LinkTone;
  external: boolean;
}

const links: BioLink[] = [
  {
    label: "Order on Uber Eats",
    sub: "Delivery across Handsworth & Birmingham",
    href: BUSINESS.order.uberEatsUrl,
    tone: "primary",
    external: true,
  },
  {
    label: "Order on WhatsApp",
    sub: "Message us directly",
    href: BUSINESS.whatsappUrl,
    tone: "primary",
    external: true,
  },
  {
    label: "Book a table",
    sub: "Reserve for dine-in",
    href: "/reservations#reserve",
    tone: "secondary",
    external: false,
  },
  { label: "See the full menu", href: "/menu", tone: "secondary", external: false },
  {
    label: "Call us",
    sub: BUSINESS.phoneDisplay,
    href: `tel:${BUSINESS.phone}`,
    tone: "secondary",
    external: false,
  },
  {
    label: "Find us",
    sub: `${BUSINESS.address.street}, ${BUSINESS.address.area}`,
    href: googleMapsDirectionsUrl,
    tone: "secondary",
    external: true,
  },
  {
    label: "Leave us a review",
    sub: "It genuinely helps us",
    href: BUSINESS.reviews.leaveReviewUrl,
    tone: "secondary",
    external: true,
  },
  { label: "Visit our website", href: "/", tone: "secondary", external: false },
];

const PRIMARY_CLASS =
  "bg-gold text-charcoal hover:-translate-y-0.5 hover:bg-[#e0a94a] focus-visible:outline-ivory";
const SECONDARY_CLASS =
  "border border-ivory/25 bg-ivory/[0.06] text-ivory backdrop-blur hover:-translate-y-0.5 hover:border-gold/60 hover:bg-ivory/[0.12] focus-visible:outline-gold";

function BioButton({ link }: { link: BioLink }) {
  const className = `group flex w-full flex-col items-center justify-center rounded-2xl px-6 py-4 text-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 ${
    link.tone === "primary" ? PRIMARY_CLASS : SECONDARY_CLASS
  }`;

  const content = (
    <>
      <span className="text-sm font-black uppercase tracking-[0.14em]">{link.label}</span>
      {link.sub && (
        <span
          className={`mt-1 text-xs font-medium tracking-wide ${
            link.tone === "primary" ? "text-charcoal/70" : "text-ivory/55"
          }`}
        >
          {link.sub}
        </span>
      )}
    </>
  );

  // Outbound links get rel="noopener" (security) — but deliberately not
  // "nofollow": these all point at the business's own profiles and ordering
  // pages, which is exactly the kind of link that should pass a signal.
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {content}
    </Link>
  );
}

export default function LinksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-charcoal px-5 py-12 text-ivory">
      {/* Warm radial wash so the flat charcoal doesn't read as a dead
          background on a page that is almost entirely buttons. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(209,154,58,0.18),transparent_55%)]"
      />

      <div className="relative flex w-full max-w-md flex-1 flex-col">
        <header className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-gold/40 bg-ivory/5">
            <Image
              src="/images/naija-grill-and-spice-logo.png"
              alt={`${BUSINESS.legalName} logo`}
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
          <h1 className="mt-5 font-display text-3xl font-black leading-tight tracking-[-0.02em]">
            {BUSINESS.legalName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ivory/60">
            Nigerian food in {BUSINESS.address.area}, {BUSINESS.address.city}
          </p>
          <p className="mt-3 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-gold">
            Dine in · Collection · Delivery
          </p>
        </header>

        <nav aria-label="NaijaGrill links" className="mt-9 flex flex-col gap-3">
          {links.map((link) => (
            <BioButton key={link.label} link={link} />
          ))}
        </nav>

        <footer className="mt-10 pb-4 text-center text-xs leading-relaxed text-ivory/40">
          <p>{formattedAddress}</p>
        </footer>
      </div>
    </main>
  );
}
