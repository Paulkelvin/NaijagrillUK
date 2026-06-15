import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { BUSINESS, formattedAddress } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

const LAST_UPDATED = "15 June 2026";

export async function generateMetadata() {
  return buildMetadata({
    title: "Terms & Conditions",
    description:
      "The terms and conditions for using the NaijaGrill website, making reservations, and enquiring about events and catering.",
    path: "/terms",
  });
}

export default function TermsPage() {
  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms & Conditions", path: "/terms" },
        ])}
      />

      <article className="mx-auto max-w-[820px] px-6 pb-24 pt-36 md:px-10 md:pt-44">
        <p className="editorial-caption mb-4 text-gold">Legal</p>
        <h1 className="editorial-display text-[clamp(2.4rem,5vw,3.8rem)] font-light leading-[1.02] text-charcoal">
          Terms &amp; Conditions
        </h1>
        <p className="mt-5 text-sm text-stone">Last updated: {LAST_UPDATED}</p>

        <div className="mt-12 space-y-10 text-[0.975rem] leading-[1.8] text-charcoal/85">
          <section className="space-y-4">
            <p>
              These terms govern your use of the {BUSINESS.legalName} website
              (&ldquo;the site&rdquo;). By using the site you accept these terms. If
              you do not agree, please do not use the site. {BUSINESS.name} is
              located at {formattedAddress}.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Using our website
            </h2>
            <p>
              You agree to use the site lawfully and not to misuse it, attempt to
              disrupt it, or copy its content for commercial use without permission.
              We may update or withdraw any part of the site at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Reservations
            </h2>
            <p>
              Submitting the reservation form sends us a <em>request</em>; it is not
              a confirmed booking. A reservation is only confirmed once we reply to
              confirm your table. Please give accurate details, and let us know in
              good time if your plans change. We may release tables for significant
              late arrivals.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Events &amp; catering
            </h2>
            <p>
              Event and catering enquiries are requests for a quote only. Any booking
              is subject to a separate agreement, availability, and any deposit terms
              we confirm with you in writing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Ordering &amp; delivery (Uber Eats)
            </h2>
            <p>
              Online orders and delivery are provided through Uber Eats. When you
              order, you leave our site and your order is subject to Uber Eats&rsquo;
              own terms, pricing, fees, and delivery areas. We are not responsible
              for the Uber Eats platform or delivery service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Menu, pricing &amp; allergens
            </h2>
            <p>
              Menu items, prices, and availability may change without notice and may
              differ between dine-in and delivery. Our food is prepared in a kitchen
              that handles common allergens, so we cannot guarantee any dish is free
              from traces. Please speak to our team about allergies and dietary needs
              before ordering.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Intellectual property
            </h2>
            <p>
              All content on this site — including text, photography, branding, and
              design — belongs to {BUSINESS.legalName} or its licensors and may not
              be reproduced without permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              External links
            </h2>
            <p>
              The site links to third-party services such as Uber Eats, Google Maps,
              and social media. We are not responsible for the content or practices
              of those external sites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Liability
            </h2>
            <p>
              The site is provided &ldquo;as is&rdquo;. To the extent permitted by
              law, we are not liable for any loss arising from your use of the site.
              Nothing in these terms limits liability that cannot be limited by law,
              including liability for death or personal injury caused by negligence.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Governing law
            </h2>
            <p>
              These terms are governed by the laws of England and Wales, and the
              courts of England and Wales have exclusive jurisdiction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Contact
            </h2>
            <p>
              Questions about these terms? Email{" "}
              <a
                href={`mailto:${BUSINESS.email}`}
                className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
              >
                {BUSINESS.email}
              </a>
              .
            </p>
          </section>

          <p className="border-t border-charcoal/10 pt-8 text-sm text-stone">
            See also our{" "}
            <Link
              href="/privacy"
              className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
