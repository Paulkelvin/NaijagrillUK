"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { BUSINESS, googleMapsDirectionsUrl } from "@/lib/business";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-[1.35rem] w-[1.35rem]",
};

function PhoneIcon() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg {...iconProps} aria-hidden>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function ReserveIcon() {
  return (
    <svg {...iconProps} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg {...iconProps} aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

const itemClass =
  "group flex flex-col items-center gap-1.5 py-3.5 text-charcoal transition-colors duration-300 hover:text-gold active:text-gold";
const iconWrapClass =
  "transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-90";
const labelClass = "text-[0.6rem] font-semibold uppercase tracking-[0.18em]";

function ItemContent({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <>
      <span className={iconWrapClass}>{icon}</span>
      <span className={labelClass}>{label}</span>
    </>
  );
}

export function FloatingMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 transform-gpu border-t border-charcoal/10 bg-ivory/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(22,15,11,0.10)] [backface-visibility:hidden] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 px-2">
        <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className={itemClass}>
          <ItemContent icon={<PhoneIcon />} label="Call" />
        </a>
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
        >
          <ItemContent icon={<DirectionsIcon />} label="Directions" />
        </a>
        <Link href="/reservations#reserve" className={itemClass}>
          <ItemContent icon={<ReserveIcon />} label="Reserve" />
        </Link>
        <UberEatsLink label="Mobile sticky action" className={itemClass}>
          <ItemContent icon={<OrderIcon />} label="Order" />
        </UberEatsLink>
      </div>
    </div>
  );
}
