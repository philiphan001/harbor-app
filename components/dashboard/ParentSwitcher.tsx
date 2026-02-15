"use client";

import type { ParentProfile } from "@/lib/utils/parentProfile";

interface ParentSwitcherProps {
  allProfiles: ParentProfile[];
  activeProfile: ParentProfile | null;
  isOpen: boolean;
  onToggle: () => void;
  onSwitch: (parentId: string) => void;
  onDelete: (parentId: string) => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (parentId: string | null) => void;
}

export default function ParentSwitcher({
  allProfiles,
  activeProfile,
  isOpen,
  onToggle,
  onSwitch,
  onDelete,
  confirmDeleteId,
  onConfirmDelete,
}: ParentSwitcherProps) {
  if (allProfiles.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
      >
        <div className="font-sans text-xs font-medium text-white">
          {allProfiles.length} Parents
        </div>
        <svg
          className={`w-4 h-4 text-white transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={onToggle} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-sandDark z-20">
            <div className="py-1">
              {allProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-sand/50 transition-colors ${
                    profile.id === activeProfile?.id ? "bg-sand/30" : ""
                  }`}
                >
                  <button
                    onClick={() => onSwitch(profile.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-sans text-sm font-semibold text-slate">
                      {profile.name}
                    </div>
                    {profile.age && profile.state && (
                      <div className="font-sans text-xs text-slateMid mt-0.5">
                        Age {profile.age} · {profile.state}
                      </div>
                    )}
                    {profile.id === activeProfile?.id && (
                      <div className="font-sans text-xs text-ocean font-medium mt-1">
                        Currently Active
                      </div>
                    )}
                  </button>

                  {/* Delete button */}
                  {confirmDeleteId === profile.id ? (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => onDelete(profile.id)}
                        className="font-sans text-[10px] font-semibold text-white bg-coral rounded px-2 py-1 hover:bg-coral/80"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => onConfirmDelete(null)}
                        className="font-sans text-[10px] font-medium text-slateMid hover:text-slate px-1 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onConfirmDelete(profile.id)}
                      className="ml-2 shrink-0 text-slateLight hover:text-coral transition-colors p-1"
                      title="Delete parent"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
