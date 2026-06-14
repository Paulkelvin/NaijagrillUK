import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";

export function ArticleCta() {
  return (
    <aside className="mt-16 rounded-[1.75rem] bg-charcoal p-8 text-ivory md:p-10">
      <p className="editorial-caption mb-3 text-gold">Ready to taste it</p>
      <h2 className="editorial-display text-3xl font-light leading-[1.05] md:text-4xl">
        Book a table or order Nigerian food to your door.
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-[1.6] text-ivory/72 md:text-base">
        Reserve a table at NaijaGrill in Handsworth, Birmingham — or get your
        favourites delivered on Uber Eats.
      </p>
      <div className="mt-7 flex flex-wrap gap-4">
        <Link
          href="/reservations"
          className="inline-flex rounded-full bg-gold px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
        >
          Reserve a table
        </Link>
        <UberEatsLink
          label="Journal article CTA"
          className="inline-flex rounded-full border border-ivory/25 px-7 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
        >
          Order on Uber Eats
        </UberEatsLink>
      </div>
    </aside>
  );
}
