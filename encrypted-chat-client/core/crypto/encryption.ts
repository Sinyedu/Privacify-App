import {
  decryptWithAesGcm,
  encryptWithAesGcm,
  isAesGcmPayload,
} from "./aes-gcm";
import {
  exportRoomKey,
  getOrCreateRoomKey,
  getRoomKeyFingerprint,
  getStoredRoomKey,
  hasRoomKey,
  importRoomKey,
  onRoomKeyImported,
} from "./room-key-store";

export {
  exportRoomKey,
  getOrCreateRoomKey,
  getRoomKeyFingerprint,
  hasRoomKey,
  importRoomKey,
  onRoomKeyImported,
};

export async function encrypt(text: string, roomId: string): Promise<string> {
  const key = await getOrCreateRoomKey(roomId);
  return encryptWithAesGcm(text, key);
}

export async function decrypt(encrypted: string, roomId: string): Promise<string> {
  if (!isAesGcmPayload(encrypted)) {
    return atob(encrypted);
  }

  const key = await getStoredRoomKey(roomId);
  if (!key) {
    throw new Error("Missing room encryption key");
  }

  return decryptWithAesGcm(encrypted, key);
}
