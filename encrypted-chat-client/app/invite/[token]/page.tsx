"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  useEffect(() => {
    async function run() {
      // 🔐 NEW UNIFIED IDENTITY SYSTEM
      const stored = localStorage.getItem("identity");

      if (!stored) {
        const choice = confirm(
          "You are not logged in.\n\nOK = Continue as guest\nCancel = Login",
        );

        if (!choice) {
          router.push("/login");
          return;
        }

        const username = prompt("Enter guest username");

        if (!username || username.trim().length < 2) {
          alert("Invalid username");
          router.push("/");
          return;
        }

        localStorage.setItem(
          "identity",
          JSON.stringify({
            userId: crypto.randomUUID(),
            username,
            type: "guest",
          }),
        );
      }

      try {
        const res = await fetch(`${API_URL}/invite/${token}`);

        const data = await res.json();

        if (!data.valid) {
          alert("Invalid or expired invite");
          router.push("/chat");
          return;
        }

        router.push(`/chat?room=${data.roomId}`);
      } catch (err) {
        console.error(err);
        alert("Failed to join room");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [router, token]);

  return (
    <div className="h-screen flex items-center justify-center">
      {loading ? "Checking invite..." : "Redirecting..."}
    </div>
  );
}
