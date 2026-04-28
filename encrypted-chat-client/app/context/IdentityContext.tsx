"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  const [identity, setIdentityState] = useState<Identity | null>(() => {
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

  useEffect(() => {
    if (user) {
      const authIdentity: Identity = {
        userId: user.email,
        username: user.email,
        type: "auth",
      };

      localStorage.setItem("identity", JSON.stringify(authIdentity));
      setIdentityState(authIdentity);
      return;
    }

    if (!identity) {
      setIdentityState(null);
    }
  }, [identity, user]);

  const setIdentity = (i: Identity) => {
    localStorage.setItem("identity", JSON.stringify(i));
    setIdentityState(i);
  };

  const logout = () => {
    localStorage.removeItem("identity");
    setIdentityState(null);
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
