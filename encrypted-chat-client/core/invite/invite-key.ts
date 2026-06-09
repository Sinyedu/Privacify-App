const INVITE_KEY_PREFIX = "privacify:invite-key:";

function inviteStorageKey(token: string): string {
  return `${INVITE_KEY_PREFIX}${token}`;
}

export function buildInviteUrl(link: string, roomKey: string | null): string {
  const inviteUrl = new URL(link, window.location.origin);

  if (roomKey) {
    inviteUrl.hash = `key=${encodeURIComponent(roomKey)}`;
  }

  return inviteUrl.toString();
}

export function readInviteKeyFromHash(): string | null {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.hash.slice(1)).get("key");
}

export function stashInviteKey(token: string, roomKey: string): void {
  sessionStorage.setItem(inviteStorageKey(token), roomKey);
}

export function readStashedInviteKey(token: string): string | null {
  return sessionStorage.getItem(inviteStorageKey(token));
}

export function clearStashedInviteKey(token: string): void {
  sessionStorage.removeItem(inviteStorageKey(token));
}

export function readInviteKey(token: string): string | null {
  const roomKey = readInviteKeyFromHash();

  if (roomKey) {
    stashInviteKey(token, roomKey);
    return roomKey;
  }

  return readStashedInviteKey(token);
}
