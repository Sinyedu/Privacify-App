"use client";

import { useState } from "react";
import { useChatStore } from "@/core/store/chat-store";
import { encrypt } from "@/core/crypto/encryption";
import { socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";
import type { EncryptedPeerMessage } from "@/core/webrtc/types";

type MessageInputProps = {
  roomId: string;
  onEncryptedMessage: (message: EncryptedPeerMessage) => void;
};

export default function MessageInput({
  roomId,
  onEncryptedMessage,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const setDebug = useChatStore((s) => s.setDebug);

  const { identity } = useIdentity();

  const isGuest = identity?.type === "guest";

  const handleSend = async () => {
    if (!text.trim()) return;

    const id = crypto.randomUUID();
    const encrypted = await encrypt(text, roomId);
    const sender = identity?.username;

    if (!sender) return;

    setDebug({
      plaintext: text,
      encrypted,
    });

    const message = {
      id,
      roomId,
      encrypted,
      sender,
    };

    socket.emit("send_message", {
      id,
      roomId,
      text: encrypted,
      sender,
      isGuest,
    });

    onEncryptedMessage(message);
    setText("");
  };

  return (
    <div className="border-t p-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded p-2"
        placeholder="Type a message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleSend();
        }}
      />

      <button onClick={() => void handleSend()} className="px-4 rounded bg-black text-white">
        Send
      </button>
    </div>
  );
}
