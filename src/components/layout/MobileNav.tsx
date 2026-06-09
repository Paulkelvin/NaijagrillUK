"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/explore-nigerian-cuisine", label: "Explore" },
  { href: "/private-dining", label: "Private Dining" },
  { href: "/reservations", label: "Reservations" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-px w-6 bg-white transition-all duration-300 ${
            open ? "translate-y-[3.5px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-px w-6 bg-white transition-all duration-300 ${
            open ? "-translate-y-[3.5px] -rotate-45" : ""
          }`}
        />
      </button>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[55] bg-charcoal/95 transition-opacity duration-500 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav
          aria-label="Mobile"
          className="flex h-full flex-col justify-center px-10"
        >
          <ul className="space-y-8">
            {navLinks.map((link, index) => (
              <li
                key={link.href}
                className="transition-all duration-500"
                style={{
                  transitionDelay: open ? `${index * 50}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(12px)",
                }}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="editorial-display text-4xl font-light text-ivory transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
