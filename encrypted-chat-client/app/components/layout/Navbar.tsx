"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();

  const [guestUsername, setGuestUsername] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestUsername(readGuestUsername());
  }, []);

  const displayName = user?.username || guestUsername;
  const isGuest = !user && guestUsername;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* LEFT */}
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg">
          Privacify
        </Link>

        {user && (
          <>
            <Link href="/chat" className="hover:underline">
              Chats
            </Link>

            <Link href="/groups" className="hover:underline">
              Groups
            </Link>
          </>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {!displayName ? (
          <>
            <Link href="/login" className="text-sm">
              Login
            </Link>
            <Link href="/register" className="text-sm">
              Register
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm">
              {displayName} {isGuest && "(guest)"}
            </span>

            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function readGuestUsername(): string | null {
  const stored = localStorage.getItem("identity");
  if (!stored) return null;

  try {
    const identity = JSON.parse(stored) as {
      username?: string;
      type?: string;
    };

    return identity.type === "guest" ? identity.username || null : null;
  } catch {
    return null;
  }
}
