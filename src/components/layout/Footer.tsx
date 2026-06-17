import Link from "next/link";
import { CopyablePhoneLink } from "@/components/ui/CopyablePhoneLink";
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
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/55">
              {BUSINESS.legalName} serves authentic Nigerian and West African
              food in Handsworth, Birmingham — dine in, takeaway, or delivery.
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
                <CopyablePhoneLink
                  phone={contact.phone}
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  linkClassName="transition-colors hover:text-gold"
                />
                {contact.landline && (
                  <div className="mt-1">
                    <CopyablePhoneLink
                      phone={contact.landline}
                      href={`tel:${contact.landline.replace(/\s/g, "")}`}
                      linkClassName="transition-colors hover:text-gold"
                    />
                  </div>
                )}
                <a
                  href={BUSINESS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[#0e7a4a] transition-opacity hover:opacity-80"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current shrink-0" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  WhatsApp us
                </a>
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
