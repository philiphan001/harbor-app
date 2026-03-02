// Script to generate a HIPAA Authorization Form PDF
// Run: node scripts/generate-hipaa-pdf.mjs

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const OUTPUT_PATH = "public/forms/hipaa/HIPAA_Authorization.pdf";

async function generateHipaaForm() {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);

  const pageWidth = 612; // letter
  const pageHeight = 792;
  const margin = 60;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lineColor = rgb(0.7, 0.7, 0.7);
  const headerBg = rgb(0.95, 0.95, 0.95);

  // Helper: draw a horizontal line
  function drawLine(page, y, x1 = margin, x2 = pageWidth - margin) {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: lineColor });
  }

  // Helper: draw a fill-in line
  function drawFieldLine(page, y, x1, x2) {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.75, color: black });
  }

  // Helper: draw checkbox
  function drawCheckbox(page, x, y, size = 10) {
    page.drawRectangle({ x, y: y - size + 2, width: size, height: size, borderColor: black, borderWidth: 0.75 });
  }

  // Helper: wrap text into lines
  function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // ==================== PAGE 1 ====================
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;

  // Title
  page.drawText("AUTHORIZATION FOR RELEASE OF", {
    x: margin,
    y,
    font: helveticaBold,
    size: 16,
    color: black,
  });
  y -= 22;
  page.drawText("PROTECTED HEALTH INFORMATION", {
    x: margin,
    y,
    font: helveticaBold,
    size: 16,
    color: black,
  });
  y -= 16;
  page.drawText("(HIPAA Authorization Form)", {
    x: margin,
    y,
    font: helvetica,
    size: 11,
    color: darkGray,
  });
  y -= 30;

  drawLine(page, y);
  y -= 25;

  // Section 1: Patient Information
  page.drawText("SECTION 1: PATIENT INFORMATION", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 28;

  const labelFont = helvetica;
  const labelSize = 10;
  const fieldGap = 32;

  // Patient Name
  page.drawText("Patient Name:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 80, pageWidth - margin);
  y -= fieldGap;

  // Date of Birth / SSN (last 4)
  page.drawText("Date of Birth:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 80, margin + 230);
  page.drawText("SSN (last 4):", { x: margin + 260, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 340, pageWidth - margin);
  y -= fieldGap;

  // Address
  page.drawText("Address:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 80, pageWidth - margin);
  y -= fieldGap;

  // City / State / Zip
  page.drawText("City:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 30, margin + 200);
  page.drawText("State:", { x: margin + 220, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 260, margin + 330);
  page.drawText("Zip:", { x: margin + 350, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 375, pageWidth - margin);
  y -= fieldGap;

  // Phone
  page.drawText("Phone:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 80, margin + 250);
  page.drawText("Email:", { x: margin + 270, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 310, pageWidth - margin);
  y -= 35;

  drawLine(page, y);
  y -= 25;

  // Section 2: Authorized Person(s)
  page.drawText("SECTION 2: PERSON(S) AUTHORIZED TO RECEIVE INFORMATION", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  const sec2Text = "I authorize the disclosure of my protected health information to the following person(s):";
  page.drawText(sec2Text, { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  y -= 30;

  // Authorized Person 1
  page.drawText("Name:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 40, margin + 280);
  page.drawText("Relationship:", { x: margin + 300, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 375, pageWidth - margin);
  y -= fieldGap;

  page.drawText("Phone:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 42, margin + 220);
  page.drawText("Email:", { x: margin + 240, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 278, pageWidth - margin);
  y -= fieldGap;

  // Authorized Person 2
  page.drawText("Name:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 40, margin + 280);
  page.drawText("Relationship:", { x: margin + 300, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 375, pageWidth - margin);
  y -= fieldGap;

  page.drawText("Phone:", { x: margin, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 42, margin + 220);
  page.drawText("Email:", { x: margin + 240, y, font: labelFont, size: labelSize, color: darkGray });
  drawFieldLine(page, y - 2, margin + 278, pageWidth - margin);
  y -= 30;

  drawLine(page, y);
  y -= 25;

  // Section 3: Information to be Disclosed
  page.drawText("SECTION 3: INFORMATION TO BE DISCLOSED", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  page.drawText("I authorize the release of the following health information (check all that apply):", {
    x: margin,
    y,
    font: labelFont,
    size: labelSize,
    color: darkGray,
  });
  y -= 24;

  const checkboxItems = [
    "Complete medical records",
    "Medical history and physical exams",
    "Laboratory / test results",
    "Medications and prescriptions",
    "Diagnoses and treatment plans",
    "Imaging / radiology reports",
    "Surgical / operative reports",
    "Billing and insurance information",
    "Mental health records",
    "Other (specify below):",
  ];

  const colWidth = contentWidth / 2;
  for (let i = 0; i < checkboxItems.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * colWidth;
    const cy = y - row * 20;
    drawCheckbox(page, cx, cy);
    page.drawText(checkboxItems[i], { x: cx + 15, y: cy - 8, font: labelFont, size: 9.5, color: black });
  }
  y -= Math.ceil(checkboxItems.length / 2) * 20 + 8;

  drawFieldLine(page, y, margin, pageWidth - margin);
  y -= 25;

  drawLine(page, y);
  y -= 25;

  // Section 4: Purpose
  page.drawText("SECTION 4: PURPOSE OF DISCLOSURE", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  const purposeItems = [
    "Continuity of care / coordination between providers",
    "Personal / family use",
    "Legal purposes",
    "Insurance",
    "Other:",
  ];
  for (let i = 0; i < purposeItems.length; i++) {
    const cx = margin;
    const cy = y - i * 20;
    drawCheckbox(page, cx, cy);
    page.drawText(purposeItems[i], { x: cx + 15, y: cy - 8, font: labelFont, size: 9.5, color: black });
  }
  y -= purposeItems.length * 20 + 5;
  drawFieldLine(page, y, margin, pageWidth - margin);

  // ==================== PAGE 2 ====================
  page = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - 50;

  // Section 5: Providers
  page.drawText("SECTION 5: HEALTHCARE PROVIDER(S) TO RELEASE INFORMATION", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  page.drawText("I authorize the following healthcare provider(s) to disclose my information:", {
    x: margin,
    y,
    font: labelFont,
    size: labelSize,
    color: darkGray,
  });
  y -= 28;

  for (let p = 1; p <= 3; p++) {
    page.drawText(`Provider ${p}:`, { x: margin, y, font: helveticaBold, size: 9, color: darkGray });
    y -= 18;
    page.drawText("Name:", { x: margin + 10, y, font: labelFont, size: 9.5, color: darkGray });
    drawFieldLine(page, y - 2, margin + 48, pageWidth - margin);
    y -= 22;
    page.drawText("Address:", { x: margin + 10, y, font: labelFont, size: 9.5, color: darkGray });
    drawFieldLine(page, y - 2, margin + 55, pageWidth - margin);
    y -= 22;
    page.drawText("Phone:", { x: margin + 10, y, font: labelFont, size: 9.5, color: darkGray });
    drawFieldLine(page, y - 2, margin + 48, margin + 250);
    page.drawText("Fax:", { x: margin + 270, y, font: labelFont, size: 9.5, color: darkGray });
    drawFieldLine(page, y - 2, margin + 295, pageWidth - margin);
    y -= 28;
  }

  drawLine(page, y);
  y -= 25;

  // Section 6: Expiration
  page.drawText("SECTION 6: EXPIRATION", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  page.drawText("This authorization expires on (check one):", {
    x: margin,
    y,
    font: labelFont,
    size: labelSize,
    color: darkGray,
  });
  y -= 24;

  const expirationItems = [
    "Specific date:",
    "Upon the following event:",
    "One year from the date of signature",
    "Upon revocation by the patient",
  ];
  for (let i = 0; i < expirationItems.length; i++) {
    const cy = y - i * 22;
    drawCheckbox(page, margin, cy);
    page.drawText(expirationItems[i], { x: margin + 15, y: cy - 8, font: labelFont, size: 9.5, color: black });
    if (i < 2) {
      drawFieldLine(page, cy - 10, margin + 15 + helvetica.widthOfTextAtSize(expirationItems[i], 9.5) + 8, pageWidth - margin);
    }
  }
  y -= expirationItems.length * 22 + 10;

  drawLine(page, y);
  y -= 25;

  // Section 7: Patient Rights
  page.drawText("SECTION 7: PATIENT RIGHTS", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 20;

  const rightsText = [
    "I understand that:",
    "",
    "1. I may revoke this authorization at any time by notifying the healthcare provider in writing, except to the extent that action has already been taken in reliance on this authorization.",
    "",
    "2. I may refuse to sign this authorization, and my refusal will not affect my ability to obtain treatment, payment, enrollment, or eligibility for benefits.",
    "",
    "3. Information disclosed pursuant to this authorization may be subject to re-disclosure by the recipient and may no longer be protected by federal privacy regulations.",
    "",
    "4. I have the right to receive a copy of this authorization.",
    "",
    "5. I authorize the release of my information as described above, and I understand the information may include records relating to mental health, substance abuse, and/or HIV/AIDS (if checked in Section 3).",
  ];

  for (const line of rightsText) {
    if (!line) { y -= 6; continue; }
    const wrapped = wrapText(line, timesRoman, 9.5, contentWidth);
    for (const wl of wrapped) {
      page.drawText(wl, { x: margin, y, font: timesRoman, size: 9.5, color: black });
      y -= 14;
    }
  }
  y -= 10;

  drawLine(page, y);
  y -= 30;

  // Section 8: Signatures
  page.drawText("SECTION 8: SIGNATURE", {
    x: margin,
    y,
    font: helveticaBold,
    size: 11,
    color: black,
  });
  y -= 35;

  // Patient signature
  drawFieldLine(page, y, margin, margin + 320);
  drawFieldLine(page, y, margin + 360, pageWidth - margin);
  y -= 14;
  page.drawText("Patient Signature", { x: margin, y, font: labelFont, size: 8, color: darkGray });
  page.drawText("Date", { x: margin + 360, y, font: labelFont, size: 8, color: darkGray });
  y -= 28;

  // Printed name
  drawFieldLine(page, y, margin, margin + 320);
  y -= 14;
  page.drawText("Patient Printed Name", { x: margin, y, font: labelFont, size: 8, color: darkGray });
  y -= 30;

  // If signed by personal representative
  page.drawText("If signed by a personal representative:", { x: margin, y, font: helveticaBold, size: 9, color: darkGray });
  y -= 28;

  drawFieldLine(page, y, margin, margin + 320);
  drawFieldLine(page, y, margin + 360, pageWidth - margin);
  y -= 14;
  page.drawText("Representative Signature", { x: margin, y, font: labelFont, size: 8, color: darkGray });
  page.drawText("Date", { x: margin + 360, y, font: labelFont, size: 8, color: darkGray });
  y -= 28;

  drawFieldLine(page, y, margin, margin + 320);
  y -= 14;
  page.drawText("Representative Printed Name", { x: margin, y, font: labelFont, size: 8, color: darkGray });
  y -= 28;

  drawFieldLine(page, y, margin, pageWidth - margin);
  y -= 14;
  page.drawText("Relationship to Patient / Authority to Act", { x: margin, y, font: labelFont, size: 8, color: darkGray });

  // Footer
  y = 40;
  page.drawText("HIPAA Authorization for Release of Protected Health Information", {
    x: margin,
    y,
    font: helvetica,
    size: 7,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText("Page 2 of 2", {
    x: pageWidth - margin - 40,
    y,
    font: helvetica,
    size: 7,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Add footer to page 1
  const page1 = doc.getPage(0);
  page1.drawText("HIPAA Authorization for Release of Protected Health Information", {
    x: margin,
    y: 40,
    font: helvetica,
    size: 7,
    color: rgb(0.5, 0.5, 0.5),
  });
  page1.drawText("Page 1 of 2", {
    x: pageWidth - margin - 40,
    y: 40,
    font: helvetica,
    size: 7,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save
  const pdfBytes = await doc.save();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, pdfBytes);
  console.log(`Generated HIPAA form: ${OUTPUT_PATH} (${pdfBytes.length} bytes, ${doc.getPageCount()} pages)`);
}

generateHipaaForm().catch(console.error);
