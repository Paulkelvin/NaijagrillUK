import { Resend } from "resend";
import { BUSINESS } from "./business";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ?? `noreply@naijagrillandspice.co.uk`;
const OWNER = ["quayumm2008@yahoo.co.uk", "paulopackager@gmail.com"];

async function send(to: string | string[], subject: string, html: string) {
  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendContactEmails(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  await Promise.allSettled([
    send(
      data.email,
      `We received your message — ${BUSINESS.name}`,
      `<p>Hi ${data.name},</p><p>Thank you for getting in touch. We'll respond as soon as possible.</p><p><strong>Your message:</strong></p><p>${data.message}</p><p>— The ${BUSINESS.name} team</p>`,
    ),
    send(
      OWNER,
      `New contact message from ${data.name}`,
      `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p>${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}<p><strong>Message:</strong></p><p>${data.message}</p>`,
    ),
  ]);
}

export async function sendReservationEmails(data: {
  name: string;
  email: string;
  phone?: string;
  date: string;
  guests: number;
  notes?: string;
}) {
  await Promise.allSettled([
    send(
      data.email,
      `Reservation request received — ${BUSINESS.name}`,
      `<p>Hi ${data.name},</p><p>We've received your reservation request for <strong>${data.guests} guest${data.guests !== 1 ? "s" : ""}</strong> on <strong>${data.date}</strong>. We'll confirm by email shortly.</p>${data.notes ? `<p><strong>Your notes:</strong> ${data.notes}</p>` : ""}<p>— The ${BUSINESS.name} team</p>`,
    ),
    send(
      OWNER,
      `New reservation: ${data.name} — ${data.date} (${data.guests} guests)`,
      `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p>${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}<p><strong>Date:</strong> ${data.date}</p><p><strong>Guests:</strong> ${data.guests}</p>${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}`,
    ),
  ]);
}

export async function sendEventInquiryEmails(data: {
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate?: string;
  guests?: number;
  message?: string;
}) {
  await Promise.allSettled([
    send(
      data.email,
      `Event enquiry received — ${BUSINESS.name}`,
      `<p>Hi ${data.name},</p><p>Thank you for your event enquiry. Our events team will be in touch within two working days.</p><p><strong>Event type:</strong> ${data.eventType}</p>${data.eventDate ? `<p><strong>Date:</strong> ${data.eventDate}</p>` : ""}${data.guests ? `<p><strong>Guests:</strong> ${data.guests}</p>` : ""}${data.message ? `<p><strong>Your message:</strong> ${data.message}</p>` : ""}<p>— The ${BUSINESS.name} team</p>`,
    ),
    send(
      OWNER,
      `New event enquiry: ${data.eventType} — ${data.name}`,
      `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p>${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}<p><strong>Event type:</strong> ${data.eventType}</p>${data.eventDate ? `<p><strong>Date:</strong> ${data.eventDate}</p>` : ""}${data.guests ? `<p><strong>Guests:</strong> ${data.guests}</p>` : ""}${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}`,
    ),
  ]);
}

export async function sendNewsletterEmails(email: string) {
  await Promise.allSettled([
    send(
      email,
      `You're subscribed — ${BUSINESS.name}`,
      `<p>Welcome! You're now subscribed to updates from ${BUSINESS.name}. We'll keep you posted on news, offers, and events.</p><p>— The ${BUSINESS.name} team</p>`,
    ),
    send(
      OWNER,
      `New newsletter subscriber: ${email}`,
      `<p><strong>Email:</strong> ${email}</p>`,
    ),
  ]);
}
