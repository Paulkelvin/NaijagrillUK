import type { OpeningHoursData } from "@/sanity/types";

type OpeningHoursProps = {
  hours: OpeningHoursData;
  className?: string;
  variant?: "inline" | "detailed";
};

export function OpeningHours({
  hours,
  className = "",
  variant = "inline",
}: OpeningHoursProps) {
  if (variant === "inline") {
    return (
      <div className={className}>
        <p>{hours.summary}</p>
        <p>
          Lunch {hours.lunchHours} &middot; Dinner {hours.dinnerHours}
        </p>
      </div>
    );
  }

  return (
    <dl className={`space-y-4 ${className}`}>
      {hours.schedule.map((day) => (
        <div
          key={day.day}
          className="flex justify-between gap-8 border-b border-charcoal/10 pb-4 text-sm"
        >
          <dt className="editorial-caption text-charcoal">{day.day}</dt>
          <dd className="text-stone">
            {day.closed
              ? "Closed"
              : `${day.open} — ${day.close}${day.service ? ` (${day.service})` : ""}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}
