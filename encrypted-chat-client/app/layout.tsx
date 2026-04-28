import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/app/context/AuthContext";
import { SettingsProvider } from "@/app/context/SettingsContext";
import { IdentityProvider } from "@/app/context/IdentityContext";
import { SocketProvider } from "@/app/providers/SocketProvider";

import Navbar from "@/app/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Privacify",
  description: "Encrypted chat platform demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SettingsProvider>
            <IdentityProvider>
              <SocketProvider>
                <Navbar />
                <main className="flex-1">{children}</main>
              </SocketProvider>
            </IdentityProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
