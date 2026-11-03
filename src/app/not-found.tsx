import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: `Page not found | ${BUSINESS.name}`,
  description: "This page doesn't exist, but dinner still does.",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/menu", label: "See the menu" },
  { href: "/reservations#reserve", label: "Reserve a table" },
  { href: "/blog", label: "Read the journal" },
  { href: "/contact", label: "Contact us" },
];

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 py-24 text-center text-ivory"
    >
      <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-gold">
        Error 404
      </p>
      <h1 className="editorial-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98]">
        This plate isn&apos;t on the menu.
      </h1>
      <p className="mt-6 max-w-md text-base leading-[1.6] text-ivory/75">
        The page you&apos;re looking for has moved or never existed. Try one of
        these, or call {BUSINESS.phoneDisplay} and we&apos;ll sort you out.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex rounded-full bg-gold px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
        >
          Back to home
        </Link>
        <a
          href={BUSINESS.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-[#25D366] px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe57]"
        >
          Chat on WhatsApp
        </a>
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="underline decoration-gold/50 underline-offset-4 hover:text-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
