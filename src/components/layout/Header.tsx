import Link from "next/link";
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
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-8 md:px-12 lg:px-16">
        <Link
          href="/"
          className="editorial-display text-xl font-light tracking-[0.18em] text-white uppercase md:text-2xl"
        >
          Naija Grill
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-10 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.6875rem] uppercase tracking-[0.28em] text-white/90 transition-opacity duration-300 hover:opacity-60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
