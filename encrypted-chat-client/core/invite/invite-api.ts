import type { Identity } from "@/app/context/IdentityContext";

type InviteIntent = "group" | "direct-call";

export type AcceptInviteResponse =
  | {
      valid: true;
      roomId: string;
      intent: InviteIntent;
    }
  | {
      valid: false;
    };

export async function acceptInvite(
  apiUrl: string,
  token: string,
  identity: Identity,
): Promise<AcceptInviteResponse> {
  const res = await fetch(`${apiUrl}/invite/${token}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity }),
  });

  if (!res.ok) {
    throw new Error("Failed to join room");
  }

  return (await res.json()) as AcceptInviteResponse;
}
