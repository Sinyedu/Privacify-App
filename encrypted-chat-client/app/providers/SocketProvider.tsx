"use client";

import { createContext, useContext, useEffect } from "react";
import { socket } from "@/core/socket/socket";
import { useIdentity } from "@/app/context/IdentityContext";

const SocketContext = createContext(socket);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useIdentity();

  useEffect(() => {
    if (!identity) return;

    console.log("[socket] connecting with identity:", identity);

    socket.auth = identity;

    if (!socket.connected) {
      socket.connect();
    }

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
