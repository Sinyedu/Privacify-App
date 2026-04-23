"use client";

import { useChatStore } from "@/core/store/chat-store";

export default function MessageList() {
  const messages = useChatStore((state) => state.messages);

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-2">
      {messages.length === 0 && (
        <div className="text-gray-500 text-sm">
          No messages yet...
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="p-2 rounded bg-blue-100 text-black w-fit">
          <span className="font-semibold mr-2">
            {msg.sender}:
          </span>
          {msg.text}
        </div>
      ))}
    </div>
  );
}
