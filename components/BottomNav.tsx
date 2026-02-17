"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ active: boolean }>;
}

const STATIC_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: TasksIcon,
  },
  // Chat is dynamic — inserted at runtime
  {
    href: "/upload",
    label: "Upload",
    icon: UploadIcon,
  },
  {
    href: "/briefing",
    label: "Briefing",
    icon: BriefingIcon,
  },
];

// Pages where the bottom nav should NOT appear
const HIDDEN_PATHS = ["/", "/login", "/signup"];

export default function BottomNav() {
  const pathname = usePathname();
  const [chatHref, setChatHref] = useState("/crisis");

  // Determine the right chat destination based on most recent conversation
  useEffect(() => {
    // If user is currently on a chat page, keep that as the target
    if (pathname.startsWith("/crisis") || pathname.startsWith("/readiness")) {
      return;
    }

    async function resolveChat() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = await res.json();
        const conversations = data.conversations || [];

        // Find the most recent conversation with messages
        const recent = conversations.find(
          (c: { conversationType: string; messages: unknown[] }) =>
            c.messages && c.messages.length > 0
        );

        if (recent) {
          const base = recent.conversationType === "readiness" ? "/readiness" : "/crisis";
          setChatHref(`${base}?conversationId=${recent.id}`);
        }
      } catch {
        // Default to /crisis
      }
    }

    resolveChat();
  }, [pathname]);

  // Hide on landing, login, signup
  if (HIDDEN_PATHS.includes(pathname)) return null;

  // Build nav items with dynamic chat href
  const navItems: NavItem[] = [
    STATIC_NAV_ITEMS[0], // Home
    STATIC_NAV_ITEMS[1], // Tasks
    { href: chatHref, label: "Chat", icon: ChatIcon },
    STATIC_NAV_ITEMS[2], // Upload
    STATIC_NAV_ITEMS[3], // Briefing
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sandDark"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[420px] mx-auto flex items-center justify-around px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          // For chat, highlight if on any chat-related page
          const isChatItem = item.label === "Chat";
          const isActive = isChatItem
            ? pathname.startsWith("/crisis") || pathname.startsWith("/readiness")
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
              <item.icon active={isActive} />
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

function UploadIcon({ active }: { active: boolean }) {
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
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function BriefingIcon({ active }: { active: boolean }) {
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
      <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <line x1="7" y1="9" x2="17" y2="9" stroke={active ? "white" : "currentColor"} />
      <line x1="7" y1="13" x2="13" y2="13" stroke={active ? "white" : "currentColor"} />
    </svg>
  );
}
