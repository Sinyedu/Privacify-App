import { io } from "socket.io-client";

type SocketIdentity = {
  userId: string;
  username: string;
  type: "auth";
};

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  );

  return isLocalhost ? "http://localhost:3001" : window.location.origin;
}

export const socket = io(getSocketUrl(), {
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
      socket.off("auth_required", handleAuthRequired);
      socket.off("disconnect", handleDisconnect);
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

    const handleAuthRequired = () => {
      cleanup();
      reject(new Error("Socket authentication required"));
    };

    const handleDisconnect = (reason: string) => {
      cleanup();
      reject(new Error(`Socket disconnected before connect: ${reason}`));
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleError);
    socket.once("auth_required", handleAuthRequired);
    socket.once("disconnect", handleDisconnect);
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
