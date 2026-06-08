import { io } from "socket.io-client";

type SocketIdentity = {
  userId: string;
  username: string;
  type: "auth";
};

export const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
  transports: ["websocket"],
  autoConnect: false,
});

let connectedIdentityKey: string | null = null;

function identityKey(identity: SocketIdentity): string {
  return `${identity.type}:${identity.userId}:${identity.username}`;
}

export function isSocketReadyForIdentity(identity: SocketIdentity): boolean {
  return socket.connected && connectedIdentityKey === identityKey(identity);
}

export async function connectSocket(identity: SocketIdentity): Promise<void> {
  const nextIdentityKey = identityKey(identity);

  if (isSocketReadyForIdentity(identity)) return;

  socket.auth = identity;

  if (socket.connected) {
    socket.disconnect();
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Socket connection timed out"));
    }, 5000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    const handleConnect = () => {
      connectedIdentityKey = nextIdentityKey;
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleError);
    socket.connect();
  });
}

socket.on("connect", () => {
  console.log("[socket] connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] disconnected:", reason);
  connectedIdentityKey = null;
});

socket.on("connect_error", (err) => {
  console.log("[socket] connect_error:", err.message);
});
