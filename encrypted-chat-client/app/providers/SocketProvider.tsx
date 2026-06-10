"use client";

import { createContext, useContext, useEffect } from "react";
import { connectSocket, socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";

const SocketContext = createContext(socket);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useIdentity();

  useEffect(() => {
    if (!identity) return;

    console.log("[socket] connecting with identity:", identity);

    void connectSocket(identity).catch((error) => {
      console.error("[socket] failed to connect:", error);
    });

    const handleConnect = () => {
      console.log("[socket] connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("[socket] disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [identity]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
