"use client";

import { useChatStore } from "@/core/store/chat-store";

type MessageListProps = {
  currentUsername?: string;
};

export default function MessageList({ currentUsername }: MessageListProps) {
  const messages = useChatStore((state) => state.messages);

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-3">
      {messages.length === 0 && (
        <div className="text-gray-500 text-sm">No messages yet...</div>
      )}

      {messages.map((msg, index) => {
        const isOwnMessage = msg.sender === currentUsername;

        return (
          <div
            key={`${msg.id}-${index}`}
            className={[
              "flex",
              isOwnMessage ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <div
              className={[
                "max-w-[72%] rounded px-3 py-2 text-sm shadow-sm",
                isOwnMessage
                  ? "bg-neutral-950 text-white rounded-br-sm"
                  : "bg-neutral-100 text-neutral-950 rounded-bl-sm",
              ].join(" ")}
            >
              {!isOwnMessage && (
                <div className="mb-1 text-[11px] font-semibold text-neutral-500">
                  {msg.sender}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
