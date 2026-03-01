"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import { exportWalletCardHtml, exportWalletCardText } from "@/lib/utils/walletCardExport";

export default function WalletCardPage() {
  const [data, setData] = useState<ExportData | null>(null);
  const [parentName, setParentName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);

    const exportData = gatherExportData();
    setData(exportData);
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    const text = exportWalletCardText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const html = exportWalletCardHtml(data);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const emergencyContact = data?.emergencyContacts[0];
  const doctor = data?.primaryDoctor;
  const insurance = data?.insurance;

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-coral to-[#B85A4A] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Emergency Wallet Card
          </h1>
          <p className="font-sans text-sm text-white/80 mt-1">
            Print and carry in your parent&apos;s wallet
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* Card Preview — Front */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-1">
          Card Preview — Front
        </div>
        <div
          className="bg-white border-2 border-coral/30 rounded-[10px] px-4 py-3 shadow-sm"
          style={{ aspectRatio: "3.375 / 2.125" }}
        >
          <div className="font-sans text-[10px] font-bold text-coral uppercase tracking-wide mb-2">
            Emergency Medical Card
          </div>
          <div className="flex flex-col gap-1 font-sans text-[11px]">
            <div>
              <span className="text-slateLight text-[9px] uppercase">Name: </span>
              <span className="font-semibold text-slate">{parentName || "—"}</span>
              {data?.parentAge && (
                <span className="ml-2 text-slateLight text-[9px] uppercase">Age: <span className="font-semibold text-slate text-[11px]">{data.parentAge}</span></span>
              )}
            </div>
            <div>
              <span className="text-slateLight text-[9px] uppercase">Allergies: </span>
              <span className="text-slate">{data && data.conditions.length > 0 ? data.conditions.join(", ") : "None recorded"}</span>
            </div>
            {emergencyContact && (
              <div>
                <span className="text-slateLight text-[9px] uppercase">Emergency: </span>
                <span className="text-slate">{emergencyContact.name} {emergencyContact.phone}</span>
              </div>
            )}
            {doctor && (
              <div>
                <span className="text-slateLight text-[9px] uppercase">Doctor: </span>
                <span className="text-slate">{doctor.name} {doctor.phone}</span>
              </div>
            )}
            {insurance && (
              <div>
                <span className="text-slateLight text-[9px] uppercase">Insurance: </span>
                <span className="text-slate">{insurance.provider} — {insurance.policyNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Preview — Back */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-1">
          Card Preview — Back
        </div>
        <div
          className="bg-white border-2 border-coral/30 rounded-[10px] px-4 py-3 shadow-sm"
          style={{ aspectRatio: "3.375 / 2.125" }}
        >
          <div className="font-sans text-[9px] font-bold text-ocean uppercase tracking-wide mb-1">
            Medications
          </div>
          <div className="flex flex-col gap-0.5 mb-2">
            {data && data.medications.length > 0 ? (
              data.medications.slice(0, 6).map((med, i) => (
                <div key={i} className="font-sans text-[10px] text-slate">
                  {med.name}{med.dosage ? ` ${med.dosage}` : ""}
                </div>
              ))
            ) : (
              <div className="font-sans text-[10px] text-slateMid">None</div>
            )}
            {data && data.medications.length > 6 && (
              <div className="font-sans text-[9px] text-slateMid">+{data.medications.length - 6} more</div>
            )}
          </div>
          <div className="font-sans text-[9px] font-bold text-ocean uppercase tracking-wide mb-1">
            Conditions
          </div>
          <div className="flex flex-col gap-0.5">
            {data && data.conditions.length > 0 ? (
              data.conditions.map((cond, i) => (
                <div key={i} className="font-sans text-[10px] text-slate">{cond}</div>
              ))
            ) : (
              <div className="font-sans text-[10px] text-slateMid">None recorded</div>
            )}
          </div>
        </div>

        {/* Missing Data Note */}
        {data && data.conditions.length === 0 && (
          <div className="bg-amber/10 border border-amber/30 rounded-[14px] px-4 py-3">
            <div className="font-sans text-xs text-amber">
              No allergies recorded.{" "}
              <Link href="/help" className="font-semibold underline">Add them via Harbor chat</Link>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-[12px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold bg-ocean text-white border-2 border-ocean hover:bg-ocean/90"
          >
            <span>{"\ud83d\udda8\ufe0f"}</span>
            <span>Print Card</span>
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 rounded-[12px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold ${
              copySuccess
                ? "bg-sage/20 border-2 border-sage text-sage"
                : "bg-sand/50 border-2 border-sandDark text-slate hover:bg-sand"
            }`}
          >
            {copySuccess ? (
              <><span>{"\u2713"}</span><span>Copied!</span></>
            ) : (
              <><span>{"\ud83d\udccb"}</span><span>Copy Text</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
