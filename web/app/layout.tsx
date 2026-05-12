import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import Providers from "@/app/providers";
import "./globals.css";
import { getPublicBaseAppId } from "@/lib/base";
import { config as wagmiConfig } from "@/lib/wagmi/config";
import { cookieToInitialState } from "wagmi";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neon Flux Relay — Base Cyber-Platformer",
  description:
    "Swipe neon cyber-platforming on Base. Daily check-in with Builder Codes attribution.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#040112",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdr = await headers();
  const cookieHeader = hdr.get("cookie") ?? "";
  const initialState = cookieToInitialState(wagmiConfig, cookieHeader);
  const baseAppId = getPublicBaseAppId() ?? "configure-on-base-dot-dev";

  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden antialiased text-gray-50`}
      >
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
