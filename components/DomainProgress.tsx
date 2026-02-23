"use client";

import { DOMAINS as DOMAIN_LIST, DOMAIN_LABELS, DOMAIN_BG_CLASSES, type Domain } from "@/lib/constants/domains";

// Re-export Domain type so existing imports from this file still work
export type { Domain };

export interface DomainProgressProps {
  currentDomain: Domain | null;
  completedDomains: Domain[];
}

const DOMAINS = DOMAIN_LIST.map((id) => ({
  id,
  label: DOMAIN_LABELS[id],
  bgClass: DOMAIN_BG_CLASSES[id].solid,
  bgFadedClass: DOMAIN_BG_CLASSES[id].faded,
}));

export default function DomainProgress({ currentDomain, completedDomains }: DomainProgressProps) {
  const getCurrentIndex = () => {
    if (!currentDomain) return -1;
    return DOMAINS.findIndex((d) => d.id === currentDomain);
  };

  const currentIndex = getCurrentIndex();
  const completedCount = completedDomains.length;

  return (
    <div className="bg-white border-b border-sandDark px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight">
          Care Readiness Assessment
        </div>
        <div className="font-sans text-xs font-medium text-slate">
          {completedCount}/{DOMAINS.length} domains
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-3">
        {DOMAINS.map((domain, index) => {
          const isCompleted = completedDomains.includes(domain.id);
          const isCurrent = domain.id === currentDomain;

          return (
            <div
              key={domain.id}
              className={`flex-1 h-2 rounded-full transition-all ${
                isCompleted
                  ? domain.bgClass
                  : isCurrent
                  ? domain.bgFadedClass
                  : "bg-sand"
              }`}
            />
          );
        })}
      </div>

      {/* Domain labels */}
      <div className="flex justify-between">
        {DOMAINS.map((domain, index) => {
          const isCompleted = completedDomains.includes(domain.id);
          const isCurrent = domain.id === currentDomain;

          return (
            <div
              key={domain.id}
              className={`font-sans text-[10px] transition-colors ${
                isCompleted || isCurrent
                  ? "text-slate font-medium"
                  : "text-slateLight"
              }`}
            >
              {domain.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
