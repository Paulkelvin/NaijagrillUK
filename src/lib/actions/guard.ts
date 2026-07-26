import { headers } from "next/headers";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/seo/logger";
import type { ActionResult } from "./types";

// Public forms were entirely unthrottled. That mattered more than typical
// form spam here because submitReservation/submitContactMessage each send a
// real email on success — so a bot loop costs actual money and buries real
// enquiries, on top of filling the database with junk.
//
// Limits are set deliberately loose: the failure mode to avoid is blocking a
// real customer who mistypes something and resubmits, or a family sharing one
// restaurant wifi IP. 5 submissions per 10 minutes per IP is far above any
// honest use of a booking form and far below anything useful to a bot.
const FORM_MAX_SUBMISSIONS = 5;
const FORM_WINDOW_MS = 10 * 60 * 1000;

/**
 * Returns an ActionResult to hand straight back to the caller when the
 * submitter is over the limit, or null when the request should proceed.
 */
export async function checkFormRateLimit(action: string): Promise<ActionResult | null> {
  const ip = clientIpFromHeaders(await headers());
  const limit = checkRateLimit(`form:${action}:${ip}`, FORM_MAX_SUBMISSIONS, FORM_WINDOW_MS);
  if (limit.allowed) return null;

  logger.warn("form_rate_limited", { action, ip, retryAfterSeconds: limit.retryAfterSeconds });
  return {
    success: false,
    message: "Too many submissions. Please wait a few minutes and try again.",
  };
}
