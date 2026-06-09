"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "./MobileNav";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/explore-nigerian-cuisine", label: "Explore" },
  { href: "/private-dining", label: "Private Dining" },
  { href: "/reservations", label: "Reservations" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textClass = scrolled
    ? "text-ivory/90 hover:text-gold"
    : "text-ivory/90 hover:opacity-60";

  const logoClass = scrolled ? "text-ivory" : "text-ivory";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-ivory/10 bg-charcoal/95 py-4 shadow-[0_8px_32px_rgba(26,24,20,0.18)] backdrop-blur-md"
          : "bg-transparent py-8"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 md:px-12 lg:px-16">
        <Link
          href="/"
          className={`editorial-display text-xl font-light tracking-[0.18em] uppercase transition-colors duration-300 md:text-2xl ${logoClass}`}
        >
          Naija Grill
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 xl:gap-10 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.6875rem] uppercase tracking-[0.28em] transition-colors duration-300 ${textClass}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/studio"
            className={`ml-2 border-l border-ivory/20 pl-6 text-[0.625rem] uppercase tracking-[0.24em] transition-colors duration-300 ${textClass}`}
          >
            CMS
          </Link>
        </nav>

        <MobileNav scrolled={scrolled} />
      </div>
    </header>
  );
}
