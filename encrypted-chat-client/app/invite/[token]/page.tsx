"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { importRoomKey } from "@/core/crypto/encryption";
import { useIdentity } from "@/app/context/IdentityContext";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const { identity, setIdentity } = useIdentity();
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    async function run() {
      let activeIdentity = identity;

      if (!activeIdentity) {
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

        activeIdentity = {
          userId: crypto.randomUUID(),
          username,
          type: "guest",
        };

        setIdentity(activeIdentity);
      }

      try {
        const res = await fetch(`${API_URL}/invite/${token}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity: activeIdentity }),
        });

        const data = await res.json();

        if (!data.valid) {
          alert("Invalid or expired invite");
          router.push("/chat");
          return;
        }

        const roomKey = new URLSearchParams(window.location.hash.slice(1)).get("key");

        if (roomKey) {
          await importRoomKey(data.roomId, roomKey);
        }

        const mode = data.intent === "direct-call" ? "&mode=call" : "";
        router.push(`/chat?room=${data.roomId}${mode}`);
      } catch (err) {
        console.error(err);
        alert("Failed to join room");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [API_URL, identity, router, setIdentity, token]);

  return (
    <div className="h-screen flex items-center justify-center">
      {loading ? "Checking invite..." : "Redirecting..."}
    </div>
  );
}
