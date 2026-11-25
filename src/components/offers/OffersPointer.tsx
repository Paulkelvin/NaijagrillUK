import Link from "next/link";
import { getActivePromotion } from "@/lib/offers";

const copy = {
  festive: {
    lead: "Feeding a crowd this Christmas?",
    text: "Festive bulk orders by the litre, with extras free over £100.",
    cta: "See festive prices",
    href: "/offers#festive",
  },
  general: {
    lead: "Festive offers on now.",
    text: "Bulk festive orders, 20% off dine-in, buy one get one free and free puff puff.",
    cta: "See all offers",
    href: "/offers",
  },
} as const;

/** Slim banner that points visitors at /offers. Hidden when offers are off. */
export function OffersPointer({ variant = "general" }: { variant?: keyof typeof copy }) {
  if (!getActivePromotion()) return null;
  const c = copy[variant];

  return (
    <Link
      href={c.href}
      className="group block bg-[linear-gradient(135deg,#f3d48a_0%,#d19a3a_55%,#a46b1c_100%)] px-6 py-4 text-charcoal transition-opacity duration-300 hover:opacity-95 md:px-12 lg:px-16"
    >
      <span className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span aria-hidden>✦</span>
        <span className="text-sm font-bold md:text-base">{c.lead}</span>
        <span className="text-sm md:text-base">{c.text}</span>
        <span className="text-[0.6875rem] font-black uppercase tracking-[0.2em] underline underline-offset-4 group-hover:no-underline">
          {c.cta} &rarr;
        </span>
      </span>
    </Link>
  );
}
