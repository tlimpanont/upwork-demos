"use server";

import { z } from "zod";
import { Resend } from "resend";
import { PROJECT_TYPES } from "./project-types";

// Server action for the contact form. Receives the form submission, runs
// validation + a honeypot anti-spam check, and dispatches an email via
// Resend to the address configured in RESEND_TO_EMAIL.
//
// Why this exists:
//   - Keeps the personal email out of the source tree entirely; it lives
//     only as a runtime env var.
//   - Honeypot field defeats the trivial scraping bots that just fill
//     every input on a page.
//   - Zod validation guards against payloads from anywhere that isn't
//     the form (no client-side trust).

const inputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Use a valid email"),
  company: z.string().max(120).optional().default(""),
  projectType: z.enum(PROJECT_TYPES).default("Other"),
  message: z
    .string()
    .min(10, "Tell me a bit more — at least 10 characters")
    .max(4000, "Message is too long; keep it under 4000 characters"),
});

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

// Generic outward-facing error so we don't leak provider-specific details
// (quota messages, "domain not verified", etc.) to the client. The real
// error is logged server-side for debugging.
const GENERIC_SEND_ERROR =
  "Couldn't send the message. Please try again or reach out via LinkedIn.";

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot field uses an obscure name so browser autofill doesn't grab
  // it. Anything common ("website", "url", "email_alt") gets filled by
  // Chrome / Safari password-managers and trips legitimate users. Bots
  // that blindly fill every text input still get caught.
  const honeypot = formData.get("hp_extra_ref");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { status: "success" };
  }

  const parsed = inputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    projectType: formData.get("projectType") ?? "Other",
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      status: "error",
      error: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_TO_EMAIL;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  if (!apiKey || !toEmail) {
    console.error(
      "[contact] RESEND_API_KEY or RESEND_TO_EMAIL not configured.",
    );
    return { status: "error", error: GENERIC_SEND_ERROR };
  }


  const resend = new Resend(apiKey);
  const data = parsed.data;
  // Strip CR/LF from values interpolated into the email subject so a
  // pathological input can't smuggle extra headers via newline injection.
  // The SDK likely defends already, but it's a free defence in depth.
  const safeSubject = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
  const subject = `New enquiry · ${safeSubject(data.projectType)} · ${safeSubject(data.name)}${data.company ? ` (${safeSubject(data.company)})` : ""}`;
  const text = [
    `From: ${data.name} <${data.email}>`,
    data.company ? `Company: ${data.company}` : null,
    `Project type: ${data.projectType}`,
    "",
    data.message,
  ]
    .filter(Boolean)
    .join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.55;color:#0b1220;">
      <h2 style="margin:0 0 8px;font-size:18px;">New contact enquiry</h2>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;">${escapeHtml(data.projectType)} · ${escapeHtml(data.name)}${data.company ? ` · ${escapeHtml(data.company)}` : ""}</p>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">From</td><td><a href="mailto:${encodeURIComponent(data.email)}">${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</a></td></tr>
        ${data.company ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Company</td><td>${escapeHtml(data.company)}</td></tr>` : ""}
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Type</td><td>${escapeHtml(data.projectType)}</td></tr>
      </table>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:pre-wrap;font-size:14px;">${escapeHtml(data.message)}</div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: data.email,
      subject,
      text,
      html,
    });
    if (result.error) {
      console.error("[contact] Resend error:", result.error);
      return { status: "error", error: GENERIC_SEND_ERROR };
    }
    return { status: "success" };
  } catch (err) {
    console.error("[contact] Unexpected error sending message:", err);
    return { status: "error", error: GENERIC_SEND_ERROR };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
