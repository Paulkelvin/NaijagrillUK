"use client";

import { useActionState, useState } from "react";
import { submitEventInquiry } from "@/lib/actions/event-inquiries";
import type { ActionResult } from "@/lib/actions/types";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

const initialState: ActionResult = { success: false, message: "" };

const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Naming ceremony",
  "Birthday party",
  "Baby shower",
  "Graduation",
  "Anniversary",
  "Corporate event / trays",
  "Family celebration",
  "Church or community event",
  "Catering only",
  "Other",
];

export function EventInquiryForm({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) =>
      submitEventInquiry(formData),
    initialState,
  );
  const [eventType, setEventType] = useState("");

  if (state.success) {
    return <FormMessage success message={state.message} />;
  }

  const isDark = variant === "dark";
  const inputClass = `mt-3 w-full border-b bg-transparent py-3 outline-none transition-colors ${
    isDark
      ? "border-ivory/20 text-ivory focus:border-gold"
      : "border-charcoal/20 text-charcoal focus:border-gold"
  }`;
  const buttonClass = isDark ? "editorial-button-dark" : "editorial-button";

  return (
    <form action={formAction} className="mt-16 space-y-12">
      <div className="grid gap-12 md:grid-cols-2">
        <FormField variant={variant} label="Name" name="name" error={state.fieldErrors?.name} />
        <FormField
          variant={variant}
          label="Email"
          name="email"
          type="email"
          error={state.fieldErrors?.email}
        />
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <FormField variant={variant} label="Phone (optional)" name="phone" type="tel" />
        <FormField
          variant={variant}
          label="Event or catering type"
          name="eventType"
          error={state.fieldErrors?.eventType}
        >
          <select
            name="eventType"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className={inputClass}
          >
            <option value="">Select an option</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {eventType === "Other" && (
        <FormField
          variant={variant}
          label="Please specify"
          name="eventTypeOther"
          error={state.fieldErrors?.eventTypeOther}
        >
          <input
            name="eventTypeOther"
            className={inputClass}
            placeholder="Tell us the occasion"
          />
        </FormField>
      )}

      <div className="grid gap-12 md:grid-cols-2">
        <FormField variant={variant} label="Preferred Date" name="eventDate" type="date" />
        <FormField variant={variant} label="Guests" name="guests">
          <input type="number" name="guests" min={1} max={200} className={inputClass} />
        </FormField>
      </div>

      <FormField variant={variant} label="Message (optional)" name="message">
        <textarea name="message" rows={4} className={inputClass} />
      </FormField>

      {state.message && !state.success && (
        <FormMessage message={state.message} />
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonClass}
      >
        {pending ? "Sending…" : "Submit enquiry"}
      </button>
    </form>
  );
}
