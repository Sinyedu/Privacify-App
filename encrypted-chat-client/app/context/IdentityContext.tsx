"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

type Identity = {
  userId: string;
  username: string;
  type: "auth" | "guest";
};

type IdentityContextType = {
  identity: Identity | null;
  setIdentity: (i: Identity) => void;
  logout: () => void;
};

const IdentityContext = createContext<IdentityContextType | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [manualIdentity, setManualIdentity] = useState<Identity | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("identity");

    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("identity");
      return null;
    }
  });

  const identity = useMemo<Identity | null>(() => {
    if (user) {
      return {
        userId: user.id,
        username: user.username,
        type: "auth",
      };
    }

    return manualIdentity;
  }, [user, manualIdentity]);

  const setIdentity = (i: Identity) => {
    localStorage.setItem("identity", JSON.stringify(i));
    setManualIdentity(i);
  };

  const logout = () => {
    localStorage.removeItem("identity");
    setManualIdentity(null);
  };

  return (
    <IdentityContext.Provider value={{ identity, setIdentity, logout }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside IdentityProvider");
  return ctx;
}
