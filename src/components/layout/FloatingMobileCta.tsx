"use client";

import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { BUSINESS, googleMapsDirectionsUrl } from "@/lib/business";

export function FloatingMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-ivory/95 backdrop-blur-sm lg:hidden">
      <div className="grid grid-cols-4 divide-x divide-charcoal/10">
        <a
          href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}
          className="flex flex-col items-center gap-1 py-4 text-[0.625rem] uppercase tracking-[0.22em] text-charcoal transition-colors hover:text-gold"
        >
          <span aria-hidden>☎</span>
          Call
        </a>
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 py-4 text-[0.625rem] uppercase tracking-[0.22em] text-charcoal transition-colors hover:text-gold"
        >
          <span aria-hidden>◎</span>
          Directions
        </a>
        <Link
          href="/reservations"
          className="flex flex-col items-center gap-1 py-4 text-[0.625rem] uppercase tracking-[0.22em] text-gold transition-opacity hover:opacity-70"
        >
          <span aria-hidden>◆</span>
          Reserve
        </Link>
        <UberEatsLink
          label="Mobile sticky action"
          className="flex flex-col items-center gap-1 py-4 text-[0.625rem] uppercase tracking-[0.22em] text-burgundy transition-colors hover:text-gold"
        >
          <span aria-hidden>↗</span>
          Order
        </UberEatsLink>
      </div>
    </div>
  );
}
