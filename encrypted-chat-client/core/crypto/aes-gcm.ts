import {
  base64UrlToBytes,
  bytesToArrayBuffer,
  bytesToBase64Url,
} from "./base64url";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

export type EncryptedPayload = {
  v: "privacify-aes-gcm-v1";
  alg: "AES-GCM";
  iv: string;
  ciphertext: string;
};

export async function encryptWithAesGcm(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: bytesToArrayBuffer(iv),
    },
    key,
    encodedPlaintext,
  );

  const payload: EncryptedPayload = {
    v: "privacify-aes-gcm-v1",
    alg: ALGORITHM,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(payload);
}

export async function decryptWithAesGcm(
  encrypted: string,
  key: CryptoKey,
): Promise<string> {
  const payload = JSON.parse(encrypted) as EncryptedPayload;

  if (payload.v !== "privacify-aes-gcm-v1" || payload.alg !== ALGORITHM) {
    throw new Error("Unsupported encrypted payload");
  }

  const plaintext = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: bytesToArrayBuffer(base64UrlToBytes(payload.iv)),
    },
    key,
    bytesToArrayBuffer(base64UrlToBytes(payload.ciphertext)),
  );

  return new TextDecoder().decode(plaintext);
}

export function isAesGcmPayload(encrypted: string): boolean {
  try {
    const payload = JSON.parse(encrypted) as Partial<EncryptedPayload>;
    return payload.v === "privacify-aes-gcm-v1" && payload.alg === ALGORITHM;
  } catch {
    return false;
  }
}
