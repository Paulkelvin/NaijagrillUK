"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileNav } from "./MobileNav";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/events-catering", label: "Events & Catering" },
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
    ? "text-ivory hover:text-gold"
    : "text-ivory hover:text-gold";

  const logoClass = scrolled ? "text-ivory" : "text-ivory";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-charcoal transition-[border-color,box-shadow] duration-500 ${
        scrolled
          ? "border-b border-gold/20 shadow-[0_8px_32px_rgba(26,24,20,0.22)]"
          : "border-b border-ivory/10 shadow-[0_8px_32px_rgba(26,24,20,0.12)]"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <Link
          href="/"
          className={`editorial-display text-xl font-light tracking-[0.18em] uppercase drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] transition-colors duration-300 md:text-2xl ${logoClass}`}
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
        </nav>

        <MobileNav scrolled={scrolled} />
      </div>
    </header>
  );
}
