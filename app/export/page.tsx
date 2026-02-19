"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  EXPORT_SCENARIOS,
  gatherExportData,
  exportAsText,
  exportAsHtml,
  buildMailtoLink,
  type ExportScenario,
  type ExportSection,
  type ExportData,
} from "@/lib/utils/exportCareSummary";

type ExportFormat = "copy" | "email" | "print" | "pdf";

export default function ExportPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="animate-pulse font-sans text-sm text-slateMid">Loading...</div>
      </div>
    }>
      <ExportPage />
    </Suspense>
  );
}

function ExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("scenario") as ExportScenario | null;

  const [data, setData] = useState<ExportData | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ExportScenario | null>(preselected);
  const [customSections, setCustomSections] = useState<ExportSection[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const exportData = gatherExportData();
    if (!exportData) {
      router.push("/dashboard");
      return;
    }
    setData(exportData);
  }, [router]);

  // Get active sections based on scenario or custom selection
  const getActiveSections = useCallback((): ExportSection[] => {
    if (selectedScenario) {
      const scenario = EXPORT_SCENARIOS.find(s => s.id === selectedScenario);
      return scenario?.sections || [];
    }
    return customSections;
  }, [selectedScenario, customSections]);

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;
    const sections = getActiveSections();
    if (sections.length === 0) return;

    switch (format) {
      case "copy": {
        const text = exportAsText(data, sections);
        try {
          await navigator.clipboard.writeText(text);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
        break;
      }

      case "email": {
        const mailto = buildMailtoLink(data, sections);
        window.location.href = mailto;
        break;
      }

      case "print": {
        const html = exportAsHtml(data, sections);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }
        break;
      }

      case "pdf": {
        setPdfLoading(true);
        try {
          const html = exportAsHtml(data, sections);
          const response = await fetch("/api/export-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html, parentName: data.parentName }),
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.parentName.replace(/\s+/g, "_")}_Care_Summary.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error("PDF generation failed:", err);
        } finally {
          setPdfLoading(false);
        }
        break;
      }
    }
  };

  const toggleCustomSection = (section: ExportSection) => {
    setSelectedScenario(null); // Switch to custom mode
    setCustomSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeSections = getActiveSections();
  const hasContent = data && activeSections.length > 0;

  // Preview what data is available for each section
  const sectionInfo: Record<ExportSection, { label: string; icon: string; available: boolean; count?: string }> = {
    "patient-info": { label: "Patient Info", icon: "👤", available: !!data?.parentName },
    "emergency-contacts": { label: "Emergency Contacts", icon: "📞", available: (data?.emergencyContacts.length ?? 0) > 0, count: `${data?.emergencyContacts.length || 0}` },
    "primary-doctor": { label: "Primary Doctor", icon: "🩺", available: !!data?.primaryDoctor },
    specialists: { label: "Specialists", icon: "👨‍⚕️", available: (data?.specialists.length ?? 0) > 0, count: `${data?.specialists.length || 0}` },
    medications: { label: "Medications", icon: "💊", available: (data?.medications.length ?? 0) > 0, count: `${data?.medications.length || 0}` },
    conditions: { label: "Health Conditions", icon: "❤️", available: (data?.conditions.length ?? 0) > 0 },
    insurance: { label: "Insurance", icon: "🛡️", available: !!data?.insurance },
    legal: { label: "Legal Documents", icon: "⚖️", available: (data?.legalDocuments.length ?? 0) > 0, count: `${data?.legalDocuments.length || 0}` },
    tasks: { label: "Action Items", icon: "📋", available: (data?.pendingTasks.length ?? 0) > 0 || (data?.completedTasks.length ?? 0) > 0 },
    notes: { label: "Notes", icon: "📝", available: (data?.notes.length ?? 0) > 0, count: `${data?.notes.length || 0}` },
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="animate-pulse font-sans text-sm text-slateMid">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-7">
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="font-sans text-sm text-white/70 hover:text-white mb-3 flex items-center gap-1"
          >
            &larr; Back
          </button>
          <h1 className="font-serif text-[24px] font-semibold text-white tracking-tight">
            Export &amp; Share
          </h1>
          <div className="font-sans text-sm text-white/70 mt-1">
            {data.parentName}&apos;s care information
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Scenario Presets */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Choose a Scenario
        </div>

        <div className="space-y-2.5 mb-6">
          {EXPORT_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => {
                setSelectedScenario(selectedScenario === scenario.id ? null : scenario.id);
                setCustomSections([]);
              }}
              className={`w-full text-left rounded-[12px] px-4 py-3.5 border transition-all ${
                selectedScenario === scenario.id
                  ? "bg-ocean/10 border-ocean"
                  : "bg-white border-sandDark hover:border-ocean/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">{scenario.icon}</div>
                <div className="flex-1">
                  <div className={`font-sans text-sm font-semibold ${selectedScenario === scenario.id ? "text-ocean" : "text-slate"}`}>
                    {scenario.label}
                  </div>
                  <div className="font-sans text-[11px] text-slateMid mt-0.5 leading-relaxed">
                    {scenario.description}
                  </div>
                </div>
                {selectedScenario === scenario.id && (
                  <div className="w-5 h-5 bg-ocean rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Custom Section Picker */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Or Pick Sections
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {(Object.entries(sectionInfo) as [ExportSection, typeof sectionInfo[ExportSection]][]).map(([key, info]) => {
            const isActive = activeSections.includes(key);
            const isCustomActive = customSections.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleCustomSection(key)}
                disabled={!info.available}
                className={`text-left rounded-[10px] px-3 py-2.5 border transition-all ${
                  !info.available
                    ? "bg-sand/30 border-sand text-slateLight opacity-50 cursor-not-allowed"
                    : isCustomActive
                    ? "bg-ocean/10 border-ocean"
                    : isActive && selectedScenario
                    ? "bg-sage/10 border-sage/40"
                    : "bg-white border-sandDark hover:border-ocean/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{info.icon}</span>
                  <span className={`font-sans text-xs font-medium ${!info.available ? "text-slateLight" : "text-slate"}`}>
                    {info.label}
                  </span>
                </div>
                {info.count && info.available && (
                  <div className="font-sans text-[10px] text-slateMid mt-1 ml-6">
                    {info.count} recorded
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        {hasContent && (
          <>
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Preview
            </div>
            <div className="bg-white border border-sandDark rounded-[12px] px-4 py-3 mb-6 max-h-[200px] overflow-y-auto">
              <pre className="font-sans text-[11px] text-slateMid whitespace-pre-wrap leading-relaxed">
                {exportAsText(data, activeSections).substring(0, 800)}
                {exportAsText(data, activeSections).length > 800 ? "\n..." : ""}
              </pre>
            </div>
          </>
        )}

        {/* Export Actions */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Share As
        </div>

        <div className="space-y-2.5 mb-8">
          {/* Copy to Clipboard */}
          <button
            onClick={() => handleExport("copy")}
            disabled={!hasContent}
            className={`w-full rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-all ${
              hasContent
                ? copySuccess
                  ? "bg-sage/20 border-2 border-sage"
                  : "bg-white border-2 border-ocean hover:scale-[1.01]"
                : "bg-sand/30 border-2 border-sand opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${copySuccess ? "bg-sage/20" : "bg-ocean/10"}`}>
              {copySuccess ? "✓" : "📋"}
            </div>
            <div className="text-left">
              <div className={`font-sans text-sm font-semibold ${copySuccess ? "text-sage" : "text-slate"}`}>
                {copySuccess ? "Copied!" : "Copy to Clipboard"}
              </div>
              <div className="font-sans text-[11px] text-slateMid">Paste into any app or message</div>
            </div>
          </button>

          {/* Email */}
          <button
            onClick={() => handleExport("email")}
            disabled={!hasContent}
            className={`w-full rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-all ${
              hasContent
                ? "bg-white border-2 border-ocean/60 hover:scale-[1.01]"
                : "bg-sand/30 border-2 border-sand opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="w-9 h-9 bg-ocean/10 rounded-lg flex items-center justify-center text-lg">
              ✉️
            </div>
            <div className="text-left">
              <div className="font-sans text-sm font-semibold text-slate">Send via Email</div>
              <div className="font-sans text-[11px] text-slateMid">Opens your email app with summary</div>
            </div>
          </button>

          {/* Print */}
          <button
            onClick={() => handleExport("print")}
            disabled={!hasContent}
            className={`w-full rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-all ${
              hasContent
                ? "bg-white border-2 border-ocean/60 hover:scale-[1.01]"
                : "bg-sand/30 border-2 border-sand opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="w-9 h-9 bg-ocean/10 rounded-lg flex items-center justify-center text-lg">
              🖨️
            </div>
            <div className="text-left">
              <div className="font-sans text-sm font-semibold text-slate">Print</div>
              <div className="font-sans text-[11px] text-slateMid">Formatted for printing or Save as PDF</div>
            </div>
          </button>

          {/* Download PDF */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={!hasContent || pdfLoading}
            className={`w-full rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-all ${
              hasContent && !pdfLoading
                ? "bg-white border-2 border-ocean/60 hover:scale-[1.01]"
                : "bg-sand/30 border-2 border-sand opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="w-9 h-9 bg-ocean/10 rounded-lg flex items-center justify-center text-lg">
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
              ) : (
                "📄"
              )}
            </div>
            <div className="text-left">
              <div className="font-sans text-sm font-semibold text-slate">
                {pdfLoading ? "Generating PDF..." : "Download PDF"}
              </div>
              <div className="font-sans text-[11px] text-slateMid">Save as a formatted document</div>
            </div>
          </button>
        </div>

        {/* Data note */}
        <div className="bg-sand/50 rounded-[10px] px-4 py-3 mb-4">
          <div className="font-sans text-[11px] text-slateMid leading-relaxed">
            Only information you&apos;ve captured in Harbor is included. No data leaves your device unless you choose to share it.
          </div>
        </div>
      </div>
    </div>
  );
}
