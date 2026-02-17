// HTML email templates for Harbor notifications
// Using inline styles for maximum email client compatibility

const COLORS = {
  ocean: "#1B6B7D",
  coral: "#D4725C",
  amber: "#C4943A",
  sage: "#6B8F71",
  slate: "#2C3E50",
  sand: "#F5F0E8",
  white: "#FFFFFF",
  lightGray: "#F8F8F5",
};

/** Shared email wrapper */
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0; padding:0; background-color:${COLORS.lightGray}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px; margin:0 auto; padding:24px 16px;">
    <!-- Header -->
    <div style="text-align:center; padding:20px 0 16px;">
      <div style="display:inline-block; background:${COLORS.ocean}; color:white; width:40px; height:40px; border-radius:50%; line-height:40px; font-size:18px; font-weight:600;">H</div>
      <div style="font-size:20px; font-weight:600; color:${COLORS.slate}; margin-top:8px;">Harbor</div>
    </div>

    <!-- Content -->
    <div style="background:${COLORS.white}; border-radius:12px; padding:24px; border:1px solid #E8E0D0;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:20px 0; font-size:12px; color:#7F9BAC;">
      <p style="margin:0 0 4px;">Harbor &mdash; Elder Care Navigator</p>
      <p style="margin:0;">A steady hand when your family needs it most.</p>
    </div>
  </div>
</body>
</html>`;
}

// --- Alert Email ---

export interface AlertEmailData {
  elderName: string;
  alertTitle: string;
  alertMessage: string;
  severity: "urgent" | "actionable" | "informational";
  sourceUrl?: string;
  domain?: string;
  appUrl: string;
}

export function alertEmailSubject(data: AlertEmailData): string {
  const prefix = data.severity === "urgent" ? "Urgent Alert" : "New Alert";
  return `${prefix} for ${data.elderName}: ${data.alertTitle}`;
}

export function alertEmailHtml(data: AlertEmailData): string {
  const severityColor =
    data.severity === "urgent"
      ? COLORS.coral
      : data.severity === "actionable"
        ? COLORS.amber
        : COLORS.ocean;

  const severityLabel =
    data.severity === "urgent"
      ? "Urgent"
      : data.severity === "actionable"
        ? "Action Needed"
        : "For Your Awareness";

  return emailLayout(`
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
      <span style="display:inline-block; background:${severityColor}; color:white; font-size:11px; font-weight:600; padding:3px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">${severityLabel}</span>
      ${data.domain ? `<span style="font-size:12px; color:#7F9BAC;">${data.domain}</span>` : ""}
    </div>

    <h2 style="margin:0 0 12px; font-size:18px; color:${COLORS.slate}; font-weight:600;">${data.alertTitle}</h2>

    <p style="margin:0 0 20px; font-size:14px; color:#4A6274; line-height:1.6;">${data.alertMessage}</p>

    ${data.sourceUrl ? `<p style="margin:0 0 20px;"><a href="${data.sourceUrl}" style="font-size:13px; color:${COLORS.ocean};">View source &rarr;</a></p>` : ""}

    <div style="text-align:center; padding-top:8px; border-top:1px solid #E8E0D0;">
      <a href="${data.appUrl}/monitoring" style="display:inline-block; background:${COLORS.ocean}; color:white; text-decoration:none; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:600;">View in Harbor</a>
    </div>
  `);
}

// --- Briefing Email ---

export interface BriefingEmailData {
  elderName: string;
  weekOf: string;
  urgentCount: number;
  importantCount: number;
  signalCount: number;
  /** First ~300 chars of briefing content */
  preview: string;
  appUrl: string;
}

export function briefingEmailSubject(data: BriefingEmailData): string {
  return `Weekly Briefing for ${data.elderName} - ${data.weekOf}`;
}

export function briefingEmailHtml(data: BriefingEmailData): string {
  return emailLayout(`
    <h2 style="margin:0 0 4px; font-size:18px; color:${COLORS.slate}; font-weight:600;">Weekly Briefing</h2>
    <p style="margin:0 0 20px; font-size:13px; color:#7F9BAC;">For ${data.elderName} &middot; ${data.weekOf}</p>

    <!-- Stats -->
    <div style="display:flex; gap:12px; margin-bottom:20px;">
      ${data.urgentCount > 0 ? `<div style="flex:1; text-align:center; padding:12px; background:${COLORS.coral}10; border-radius:8px;"><div style="font-size:22px; font-weight:700; color:${COLORS.coral};">${data.urgentCount}</div><div style="font-size:11px; color:${COLORS.coral}; text-transform:uppercase;">Urgent</div></div>` : ""}
      ${data.importantCount > 0 ? `<div style="flex:1; text-align:center; padding:12px; background:${COLORS.amber}10; border-radius:8px;"><div style="font-size:22px; font-weight:700; color:${COLORS.amber};">${data.importantCount}</div><div style="font-size:11px; color:${COLORS.amber}; text-transform:uppercase;">Important</div></div>` : ""}
      <div style="flex:1; text-align:center; padding:12px; background:${COLORS.ocean}10; border-radius:8px;">
        <div style="font-size:22px; font-weight:700; color:${COLORS.ocean};">${data.signalCount}</div>
        <div style="font-size:11px; color:${COLORS.ocean}; text-transform:uppercase;">Signals</div>
      </div>
    </div>

    <!-- Preview -->
    <div style="background:${COLORS.lightGray}; border-radius:8px; padding:16px; margin-bottom:20px;">
      <p style="margin:0; font-size:14px; color:#4A6274; line-height:1.6;">${data.preview}...</p>
    </div>

    <div style="text-align:center; padding-top:8px; border-top:1px solid #E8E0D0;">
      <a href="${data.appUrl}/briefing" style="display:inline-block; background:${COLORS.ocean}; color:white; text-decoration:none; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:600;">Read Full Briefing</a>
    </div>
  `);
}

// --- Task Created Email ---

export interface TaskEmailData {
  elderName: string;
  taskTitle: string;
  priority: string;
  domain: string;
  why: string;
  suggestedActions: string[];
  appUrl: string;
}

export function taskEmailSubject(data: TaskEmailData): string {
  return `New Task for ${data.elderName}: ${data.taskTitle}`;
}

export function taskEmailHtml(data: TaskEmailData): string {
  const priorityColor =
    data.priority === "high"
      ? COLORS.coral
      : data.priority === "medium"
        ? COLORS.amber
        : COLORS.sage;

  const actionsList = data.suggestedActions
    .map(
      (a) =>
        `<li style="margin-bottom:6px; font-size:14px; color:#4A6274;">${a}</li>`
    )
    .join("");

  return emailLayout(`
    <div style="margin-bottom:16px;">
      <span style="display:inline-block; background:${priorityColor}; color:white; font-size:11px; font-weight:600; padding:3px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">${data.priority} priority</span>
      <span style="font-size:12px; color:#7F9BAC; margin-left:8px;">${data.domain}</span>
    </div>

    <h2 style="margin:0 0 8px; font-size:18px; color:${COLORS.slate}; font-weight:600;">${data.taskTitle}</h2>
    <p style="margin:0 0 16px; font-size:14px; color:#4A6274; line-height:1.5;">${data.why}</p>

    <div style="background:${COLORS.lightGray}; border-radius:8px; padding:16px; margin-bottom:20px;">
      <div style="font-size:12px; font-weight:600; color:#7F9BAC; text-transform:uppercase; margin-bottom:8px;">Suggested Steps</div>
      <ol style="margin:0; padding-left:20px;">
        ${actionsList}
      </ol>
    </div>

    <div style="text-align:center; padding-top:8px; border-top:1px solid #E8E0D0;">
      <a href="${data.appUrl}/tasks" style="display:inline-block; background:${COLORS.ocean}; color:white; text-decoration:none; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:600;">View Tasks</a>
    </div>
  `);
}
