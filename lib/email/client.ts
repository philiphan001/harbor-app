// Resend email client for Harbor notifications

import { Resend } from "resend";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("email");

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    log.warn("RESEND_API_KEY not set — email sending disabled");
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Default sender — update domain once you verify one in Resend
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Harbor <onboarding@resend.dev>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback */
  text?: string;
}

/**
 * Send an email via Resend. Returns true on success, false on failure.
 * Fails silently — email should never block core app functionality.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      log.errorWithStack("Failed to send email", error);
      return false;
    }

    log.info("Email sent", { to: options.to, subject: options.subject });
    return true;
  } catch (error) {
    log.errorWithStack("Email send error", error);
    return false;
  }
}
