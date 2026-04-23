"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const goGuest = () => {
    router.push("/chat");
  };

  const goLogin = () => {
    router.push("/auth/login");
  };

  const goRegister = () => {
    router.push("/auth/register");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 rounded-xl border bg-white dark:bg-zinc-900 space-y-4">

        <h1 className="text-2xl font-bold text-center">
          Privacify
        </h1>

        <p className="text-center text-sm text-zinc-500">
          Encrypted chat platform demo
        </p>

        <div className="space-y-3 pt-4">

          <button
            onClick={goLogin}
            className="w-full p-3 rounded bg-black text-white dark:bg-white dark:text-black"
          >
            Login
          </button>

          <button
            onClick={goRegister}
            className="w-full p-3 rounded border"
          >
            Register
          </button>

          <button
            onClick={goGuest}
            className="w-full p-3 rounded bg-zinc-200 dark:bg-zinc-800"
          >
            Continue as Guest
          </button>

        </div>
      </div>
    </div>
  );
}
