import type { Metadata, Viewport } from "next";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";
import OfflineBanner from "@/components/ui/OfflineBanner";
import { SerwistProvider } from "@serwist/next/react";

export const metadata: Metadata = {
  title: "Timebase",
  description: "A task management application",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-32.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <SerwistProvider
          swUrl="/sw.js"
          disable={process.env.NODE_ENV === "development"}
        >
          <OfflineBanner />
          {children}
          <Toaster />
        </SerwistProvider>
      </body>
    </html>
  );
}
