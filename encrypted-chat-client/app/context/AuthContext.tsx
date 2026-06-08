"use client";

import { createContext, useContext, useState } from "react";

type User = {
  id: string;
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): User | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as {
      sub?: string;
      email?: string;
      username?: string;
    };

    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username || payload.email,
    };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("token");
    if (!stored) return null;

    return decodeUser(stored);
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    setUser(decodeUser(newToken));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("identity");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
