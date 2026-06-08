"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { importRoomKey } from "@/core/crypto/encryption";
import { useIdentity } from "@/app/context/IdentityContext";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { identity } = useIdentity();
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    async function run() {
      if (!identity) {
        const returnTo = `${pathname}${window.location.hash}`;
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/invite/${token}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity }),
        });

        const data = await res.json();

        if (!data.valid) {
          alert("Invalid or expired invite");
          router.push("/chat");
          return;
        }

        const roomKey = new URLSearchParams(window.location.hash.slice(1)).get("key");

        if (roomKey) {
          await importRoomKey(data.roomId, roomKey, true);
        } else {
          alert("This invite is missing its encryption key. Ask for a new invite link.");
          router.push("/chat");
          return;
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
  }, [API_URL, identity, pathname, router, token]);

  return (
    <div className="h-screen flex items-center justify-center">
      {loading ? "Checking invite..." : "Redirecting..."}
    </div>
  );
}
