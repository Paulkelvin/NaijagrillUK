import { TrackedOutboundLink } from "@/components/analytics/TrackedOutboundLink";
import { BUSINESS } from "@/lib/business";

type ReviewProofProps = {
  variant?: "light" | "dark";
  compact?: boolean;
  className?: string;
};

export function ReviewProof({
  variant = "light",
  compact = false,
  className = "",
}: ReviewProofProps) {
  const { reviews } = BUSINESS;
  const hasRating = typeof reviews.rating === "number";
  const hasReviewCount = typeof reviews.reviewCount === "number";
  const textClass = variant === "dark" ? "text-ivory" : "text-charcoal";
  const mutedClass = variant === "dark" ? "text-ivory/68" : "text-stone";
  const linkClass =
    variant === "dark"
      ? "text-gold hover:text-ivory"
      : "text-burgundy hover:text-charcoal";

  return (
    <div className={`${textClass} ${className}`}>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.22em]">
        {hasRating
          ? `${reviews.rating?.toFixed(1)} ${reviews.provider} rating`
          : `${reviews.provider} reviews`}
      </p>
      <p
        className={`mt-2 ${
          compact ? "text-xs" : "text-sm"
        } leading-[1.6] ${mutedClass}`}
      >
        {hasReviewCount
          ? `${reviews.reviewCount?.toLocaleString("en-GB")} guest reviews support booking with confidence.`
          : "Read guest feedback on Google before you book or order."}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.68rem] font-black uppercase tracking-[0.18em]">
        {reviews.readReviewsUrl && (
          <TrackedOutboundLink
            href={reviews.readReviewsUrl}
            eventName="review_read_click"
            eventLabel="Read Google reviews"
            className={`transition-colors ${linkClass}`}
          >
            Read Reviews
          </TrackedOutboundLink>
        )}
        {reviews.leaveReviewUrl && (
          <TrackedOutboundLink
            href={reviews.leaveReviewUrl}
            eventName="review_leave_click"
            eventLabel="Leave a Google review"
            className={`transition-colors ${linkClass}`}
          >
            Leave A Review
          </TrackedOutboundLink>
        )}
      </div>
    </div>
  );
}
