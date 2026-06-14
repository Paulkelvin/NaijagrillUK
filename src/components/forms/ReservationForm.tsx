"use client";

import { useActionState, useState } from "react";
import { submitReservation } from "@/lib/actions/reservations";
import type { ActionResult } from "@/lib/actions/types";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

const initialState: ActionResult = { success: false, message: "" };

export function ReservationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) =>
      submitReservation(formData),
    initialState,
  );

  if (state.success) {
    return (
      <div className="mt-8 rounded-[1.5rem] bg-ivory p-6">
        <FormMessage success message={state.message} />
      </div>
    );
  }

  const inputClass =
    "mt-2 w-full border-b border-charcoal/20 bg-transparent py-2.5 text-charcoal outline-none transition-colors focus:border-gold";
  const guestOptions = [2, 4, 6, 8, 10, 12, 15, 20, 25];
  const visibleStep =
    state.fieldErrors?.date || state.fieldErrors?.guests
      ? 1
      : state.fieldErrors?.name || state.fieldErrors?.email
        ? 2
        : step;

  return (
    <form action={formAction} className="mt-8">
      <div className="mb-8 grid grid-cols-2 gap-3">
        {[
          ["1", "Request"],
          ["2", "Confirm details"],
        ].map(([number, label]) => (
          <button
            key={number}
            type="button"
            onClick={() => setStep(number === "1" ? 1 : 2)}
            className={`flex items-center rounded-full border px-4 py-3 transition-colors ${
              visibleStep === Number(number)
                ? "border-gold bg-gold/15 text-charcoal"
                : "border-charcoal/10 bg-ivory/70 text-stone hover:border-gold/50"
            }`}
          >
            <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-charcoal text-[0.625rem] text-ivory">
              {number}
            </span>
            <span className="whitespace-nowrap text-[0.625rem] uppercase tracking-[0.14em]">
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: visibleStep === 1 ? "translateX(0)" : "translateX(-50%)",
          }}
        >
          <div
            className={`w-1/2 shrink-0 space-y-7 pr-1 transition-opacity duration-500 ${
              visibleStep === 1 ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={visibleStep !== 1}
          >
            <div className="grid gap-8 md:grid-cols-2">
              <FormField
                label="Preferred date"
                name="date"
                type="date"
                error={state.fieldErrors?.date}
              />
              <FormField
                label="Party size"
                name="guests"
                error={state.fieldErrors?.guests}
              >
                <select name="guests" defaultValue="2" className={inputClass}>
                  {guestOptions.map((n) => (
                    <option key={n} value={n}>
                      {n} guests
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Occasion or notes (optional)" name="notes">
              <textarea
                name="notes"
                rows={2}
                className={inputClass}
                placeholder="Birthday, anniversary, family dinner..."
              />
            </FormField>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="editorial-button rounded-full"
            >
              Continue
            </button>
          </div>

          <div
            className={`w-1/2 shrink-0 space-y-7 pl-1 transition-opacity duration-500 ${
              visibleStep === 2 ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={visibleStep !== 2}
          >
            <div className="grid gap-8 md:grid-cols-2">
              <FormField label="Name" name="name" error={state.fieldErrors?.name} />
              <FormField
                label="Email"
                name="email"
                type="email"
                error={state.fieldErrors?.email}
              />
            </div>

            <FormField label="Phone (optional)" name="phone" type="tel" />

            {state.message && !state.success && (
              <FormMessage message={state.message} />
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[0.6875rem] uppercase tracking-[0.18em] text-stone transition-colors hover:text-charcoal"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={pending}
                className="editorial-button rounded-full"
              >
                {pending ? "Sending…" : "Request reservation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
