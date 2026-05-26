"use server";

import { z } from "zod";
import { Resend } from "resend";
import { cookies } from "next/headers";
import {
  demoDestinationUrl,
  demoGateCookieAttributes,
  findDemoById,
  normaliseReturnTo,
} from "@/lib/demo-gate";

// Server action for the demo gate. Mirrors the contact form's defences
// (zod validation, honeypot, generic outward error) but trimmed to a
// lightweight 3-field capture so a visitor curious enough to open a
// demo doesn't bounce on a long form.
//
// On success: set a long-lived "passed" cookie so subsequent demo opens
// skip the gate, and return the destination URL so the client can
// navigate the same tab onward.

const inputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Use a valid email"),
  message: z.string().max(2000, "Keep it under 2000 characters").optional().default(""),
});

export type DemoGateValues = {
  name?: string;
  email?: string;
  message?: string;
};

export type DemoGateState =
  | { status: "idle" }
  | { status: "success"; destination: string }
  | {
      status: "error";
      error: string;
      fieldErrors?: Record<string, string>;
      values?: DemoGateValues;
    };

const GENERIC_SEND_ERROR =
  "Couldn't record that. Please try again or reach out via the contact page.";

export async function submitDemoGate(
  demoId: string,
  _prev: DemoGateState,
  formData: FormData,
): Promise<DemoGateState> {
  const app = findDemoById(demoId);
  if (!app) {
    return {
      status: "error",
      error: "Unknown demo.",
    };
  }

  // If the visitor was deep-linking into the demo (e.g. middleware on the
  // demo subdomain bounced them here from /some/page), the original URL
  // is in `return_to`. Validate that it points at this demo's origin so
  // the gate can't be turned into an open redirect.
  const requestedReturnTo = normaliseReturnTo(
    app,
    formData.get("return_to")?.toString(),
  );
  const destination = requestedReturnTo ?? demoDestinationUrl(app);

  // Honeypot: same obscure name pattern as the main contact form, for
  // the same reason — browser autofill ignores it but blind bots fill it.
  const honeypot = formData.get("hp_extra_ref");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    // Pretend success so the bot navigates away. Do not set the cookie
    // and do not send mail.
    return { status: "success", destination };
  }

  const submitted: DemoGateValues = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = inputSchema.safeParse(submitted);
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
      values: submitted,
    };
  }

  const data = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  // If Resend isn't configured, still let the visitor through — the gate
  // is a lead-capture nicety, not auth. Log so the operator sees missed
  // notifications.
  if (apiKey && toEmail) {
    const resend = new Resend(apiKey);
    const safeSubject = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
    const subject = `Demo gate · ${safeSubject(app.name)} · ${safeSubject(data.name)}`;
    const text = [
      `From: ${data.name} <${data.email}>`,
      `Demo: ${app.name} (${app.id})`,
      data.message ? "" : null,
      data.message ? data.message : null,
    ]
      .filter((line) => line !== null)
      .join("\n");
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.55;color:#0b1220;">
        <h2 style="margin:0 0 8px;font-size:18px;">Demo gate enquiry</h2>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;">${escapeHtml(app.name)} · ${escapeHtml(data.name)}</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">From</td><td><a href="mailto:${encodeURIComponent(data.email)}">${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Demo</td><td>${escapeHtml(app.name)} (<code>${escapeHtml(app.id)}</code>)</td></tr>
        </table>
        ${data.message ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:pre-wrap;font-size:14px;">${escapeHtml(data.message)}</div>` : ""}
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
        console.error("[demo-gate] Resend error:", result.error);
        return {
          status: "error",
          error: GENERIC_SEND_ERROR,
          values: submitted,
        };
      }
    } catch (err) {
      console.error("[demo-gate] Unexpected error sending notification:", err);
      return {
        status: "error",
        error: GENERIC_SEND_ERROR,
        values: submitted,
      };
    }
  } else {
    console.warn(
      "[demo-gate] RESEND_API_KEY or RESEND_TO_EMAIL not configured; gate let visitor through without notification.",
    );
  }

  const jar = await cookies();
  jar.set({
    ...demoGateCookieAttributes(),
    value: "1",
  });

  return { status: "success", destination };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}