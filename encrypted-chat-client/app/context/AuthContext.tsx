"use client";

import { createContext, useContext, useState } from "react";

type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("token");
    if (!stored) return null;

    try {
      const payload = JSON.parse(atob(stored.split(".")[1]));
      return { email: payload.email };
    } catch {
      return null;
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));
      setUser({ email: payload.email });
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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
