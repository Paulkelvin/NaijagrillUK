"use client";

import { useActionState } from "react";
import { submitNewsletter } from "@/lib/actions/newsletter";
import { FormMessage } from "@/components/forms/FormMessage";

type NewsletterSignupProps = {
  source: string;
  variant?: "light" | "dark";
};

const initialState = { success: false, message: "" };

export function NewsletterSignup({
  source,
  variant = "light",
}: NewsletterSignupProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      formData.set("source", source);
      return submitNewsletter(formData);
    },
    initialState,
  );

  const isDark = variant === "dark";

  return (
    <div>
      <p
        className={`editorial-display text-2xl font-light md:text-3xl ${
          isDark ? "text-ivory" : "text-charcoal"
        }`}
      >
        Get &pound;10 Off Your First Visit
      </p>
      <p
        className={`mt-4 max-w-md text-sm leading-relaxed ${
          isDark ? "text-ivory/70" : "text-stone"
        }`}
      >
        Join our list for occasional notes on new dishes, events, and evenings
        worth reserving.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-6 sm:flex-row">
        <input type="hidden" name="source" value={source} />
        <input
          type="email"
          name="email"
          required
          placeholder="Your email"
          aria-label="Email address"
          className={`flex-1 border-b bg-transparent py-3 outline-none transition-colors ${
            isDark
              ? "border-ivory/20 text-ivory placeholder:text-ivory/40 focus:border-gold"
              : "border-charcoal/20 text-charcoal placeholder:text-stone focus:border-gold"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`shrink-0 text-[0.6875rem] uppercase tracking-[0.28em] transition-opacity duration-300 hover:opacity-60 disabled:opacity-40 ${
            isDark ? "text-gold" : "text-charcoal"
          }`}
        >
          {pending ? "Sending…" : "Subscribe"}
        </button>
      </form>

      {state.message && (
        <div className="mt-4">
          <FormMessage success={state.success} message={state.message} />
        </div>
      )}
    </div>
  );
}
