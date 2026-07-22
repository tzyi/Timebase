import type { Metadata, Viewport } from "next";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";
import OfflineBanner from "@/components/ui/OfflineBanner";
import { SerwistProvider } from "@serwist/next/react";
import ThemeProvider from "@/components/providers/ThemeProvider";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('timebase-theme');
    var isDark = stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

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
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <SerwistProvider
            swUrl="/sw.js"
            disable={process.env.NODE_ENV === "development"}
          >
            <OfflineBanner />
            {children}
            <Toaster />
          </SerwistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
