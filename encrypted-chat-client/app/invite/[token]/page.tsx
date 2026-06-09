"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { importRoomKey } from "@/core/crypto/encryption";
import { acceptInvite } from "@/core/invite/invite-api";
import { clearStashedInviteKey, readInviteKey } from "@/core/invite/invite-key";
import { useIdentity } from "@/app/context/IdentityContext";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { identity } = useIdentity();
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  useEffect(() => {
    async function run() {
      if (!token) {
        router.push("/chat");
        return;
      }

      const roomKey = readInviteKey(token);

      if (!identity) {
        const returnTo = `${pathname}${window.location.hash}`;
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      try {
        const data = await acceptInvite(API_URL, token, identity);

        if (!data.valid) {
          alert("Invalid invite");
          router.push("/chat");
          return;
        }

        if (roomKey) {
          await importRoomKey(data.roomId, roomKey, true);
          clearStashedInviteKey(token);
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
