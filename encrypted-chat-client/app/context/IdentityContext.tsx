"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  const [identity, setIdentityState] = useState<Identity | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("identity");

    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentityState(JSON.parse(stored));
    } else {
      const fallback: Identity = {
        userId: "guest_" + crypto.randomUUID(),
        username: "guest",
        type: "guest",
      };

      localStorage.setItem("identity", JSON.stringify(fallback));
      setIdentityState(fallback);
    }
  }, []);

  const setIdentity = (i: Identity) => {
    localStorage.setItem("identity", JSON.stringify(i));
    setIdentityState(i);
  };

  const logout = () => {
    localStorage.removeItem("identity");

    const fallback: Identity = {
      userId: "guest_" + crypto.randomUUID(),
      username: "guest",
      type: "guest",
    };

    localStorage.setItem("identity", JSON.stringify(fallback));
    setIdentityState(fallback);
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
