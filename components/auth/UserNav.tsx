"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase.auth]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  const displayName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-sans text-xs font-semibold hover:bg-white/30 transition"
        title={user.email ?? "Account"}
      >
        {initials}
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-11 z-50 bg-white rounded-xl shadow-lg border border-sandDark py-2 min-w-[200px]">
            <div className="px-4 py-2 border-b border-sand">
              <div className="font-sans text-sm font-medium text-slate truncate">
                {displayName}
              </div>
              <div className="font-sans text-xs text-slateMid truncate">
                {user.email}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full text-left px-4 py-2.5 font-sans text-sm text-coral hover:bg-sand/50 transition disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
