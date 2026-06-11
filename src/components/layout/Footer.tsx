import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Address } from "@/components/local/Address";
import type { ContactInfoData } from "@/sanity/types";

export function Footer({ contact }: { contact: ContactInfoData }) {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-12 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr_0.8fr] lg:items-start">
          <div className="max-w-md">
            <p className="editorial-caption mb-5 text-ivory/45">
              NaijaGrill Birmingham
            </p>
            <p className="editorial-display text-3xl font-light leading-tight md:text-4xl">
              {BUSINESS.tagline}
            </p>
          </div>

          <div className="grid gap-7">
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-7 gap-y-3 text-[0.6875rem] uppercase tracking-[0.24em] text-ivory/60"
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

            <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm leading-relaxed text-ivory/68">
              <Address
                contact={contact}
                className="flex flex-wrap gap-x-3 gap-y-1"
              />
              <span className="hidden text-ivory/20 lg:inline">/</span>
              <span>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-gold"
                >
                  {contact.email}
                </a>
              </span>
            </div>
          </div>

          <div className="border-t border-ivory/10 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <NewsletterSignup source="footer" variant="dark" compact />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-ivory/10 pt-6 text-[0.625rem] uppercase tracking-[0.22em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
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
