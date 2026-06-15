import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { BUSINESS, formattedAddress } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

const LAST_UPDATED = "15 June 2026";

export async function generateMetadata() {
  return buildMetadata({
    title: "Privacy Policy",
    description:
      "How NaijaGrill collects, uses, stores, and protects your personal data, and your rights under UK GDPR.",
    path: "/privacy",
  });
}

export default function PrivacyPage() {
  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />

      <article className="mx-auto max-w-[820px] px-6 pb-24 pt-36 md:px-10 md:pt-44">
        <p className="editorial-caption mb-4 text-gold">Legal</p>
        <h1 className="editorial-display text-[clamp(2.4rem,5vw,3.8rem)] font-light leading-[1.02] text-charcoal">
          Privacy Policy
        </h1>
        <p className="mt-5 text-sm text-stone">Last updated: {LAST_UPDATED}</p>

        <div className="mt-12 space-y-10 text-[0.975rem] leading-[1.8] text-charcoal/85">
          <section className="space-y-4">
            <p>
              This Privacy Policy explains how {BUSINESS.legalName} (&ldquo;NaijaGrill&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects and uses your personal
              information when you use our website, contact us, make a reservation,
              enquire about events or catering, or subscribe to our newsletter. We
              are the data controller for the personal data described here and are
              committed to handling it in line with the UK GDPR and the Data
              Protection Act 2018.
            </p>
            <p>
              {BUSINESS.name} is located at {formattedAddress}. For any privacy
              question or request, contact us at{" "}
              <a
                href={`mailto:${BUSINESS.email}`}
                className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
              >
                {BUSINESS.email}
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Information we collect
            </h2>
            <p>We only collect the information you choose to give us through our forms, plus limited technical data:</p>
            <ul className="ml-5 list-disc space-y-2 marker:text-gold">
              <li>
                <strong>Reservations:</strong> your name, email address, phone
                number (optional), preferred date, party size, and any notes you add.
              </li>
              <li>
                <strong>Events &amp; catering enquiries:</strong> your name, email,
                phone number (optional), event type, date, guest numbers, and message.
              </li>
              <li>
                <strong>Contact form:</strong> your name, email, phone number
                (optional), and message.
              </li>
              <li>
                <strong>Newsletter:</strong> your email address.
              </li>
              <li>
                <strong>Technical &amp; usage data:</strong> if analytics are
                enabled, cookies and similar technologies collect anonymous or
                pseudonymous data such as pages viewed, device and browser type,
                and approximate location, to help us understand and improve the site.
              </li>
            </ul>
            <p>
              We do not knowingly collect data from children, and we do not collect
              special category data or payment card details through this website
              (delivery payments are handled entirely by Uber Eats).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              How and why we use your data
            </h2>
            <ul className="ml-5 list-disc space-y-2 marker:text-gold">
              <li>To respond to your enquiries and manage reservation requests.</li>
              <li>To plan and quote for events and catering you ask about.</li>
              <li>To send our newsletter, where you have subscribed.</li>
              <li>To operate, secure, and improve our website.</li>
              <li>To comply with our legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Legal bases (UK GDPR)
            </h2>
            <ul className="ml-5 list-disc space-y-2 marker:text-gold">
              <li>
                <strong>Consent</strong> — for newsletter sign-ups and any
                non-essential analytics cookies. You can withdraw consent at any time.
              </li>
              <li>
                <strong>Legitimate interests</strong> — to respond to enquiries and
                to keep the website secure and working well.
              </li>
              <li>
                <strong>Steps prior to a contract</strong> — to process and confirm
                your reservation or event request.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Where your data is stored and who processes it
            </h2>
            <p>
              We use trusted third-party service providers acting as our data
              processors. Form submissions are stored in our secure database
              (Supabase). The website is hosted on Vercel, and content is managed
              with Sanity. Depending on the features enabled, we may also use:
            </p>
            <ul className="ml-5 list-disc space-y-2 marker:text-gold">
              <li>Google Analytics and Microsoft Clarity — website analytics.</li>
              <li>Google Maps — to show our location.</li>
              <li>An embedded video player (Google Drive) on some pages.</li>
              <li>
                Uber Eats — when you choose to order, you leave our site and Uber&rsquo;s
                own privacy policy applies.
              </li>
            </ul>
            <p>
              Some providers may process data outside the UK. Where they do, they
              rely on appropriate safeguards such as UK/EU adequacy or Standard
              Contractual Clauses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              How long we keep it
            </h2>
            <p>
              We keep enquiry and reservation records only for as long as needed to
              handle your request and for our legitimate business records, then
              delete or anonymise them. Newsletter data is kept until you unsubscribe.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Your rights
            </h2>
            <p>Under UK data protection law you have the right to:</p>
            <ul className="ml-5 list-disc space-y-2 marker:text-gold">
              <li>access the personal data we hold about you;</li>
              <li>ask us to correct inaccurate data;</li>
              <li>ask us to erase your data;</li>
              <li>restrict or object to our processing;</li>
              <li>data portability;</li>
              <li>withdraw consent at any time.</li>
            </ul>
            <p>
              To exercise any of these, email{" "}
              <a
                href={`mailto:${BUSINESS.email}`}
                className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
              >
                {BUSINESS.email}
              </a>
              . You also have the right to complain to the UK&rsquo;s Information
              Commissioner&rsquo;s Office (ICO) at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
              >
                ico.org.uk
              </a>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Cookies
            </h2>
            <p>
              Essential cookies keep the site working. Any analytics or measurement
              cookies are only used where enabled and where you have consented. You
              can control cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="editorial-display text-2xl font-light text-charcoal md:text-3xl">
              Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time. The latest version will
              always be on this page with its &ldquo;last updated&rdquo; date.
            </p>
          </section>

          <p className="border-t border-charcoal/10 pt-8 text-sm text-stone">
            See also our{" "}
            <Link
              href="/terms"
              className="text-charcoal underline decoration-gold/50 underline-offset-4 hover:text-gold"
            >
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
