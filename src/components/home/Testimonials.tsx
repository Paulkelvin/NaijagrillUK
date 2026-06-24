import { BUSINESS } from "@/lib/business";
import type { TestimonialData } from "@/sanity/types";

const REVIEW_URLS: Record<string, string> = {
  "testimonial-google-1": "https://maps.app.goo.gl/EBwrTu8MPCY1HGHS9?g_st=ic",
  "testimonial-google-2": "https://maps.app.goo.gl/rbHzTcD4UdocMJ8G8?g_st=ic",
  "testimonial-google-3": "https://maps.app.goo.gl/xgCCGueWMtzd9qkc8?g_st=ic",
  "testimonial-google-4": "https://maps.app.goo.gl/DgaTGNhD8SPfmegy9?g_st=ic",
};

function RatingStars() {
  return (
    <div className="flex items-center gap-1 text-gold" aria-label="5 star review">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
          aria-hidden="true"
        >
          <path d="M12 2 9.3 8.4 2.4 9l5.2 4.5-1.6 6.8 6-3.6 6 3.6-1.6-6.8L21.6 9l-6.9-.6L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function QuoteCard({ item }: { item: TestimonialData }) {
  const reviewUrl = REVIEW_URLS[item._id] ?? BUSINESS.reviews.profileUrl;

  return (
    <a
      href={reviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="smooth-card-motion flex min-h-[320px] w-[82vw] shrink-0 snap-start flex-col justify-between rounded-[1.9rem] border border-charcoal/10 bg-ivory p-6 no-underline hover:-translate-y-1 md:w-[410px] lg:w-[455px]"
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <GoogleIcon />
            <span className="editorial-caption text-stone">Google Review</span>
          </div>
          <RatingStars />
        </div>
        <blockquote className="editorial-display text-[1.35rem] font-light leading-[1.3] text-charcoal md:text-[1.65rem]">
          &ldquo;{item.quote}&rdquo;
        </blockquote>
      </div>
      <p className="mt-6 border-t border-charcoal/10 pt-4 text-sm font-black text-charcoal">
        {item.author}
        <span className="ml-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
          {item.context}
        </span>
      </p>
    </a>
  );
}

export function Testimonials({ items }: { items: TestimonialData[] }) {
  const movingItems = [...items, ...items];

  return (
    <section className="overflow-hidden bg-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-9 border-t border-charcoal/10 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="editorial-caption mb-3 text-gold">Google Reviews</p>
              <h2 className="editorial-display whitespace-nowrap text-[clamp(1.75rem,5.5vw,5.25rem)] font-light leading-[0.92] text-charcoal">
                What our guests say
              </h2>
            </div>
            <a
              href={BUSINESS.reviews.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-charcoal transition-colors hover:text-gold"
            >
              <GoogleIcon />
              {typeof BUSINESS.reviews.rating === "number" && (
                <span>{BUSINESS.reviews.rating.toFixed(1)} stars</span>
              )}
              <span className="text-stone">— See all reviews</span>
            </a>
          </div>
        </div>

        <div
          className="testimonial-marquee overflow-hidden pb-6"
          aria-label="Google reviews carousel"
        >
          <div className="testimonial-marquee-track flex w-max gap-5 pr-5">
            {movingItems.map((item, index) => (
              <QuoteCard
                key={`${item._id}-${index}`}
                item={item}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
