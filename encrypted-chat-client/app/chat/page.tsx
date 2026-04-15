import GroupSidebar from "@/app/components/chat/GroupSidebar";
import MessageList from "@/app/components/chat/MessageList";
import MessageInput from "@/app/components/chat/MessageInput";
import EncryptionPanel from "@/app/components/chat/EncryptionPanel";

export default function ChatPage() {
  return (
    <div className="h-screen flex">
      {/* LEFT: groups */}
      <GroupSidebar />

      {/* CENTER: chat */}
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput />
      </div>

      {/* RIGHT: encryption debug */}
      <EncryptionPanel />
    </div>
  );
}
