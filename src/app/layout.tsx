import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevFocus Dashboard - Developer Productivity Tracker",
  description:
    "A production-ready full-stack developer platform with task management, PR reviews, commit streaks, deployments, and AI-powered insights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevFocus",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "DevFocus Dashboard",
    title: "DevFocus Dashboard - Developer Productivity Tracker",
    description:
      "Track your productivity with task management, PR reviews, commit streaks, and AI insights.",
  },
  twitter: {
    card: "summary",
    title: "DevFocus Dashboard",
    description: "Developer productivity tracking made simple.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
