"use client";

import { useActionState } from "react";
import { submitNewsletter } from "@/lib/actions/newsletter";
import { FormMessage } from "@/components/forms/FormMessage";

type NewsletterSignupProps = {
  source: string;
  variant?: "light" | "dark";
  compact?: boolean;
};

const initialState = { success: false, message: "" };

export function NewsletterSignup({
  source,
  variant = "light",
  compact = false,
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
        className={`editorial-display font-light ${
          compact ? "text-2xl" : "text-2xl md:text-3xl"
        } ${
          isDark ? "text-ivory" : "text-charcoal"
        }`}
      >
        Get &pound;10 Off Your First Visit
      </p>
      <p
        className={`${compact ? "mt-3" : "mt-4"} max-w-md text-sm leading-relaxed ${
          isDark ? "text-ivory/70" : "text-stone"
        }`}
      >
        Join our list for occasional notes on new dishes, events, and evenings
        worth reserving.
      </p>

      <form
        action={formAction}
        className={`${compact ? "mt-5" : "mt-8"} flex flex-col gap-4 sm:flex-row`}
      >
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
          className={isDark ? "editorial-button-dark shrink-0" : "editorial-button shrink-0"}
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
