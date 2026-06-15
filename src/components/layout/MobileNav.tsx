"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/blog", label: "Journal" },
  { href: "/events-catering", label: "Events & Catering" },
  { href: "/reservations", label: "Reservations" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav({ scrolled = false }: { scrolled?: boolean }) {
  const [open, setOpen] = useState(false);
  const barColor = scrolled || open ? "bg-ivory" : "bg-ivory";

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
        className={`relative z-[60] flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border transition-all duration-300 ${
          open
            ? "border-gold/35 bg-charcoal shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
            : "border-ivory/15 bg-charcoal/35 backdrop-blur-sm"
        }`}
      >
        <span
          className={`block h-px w-6 ${barColor} transition-all duration-300 ${
            open ? "translate-y-[3.5px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-px w-6 ${barColor} transition-all duration-300 ${
            open ? "-translate-y-[3.5px] -rotate-45" : ""
          }`}
        />
      </button>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[55] bg-charcoal ${
          open ? "pointer-events-auto visible" : "pointer-events-none invisible"
        }`}
        inert={!open}
      >
        <nav
          aria-label="Mobile"
          className="flex h-dvh flex-col overflow-y-auto px-8 pb-12 pt-28"
        >
          <ul className="space-y-6">
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
                  className="editorial-display block text-[clamp(2.15rem,11vw,3.4rem)] font-light leading-[1.02] text-ivory transition-colors hover:text-gold"
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
