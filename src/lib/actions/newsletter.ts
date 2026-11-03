"use server";

import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendNewsletterEmails } from "@/lib/email";
import { checkFormRateLimit } from "./guard";
import type { ActionResult } from "./types";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  source: z.string().optional(),
});

export async function submitNewsletter(
  formData: FormData,
): Promise<ActionResult> {
  const limited = await checkFormRateLimit("newsletter");
  if (limited) return limited;

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") || "website",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid email",
      fieldErrors: { email: "Please enter a valid email" },
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Sign-up is temporarily unavailable. Please try again later.",
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { success: false, message: "Unable to connect. Please try again." };
  }

  const { error } = await supabase.from("newsletter_leads").upsert(
    {
      email: parsed.data.email.toLowerCase(),
      source: parsed.data.source,
      offer_claimed: true,
    },
    { onConflict: "email" },
  );

  if (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }

  await sendNewsletterEmails(parsed.data.email.toLowerCase());

  return {
    success: true,
    message: "Welcome. You're on the list — thank you for subscribing.",
  };
}
