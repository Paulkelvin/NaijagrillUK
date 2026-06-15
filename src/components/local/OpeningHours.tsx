import type { OpeningHoursData } from "@/sanity/types";

type OpeningHoursProps = {
  hours: OpeningHoursData;
  className?: string;
  variant?: "inline" | "detailed";
};

function formatTime(value?: string) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours)) return value;
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes
    ? `${hour12}:${String(minutes).padStart(2, "0")}${period}`
    : `${hour12}${period}`;
}

export function OpeningHours({
  hours,
  className = "",
  variant = "inline",
}: OpeningHoursProps) {
  if (variant === "inline") {
    return (
      <div className={className}>
        <p>{hours.summary}</p>
        <p>{hours.lunchHours}</p>
      </div>
    );
  }

  return (
    <dl className={`space-y-3 ${className}`}>
      {hours.schedule.map((day) => (
        <div
          key={day.day}
          className="flex justify-between gap-8 border-b border-charcoal/10 pb-3 text-sm"
        >
          <dt className="editorial-caption text-charcoal">{day.day}</dt>
          <dd className="text-stone">
            {day.closed
              ? "Closed"
              : `${formatTime(day.open)} — ${formatTime(day.close)}${day.service ? ` (${day.service})` : ""}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}
