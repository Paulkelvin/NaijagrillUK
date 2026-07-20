"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/seo", label: "Action Queue" },
  { href: "/admin/seo/analytics", label: "Analytics" },
  { href: "/admin/seo/settings", label: "Settings" },
];

const LINK_CLASS = "block rounded-lg px-3 py-2 text-sm font-medium transition";
const ACTIVE_CLASS = "bg-amber-300/10 text-amber-200";
const INACTIVE_CLASS = "text-white/70 hover:bg-white/5 hover:text-white";

// Exact match, not a startsWith prefix check — /admin/seo/settings is a
// sibling of /admin/seo in this nav, not a sub-route of it, but
// "/admin/seo/settings".startsWith("/admin/seo") is still true, so a
// prefix check highlighted both "Action Queue" and "Settings" at once on
// the settings page (found via code review, not caught during manual
// browser verification — the two active-looking links look similar enough
// at a glance to miss). Exported and unit-tested separately since this
// project has no React-component test setup (vitest only runs *.test.ts
// under a node environment) — everything else in the nav is only
// verifiable in a real browser.
export function isActiveLink(pathname: string, href: string): boolean {
  return pathname === href;
}

/**
 * Shared nav across every /admin/* page, added because a real user
 * (checking the dashboard from their phone) couldn't discover /admin/seo
 * or /admin/seo/settings from the original Owner Dashboard — there was no
 * link between them at all. One nav, one place to add future admin pages.
 */
export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return isActiveLink(pathname, href);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f0c0a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 md:px-10">
        <Link href="/admin" className="text-sm font-semibold tracking-wide text-white">
          NaijaGrill <span className="text-white/40 font-normal">Admin</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`${LINK_CLASS} ${isActive(link.href) ? ACTIVE_CLASS : INACTIVE_CLASS}`}>
              {link.label}
            </Link>
          ))}
          <form method="POST" action="/api/admin/logout" className="ml-2">
            <button type="submit" className={`${LINK_CLASS} ${INACTIVE_CLASS}`}>
              Log out
            </button>
          </form>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 md:hidden"
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`${LINK_CLASS} ${isActive(link.href) ? ACTIVE_CLASS : INACTIVE_CLASS}`}
            >
              {link.label}
            </Link>
          ))}
          <form method="POST" action="/api/admin/logout">
            <button type="submit" className={`${LINK_CLASS} ${INACTIVE_CLASS} w-full text-left`}>
              Log out
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
