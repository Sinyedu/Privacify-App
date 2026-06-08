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

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [identity]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
