"use server";

import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendEventInquiryEmails } from "@/lib/email";
import { checkFormRateLimit } from "./guard";
import type { ActionResult } from "./types";

const eventInquirySchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  eventType: z.string().min(2, "Please select an event or catering type"),
  eventTypeOther: z.string().optional(),
  eventDate: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(200).optional(),
  message: z.string().optional(),
});

export async function submitEventInquiry(
  formData: FormData,
): Promise<ActionResult> {
  const limited = await checkFormRateLimit("event-inquiry");
  if (limited) return limited;

  const parsed = eventInquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    eventType: formData.get("eventType"),
    eventTypeOther: formData.get("eventTypeOther") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    guests: formData.get("guests") || undefined,
    message: formData.get("message") || undefined,
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
        "Event enquiries are temporarily unavailable. Please email quayumm2008@yahoo.co.uk",
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { success: false, message: "Unable to connect. Please try again." };
  }

  const eventType =
    parsed.data.eventType === "Other"
      ? parsed.data.eventTypeOther?.trim() || "Other"
      : parsed.data.eventType;

  const { error } = await supabase.from("event_inquiries").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    event_type: eventType,
    event_date: parsed.data.eventDate ?? null,
    guests: parsed.data.guests ?? null,
    message: parsed.data.message ?? null,
  });

  if (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again or email us directly.",
    };
  }

  await sendEventInquiryEmails({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    eventType,
    eventDate: parsed.data.eventDate,
    guests: parsed.data.guests,
    message: parsed.data.message,
  });

  return {
    success: true,
    message:
      "Thank you. Our events team will be in touch within two working days.",
  };
}
