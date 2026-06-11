"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/lib/actions/contact";
import type { ActionResult } from "@/lib/actions/types";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

const initialState: ActionResult = { success: false, message: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) =>
      submitContactMessage(formData),
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
        <FormField label="Name" name="name" error={state.fieldErrors?.name} />
        <FormField
          label="Email"
          name="email"
          type="email"
          error={state.fieldErrors?.email}
        />
      </div>

      <FormField label="Phone (optional)" name="phone" type="tel" />

      <FormField label="Message" name="message" error={state.fieldErrors?.message}>
        <textarea name="message" rows={5} required className={inputClass} />
      </FormField>

      {state.message && !state.success && (
        <FormMessage message={state.message} />
      )}

      <button
        type="submit"
        disabled={pending}
        className="editorial-button"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
