"use server";

import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ActionResult } from "./types";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Please enter a message"),
});

export async function submitContactMessage(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      message: "Please check the form and try again.",
      fieldErrors,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message:
        "Messaging is temporarily unavailable. Please email quayumm2008@yahoo.co.uk",
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { success: false, message: "Unable to connect. Please try again." };
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
  });

  if (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again or email us directly.",
    };
  }

  return {
    success: true,
    message: "Thank you. We will respond as soon as possible.",
  };
}
