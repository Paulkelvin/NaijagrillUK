import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Address } from "@/components/local/Address";
import type { ContactInfoData } from "@/sanity/types";

export function Footer({ contact }: { contact: ContactInfoData }) {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-12 lg:px-16">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-24">
          <div>
            <p className="editorial-display text-4xl font-light leading-tight md:text-5xl">
              {BUSINESS.tagline}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-12 sm:flex-row lg:flex-col lg:items-end">
            <div className="space-y-3 text-sm leading-relaxed text-ivory/70">
              <Address contact={contact} />
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-gold"
                >
                  {contact.email}
                </a>
              </p>
            </div>

            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-8 gap-y-3 text-[0.6875rem] uppercase tracking-[0.28em] text-ivory/60"
            >
              <Link href="/menu" className="transition-colors hover:text-gold">
                Menu
              </Link>
              <Link href="/blog" className="transition-colors hover:text-gold">
                Journal
              </Link>
              <Link href="/story" className="transition-colors hover:text-gold">
                Story
              </Link>
              <Link
                href="/explore-nigerian-cuisine"
                className="transition-colors hover:text-gold"
              >
                Explore
              </Link>
              <Link
                href="/reservations"
                className="transition-colors hover:text-gold"
              >
                Reservations
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-gold"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-24 border-t border-ivory/10 pt-16">
          <NewsletterSignup source="footer" variant="dark" />
        </div>

        <div className="mt-24 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-[0.6875rem] uppercase tracking-[0.22em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {BUSINESS.legalName}</p>
          <div className="flex flex-wrap items-center gap-6">
            <p>Handsworth, Birmingham</p>
            <Link
              href="/studio"
              className="transition-colors hover:text-gold"
            >
              Edit content
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
