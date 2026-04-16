"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Settings = {
  theme: "light" | "dark";
  retentionDays: number;
};

type SettingsContextType = {
  settings: Settings;
  toggleTheme: () => void;
  setRetention: (days: number) => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") {
      return { theme: "light", retentionDays: 7 };
    }

    const stored = localStorage.getItem("settings");

    return stored ? JSON.parse(stored) : { theme: "light", retentionDays: 7 };
  });

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));

    document.documentElement.classList.toggle(
      "dark",
      settings.theme === "dark",
    );
  }, [settings]);

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  };

  const setRetention = (days: number) => {
    setSettings((prev) => ({
      ...prev,
      retentionDays: days,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, toggleTheme, setRetention }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};
