// High-level email sending functions for Harbor notifications
// All functions are fire-and-forget — they never throw or block app flow.

import { sendEmail } from "./client";
import {
  alertEmailSubject,
  alertEmailHtml,
  briefingEmailSubject,
  briefingEmailHtml,
  taskEmailSubject,
  taskEmailHtml,
  type AlertEmailData,
  type BriefingEmailData,
  type TaskEmailData,
} from "./templates";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("email/send");

/** Base URL for links in emails */
function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"
  );
}

/**
 * Send an alert notification email.
 * Only sends for "urgent" and "actionable" severity — skips informational.
 */
export async function sendAlertEmail(
  to: string,
  opts: {
    elderName: string;
    alertTitle: string;
    alertMessage: string;
    severity: "urgent" | "actionable" | "informational";
    sourceUrl?: string;
    domain?: string;
  }
): Promise<void> {
  // Skip informational — too noisy for email
  if (opts.severity === "informational") return;

  const data: AlertEmailData = { ...opts, appUrl: getAppUrl() };

  try {
    await sendEmail({
      to,
      subject: alertEmailSubject(data),
      html: alertEmailHtml(data),
    });
  } catch (error) {
    log.errorWithStack("Failed to send alert email", error);
  }
}

/**
 * Send a weekly briefing notification email.
 */
export async function sendBriefingEmail(
  to: string,
  opts: {
    elderName: string;
    weekOf: string;
    urgentCount: number;
    importantCount: number;
    signalCount: number;
    content: string;
  }
): Promise<void> {
  const data: BriefingEmailData = {
    elderName: opts.elderName,
    weekOf: opts.weekOf,
    urgentCount: opts.urgentCount,
    importantCount: opts.importantCount,
    signalCount: opts.signalCount,
    preview: opts.content.slice(0, 300).replace(/[#*_\[\]]/g, ""),
    appUrl: getAppUrl(),
  };

  try {
    await sendEmail({
      to,
      subject: briefingEmailSubject(data),
      html: briefingEmailHtml(data),
    });
  } catch (error) {
    log.errorWithStack("Failed to send briefing email", error);
  }
}

/**
 * Send a new task notification email.
 * Only sends for "high" priority tasks.
 */
export async function sendTaskEmail(
  to: string,
  opts: {
    elderName: string;
    taskTitle: string;
    priority: string;
    domain: string;
    why: string;
    suggestedActions: string[];
  }
): Promise<void> {
  // Only email for high-priority tasks
  if (opts.priority !== "high") return;

  const data: TaskEmailData = { ...opts, appUrl: getAppUrl() };

  try {
    await sendEmail({
      to,
      subject: taskEmailSubject(data),
      html: taskEmailHtml(data),
    });
  } catch (error) {
    log.errorWithStack("Failed to send task email", error);
  }
}
