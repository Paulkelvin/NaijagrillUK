import Link from "next/link";
import { Address } from "@/components/local/Address";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { BUSINESS } from "@/lib/business";
import type { ContactInfoData, OpeningHoursData } from "@/sanity/types";

export function Footer({
  contact,
  hours,
}: {
  contact: ContactInfoData;
  hours: OpeningHoursData;
}) {
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
                href="/events-catering"
                className="transition-colors hover:text-gold"
              >
                Events & Catering
              </Link>
              <Link
                href="/reservations"
                className="transition-colors hover:text-gold"
              >
                Reservations
              </Link>
              <UberEatsLink
                label="Footer nav"
                className="transition-colors hover:text-gold"
              >
                Order on Uber Eats
              </UberEatsLink>
              <Link
                href="/contact"
                className="transition-colors hover:text-gold"
              >
                Contact
              </Link>
            </nav>

            <div className="grid gap-x-8 gap-y-6 border-t border-ivory/10 pt-6 text-sm leading-relaxed text-ivory/68 sm:grid-cols-2">
              <div>
                <p className="editorial-caption mb-2 text-ivory/40">Visit</p>
                <Address contact={contact} className="space-y-0.5" />
              </div>

              <div>
                <p className="editorial-caption mb-2 text-ivory/40">
                  Opening hours
                </p>
                <p className="text-ivory/85">Open every day</p>
                <p>{hours.lunchHours}</p>
              </div>

              <div>
                <p className="editorial-caption mb-2 text-ivory/40">Call</p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="block transition-colors hover:text-gold"
                >
                  {contact.phone}
                </a>
                {contact.landline && (
                  <a
                    href={`tel:${contact.landline.replace(/\s/g, "")}`}
                    className="block transition-colors hover:text-gold"
                  >
                    {contact.landline}
                  </a>
                )}
              </div>

              <div>
                <p className="editorial-caption mb-2 text-ivory/40">Email</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="block break-words transition-colors hover:text-gold"
                >
                  {contact.email}
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-ivory/10 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <NewsletterSignup source="footer" variant="dark" compact />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-ivory/10 pt-6 text-[0.625rem] uppercase tracking-[0.22em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {BUSINESS.legalName}</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="transition-colors hover:text-gold">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-gold">
              Terms
            </Link>
            <a
              href={BUSINESS.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NaijaGrill on Instagram"
              className="group inline-flex items-center gap-2 transition-colors hover:text-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5"
                aria-hidden
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            <p>Handsworth, Birmingham</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
