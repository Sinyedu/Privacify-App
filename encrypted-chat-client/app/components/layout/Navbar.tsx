"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const displayName = user?.username;
  const linkClass = (href: string) =>
    [
      "rounded px-2 py-1 text-sm",
      pathname === href
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
        : "hover:bg-zinc-200 dark:hover:bg-zinc-800",
    ].join(" ");

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
            <Link href="/chat" className={linkClass("/chat")}>
              Chats
            </Link>

            <Link href="/groups" className={linkClass("/groups")}>
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
              {displayName}
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
