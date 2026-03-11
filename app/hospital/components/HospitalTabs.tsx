"use client";

type TabId = "overview" | "ask" | "notes" | "discharge";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "ask", label: "Ask Harbor" },
  { id: "notes", label: "Notes" },
  { id: "discharge", label: "Discharge" },
];

interface HospitalTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  noteCount?: number;
}

export type { TabId };

export default function HospitalTabs({ activeTab, onTabChange, noteCount }: HospitalTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`font-sans text-[12px] font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? "bg-coral text-white"
              : "bg-white border border-sandDark text-slateMid hover:bg-sand/50"
          }`}
        >
          {tab.label}
          {tab.id === "notes" && noteCount !== undefined && noteCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px]">
              {noteCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
