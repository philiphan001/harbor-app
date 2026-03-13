"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveCascades } from "@/lib/utils/cascadeStorage";
import { computePrioritizedNudges } from "@/lib/utils/nudgeStorage";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ active: boolean }>;
  badge?: boolean;
}

// Pages where the bottom nav should NOT appear
const HIDDEN_PATHS = ["/", "/login", "/signup"];

export default function BottomNav() {
  const pathname = usePathname();
  const [hasReminders, setHasReminders] = useState(false);

  useEffect(() => {
    const cascadeCount = getActiveCascades().length;
    const nudgeResult = computePrioritizedNudges();
    const nudgeCount = nudgeResult.display.length + nudgeResult.queued.length;
    setHasReminders(cascadeCount + nudgeCount > 0);
  }, [pathname]);

  // Hide on landing, login, signup
  if (HIDDEN_PATHS.includes(pathname)) return null;

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: HomeIcon },
    { href: "/tasks", label: "Tasks", icon: TasksIcon },
    { href: "/help", label: "Help", icon: ChatIcon },
    { href: "/reminders", label: "Reminders", icon: RemindersIcon, badge: hasReminders },
    { href: "/profile", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sandDark"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[420px] mx-auto flex items-center justify-around px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.href === "/help"
              ? pathname.startsWith("/help")
              : item.href === "/reminders"
                ? pathname.startsWith("/reminders")
                : pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                isActive
                  ? "text-ocean"
                  : "text-slateLight hover:text-slateMid"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <item.icon active={isActive} />
                {item.badge && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-coral rounded-full" />
                )}
              </div>
              <span className="font-sans text-[10px] font-semibold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// --- SVG Icons (24x24, stroke-based for clean mobile look) ---

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" stroke={active ? "white" : "currentColor"} />
    </svg>
  );
}

function TasksIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function RemindersIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
