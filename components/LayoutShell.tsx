"use client";

import { usePathname } from "next/navigation";

/** Pages where bottom nav is hidden — no bottom padding needed */
const NO_NAV_PATHS = ["/", "/login", "/signup"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasNav = !NO_NAV_PATHS.includes(pathname);

  return (
    <div className={hasNav ? "pb-[72px]" : ""}>
      {children}
    </div>
  );
}
