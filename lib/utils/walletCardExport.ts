import type { ExportData } from "./exportCareSummary";

/**
 * Generate compact HTML for a credit-card-sized emergency wallet card.
 * Uses @page CSS sized to 3.375" x 2.125" (standard credit card).
 */
export function exportWalletCardHtml(data: ExportData): string {
  const allergies = data.conditions.length > 0 ? data.conditions.join(", ") : "None recorded";
  const emergencyContact = data.emergencyContacts[0];
  const doctor = data.primaryDoctor;
  const insurance = data.insurance;

  const medsHtml = data.medications.length > 0
    ? data.medications.map((m) => {
        let line = esc(m.name);
        if (m.dosage) line += ` ${esc(m.dosage)}`;
        return `<div class="med">${line}</div>`;
      }).join("")
    : '<div class="med">None</div>';

  const conditionsHtml = data.conditions.length > 0
    ? data.conditions.map((c) => `<div class="med">${esc(c)}</div>`).join("")
    : '<div class="med">None recorded</div>';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 3.375in 2.125in; margin: 0; }
  @media print {
    body { margin: 0; padding: 0; }
    .card { page-break-after: always; box-shadow: none !important; border: none !important; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
  .card {
    width: 3.375in; height: 2.125in; border: 1px solid #ccc; border-radius: 8px;
    padding: 8px 10px; box-sizing: border-box; font-size: 7pt; line-height: 1.3;
    overflow: hidden; margin-bottom: 12px; position: relative;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .card-title { font-size: 8pt; font-weight: 700; color: #D4725C; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .label { color: #8A9499; font-size: 6pt; text-transform: uppercase; letter-spacing: 0.3px; }
  .value { font-weight: 600; color: #2D3A3E; }
  .row { margin-bottom: 3px; }
  .med { font-size: 6.5pt; color: #2D3A3E; }
  .section-title { font-size: 6.5pt; font-weight: 700; color: #1B6B7D; text-transform: uppercase; margin-top: 4px; margin-bottom: 2px; }
  .footer { font-size: 5pt; color: #8A9499; position: absolute; bottom: 4px; right: 6px; }
</style>
</head>
<body>

<!-- Front -->
<div class="card">
  <div class="card-title">Emergency Medical Card</div>
  <div class="row"><span class="label">Name: </span><span class="value">${esc(data.parentName)}</span>${data.parentAge ? ` <span class="label">Age: </span><span class="value">${data.parentAge}</span>` : ""}</div>
  <div class="row"><span class="label">Allergies: </span><span class="value">${esc(allergies)}</span></div>
  ${emergencyContact ? `<div class="row"><span class="label">Emergency: </span><span class="value">${esc(emergencyContact.name)} ${esc(emergencyContact.phone)}</span></div>` : ""}
  ${doctor ? `<div class="row"><span class="label">Doctor: </span><span class="value">${esc(doctor.name)} ${esc(doctor.phone)}</span></div>` : ""}
  ${insurance ? `<div class="row"><span class="label">Insurance: </span><span class="value">${esc(insurance.provider)}</span></div><div class="row"><span class="label">Member ID: </span><span class="value">${esc(insurance.policyNumber)}</span></div>` : ""}
  <div class="footer">Harbor</div>
</div>

<!-- Back -->
<div class="card">
  <div class="section-title">Medications</div>
  ${medsHtml}
  <div class="section-title">Conditions</div>
  ${conditionsHtml}
  <div class="footer">Harbor</div>
</div>

</body>
</html>`;
}

/**
 * Generate plain text version of the wallet card.
 */
export function exportWalletCardText(data: ExportData): string {
  const lines: string[] = [];
  lines.push("EMERGENCY MEDICAL CARD");
  lines.push("─".repeat(30));
  lines.push(`Name: ${data.parentName}`);
  if (data.parentAge) lines.push(`Age: ${data.parentAge}`);
  lines.push(`Allergies: ${data.conditions.length > 0 ? data.conditions.join(", ") : "None recorded"}`);

  if (data.emergencyContacts[0]) {
    const c = data.emergencyContacts[0];
    lines.push(`Emergency Contact: ${c.name} ${c.phone}`);
  }

  if (data.primaryDoctor) {
    lines.push(`Doctor: ${data.primaryDoctor.name} ${data.primaryDoctor.phone}`);
  }

  if (data.insurance) {
    lines.push(`Insurance: ${data.insurance.provider} — ${data.insurance.policyNumber}`);
  }

  lines.push("");
  lines.push("MEDICATIONS");
  if (data.medications.length > 0) {
    for (const med of data.medications) {
      let line = `  ${med.name}`;
      if (med.dosage) line += ` ${med.dosage}`;
      lines.push(line);
    }
  } else {
    lines.push("  None");
  }

  lines.push("");
  lines.push("CONDITIONS");
  if (data.conditions.length > 0) {
    for (const cond of data.conditions) {
      lines.push(`  ${cond}`);
    }
  } else {
    lines.push("  None recorded");
  }

  return lines.join("\n");
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
