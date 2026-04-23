"use client";

import { useState } from "react";
import { useChatStore } from "@/core/store/chat-store";
import { encrypt, decrypt } from "@/core/crypto/encryption";
import { socket } from "@/core/socket/socket"

export default function MessageInput() {
  const [text, setText] = useState("");
  const addMessage = useChatStore((s) => s.addMessage);
  const setDebug = useChatStore((s) => s.setDebug);

  const handleSend = () => {
    if (!text.trim()) return;

    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);

    // update debug panel
    setDebug({
      plaintext: text,
      encrypted,
    });

    socket.emit("send_message", {
      text: encrypted,
      sender: "You",
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

      <button
        onClick={handleSend}
        className="px-4 rounded bg-black text-white"
      >
        Send
      </button>
    </div>
  );
}
