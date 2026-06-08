import {
  base64UrlToBytes,
  bytesToArrayBuffer,
  bytesToBase64Url,
} from "./base64url";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const KEY_STORAGE_PREFIX = "privacify:room-key:";
const KEY_IMPORTED_EVENT = "privacify:room-key-imported";

function storageKey(roomId: string): string {
  return `${KEY_STORAGE_PREFIX}${roomId}`;
}

function assertBrowserCrypto() {
  if (typeof window === "undefined" || !globalThis.crypto?.subtle) {
    throw new Error("WebCrypto is only available in the browser");
  }
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  assertBrowserCrypto();

  return crypto.subtle.importKey(
    "raw",
    bytesToArrayBuffer(rawKey),
    { name: ALGORITHM },
    false,
    ["encrypt", "decrypt"],
  );
}

function notifyRoomKeyImported(roomId: string) {
  window.dispatchEvent(new CustomEvent(KEY_IMPORTED_EVENT, { detail: { roomId } }));
}

export async function getStoredRoomKey(roomId: string): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(storageKey(roomId));

  if (!stored) return null;

  return importAesKey(base64UrlToBytes(stored));
}

export async function hasRoomKey(roomId: string): Promise<boolean> {
  return Boolean(localStorage.getItem(storageKey(roomId)));
}

export async function getOrCreateRoomKey(roomId: string): Promise<CryptoKey> {
  assertBrowserCrypto();

  const existing = await getStoredRoomKey(roomId);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  localStorage.setItem(storageKey(roomId), bytesToBase64Url(rawKey));
  notifyRoomKeyImported(roomId);

  return key;
}

export async function exportRoomKey(roomId: string): Promise<string | null> {
  const stored = localStorage.getItem(storageKey(roomId));
  return stored || null;
}

export async function importRoomKey(
  roomId: string,
  exportedKey: string,
  overwrite = false,
): Promise<void> {
  assertBrowserCrypto();

  if (!overwrite && localStorage.getItem(storageKey(roomId))) return;

  const rawKey = base64UrlToBytes(exportedKey);

  if (rawKey.byteLength !== KEY_LENGTH / 8) {
    throw new Error("Invalid room encryption key");
  }

  await importAesKey(rawKey);
  localStorage.setItem(storageKey(roomId), exportedKey);
  notifyRoomKeyImported(roomId);
}

export function onRoomKeyImported(
  callback: (roomId: string) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ roomId?: string }>).detail;
    if (detail?.roomId) callback(detail.roomId);
  };

  window.addEventListener(KEY_IMPORTED_EVENT, handler);
  return () => window.removeEventListener(KEY_IMPORTED_EVENT, handler);
}

export async function getRoomKeyFingerprint(roomId: string): Promise<string | null> {
  assertBrowserCrypto();

  const exportedKey = await exportRoomKey(roomId);
  if (!exportedKey) return null;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytesToArrayBuffer(base64UrlToBytes(exportedKey)),
  );
  return bytesToBase64Url(new Uint8Array(digest)).slice(0, 16);
}
