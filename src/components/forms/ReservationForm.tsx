"use client";

import { useActionState } from "react";
import { submitReservation } from "@/lib/actions/reservations";
import type { ActionResult } from "@/lib/actions/types";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

const initialState: ActionResult = { success: false, message: "" };

export function ReservationForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) =>
      submitReservation(formData),
    initialState,
  );

  if (state.success) {
    return <FormMessage success message={state.message} />;
  }

  const inputClass =
    "mt-3 w-full border-b border-charcoal/20 bg-transparent py-3 text-charcoal outline-none transition-colors focus:border-gold";

  return (
    <form action={formAction} className="mt-16 space-y-12">
      <div className="grid gap-12 md:grid-cols-2">
        <FormField
          label="Date"
          name="date"
          type="date"
          error={state.fieldErrors?.date}
        />
        <FormField label="Guests" name="guests" error={state.fieldErrors?.guests}>
          <select
            name="guests"
            defaultValue="2"
            className={inputClass}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} guests
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        <FormField
          label="Name"
          name="name"
          error={state.fieldErrors?.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          error={state.fieldErrors?.email}
        />
      </div>

      <FormField label="Phone (optional)" name="phone" type="tel" />
      <FormField label="Notes (optional)" name="notes">
        <textarea
          name="notes"
          rows={3}
          className={inputClass}
        />
      </FormField>

      {state.message && !state.success && (
        <FormMessage message={state.message} />
      )}

      <button
        type="submit"
        disabled={pending}
        className="text-[0.6875rem] uppercase tracking-[0.28em] text-charcoal transition-opacity duration-300 hover:opacity-60 disabled:opacity-40"
      >
        {pending ? "Sending…" : "Request reservation"}
      </button>
    </form>
  );
}
