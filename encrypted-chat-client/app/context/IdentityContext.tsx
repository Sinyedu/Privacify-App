"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

export type Identity = {
  userId: string;
  username: string;
  type: "auth";
};

type IdentityContextType = {
  identity: Identity | null;
  logout: () => void;
};

const IdentityContext = createContext<IdentityContextType | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const identity = useMemo<Identity | null>(() => {
    if (user) {
      return {
        userId: user.id,
        username: user.username,
        type: "auth",
      };
    }

    return null;
  }, [user]);

  const logout = () => {
    localStorage.removeItem("identity");
  };

  return (
    <IdentityContext.Provider value={{ identity, logout }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside IdentityProvider");
  return ctx;
}
