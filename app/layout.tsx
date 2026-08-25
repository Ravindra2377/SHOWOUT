import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: { default: "SHOWOUT — Don’t scroll. Show out.", template: "%s — SHOWOUT" },
  description: "Timed creative challenges where talent is judged before identity is revealed.",
  applicationName: "SHOWOUT",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SHOWOUT" },
};
export const viewport: Viewport = { themeColor: "#f4f0e7", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><AppShell>{children}</AppShell></body></html>;
}
