"use client";

import { useState } from "react";
import { useChatStore } from "@/core/store/chat-store";
import { encrypt } from "@/core/crypto/encryption";
import { socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";

export default function MessageInput({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const setDebug = useChatStore((s) => s.setDebug);

  const { identity } = useIdentity();

  const isGuest = identity?.type === "guest";

  const handleSend = () => {
    if (!text.trim()) return;

    const encrypted = encrypt(text);
    const sender = identity?.username;

    setDebug({
      plaintext: text,
      encrypted,
    });

    socket.emit("send_message", {
      roomId,
      text: encrypted,
      sender,
      isGuest,
    });

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
          if (e.key === "Enter") handleSend();
        }}
      />

      <button onClick={handleSend} className="px-4 rounded bg-black text-white">
        Send
      </button>
    </div>
  );
}
