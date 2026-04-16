"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings, toggleTheme } = useSettings();

  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
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

      <div className="flex items-center gap-4">
        {!user ? (
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
            <span className="text-sm">{user.email}</span>

            <button
              onClick={() => setOpen(!open)}
              className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded"
            >
              ⚙️
            </button>
          </>
        )}
      </div>

      {open && user && (
        <div className="absolute top-16 right-6 w-56 bg-white dark:bg-zinc-800 shadow-lg rounded p-4 space-y-4">
          <Link href="/settings" className="block text-sm hover:underline">
            Settings
          </Link>

          <button onClick={toggleTheme} className="w-full text-left text-sm">
            Theme: {settings.theme}
          </button>

          <button
            onClick={logout}
            className="w-full text-left text-red-500 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
