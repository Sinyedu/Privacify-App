"use client";

import { useChatStore } from "@/core/store/chat-store";

export default function EncryptionPanel() {
  const debug = useChatStore((s) => s.debug);

  return (
    <div className="w-80 border-l p-3 text-xs">
      <h2 className="font-bold mb-2">Encryption Console</h2>

      {!debug && (
        <div className="text-gray-500">
          No encryption activity yet...
        </div>
      )}

      {debug && (
        <div className="space-y-2">
          <div>
            <strong>Plaintext:</strong>
            <div className="break-all">{debug.plaintext}</div>
          </div>

          <div>
            <strong>Encrypted:</strong>
            <div className="break-all text-green-600">
              {debug.encrypted}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
