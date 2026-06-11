"use server";

import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ActionResult } from "./types";

const reservationSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  date: z.string().min(1, "Please select a date"),
  guests: z.coerce.number().int().min(2).max(80),
  notes: z.string().optional(),
});

export async function submitReservation(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reservationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    date: formData.get("date"),
    guests: formData.get("guests"),
    notes: formData.get("notes") || undefined,
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
        "Reservations are temporarily unavailable. Please email hello@naijagrill.co.uk",
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { success: false, message: "Unable to connect. Please try again." };
  }

  const { error } = await supabase.from("reservations").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    reservation_date: parsed.data.date,
    guests: parsed.data.guests,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again or email us directly.",
    };
  }

  return {
    success: true,
    message:
      "Your reservation request has been received. We will confirm by email shortly.",
  };
}
