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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://platformer-inky.vercel.app";

/** Matches Base dashboard domain verification (`meta name="base:app_id"`). */
const DEFAULT_BASE_APP_ID = "6a02cecaf8601f8d21fe6b38";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Neon Flux Relay — Base Cyber-Platformer",
  description:
    "Dash neon shards on Base in a pocket cyber-platformer: swipe controls, wallet connect, English UI, one daily on-chain relay ping with Builder attribution—gas on Base only.",
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
  const baseAppId = getPublicBaseAppId() ?? DEFAULT_BASE_APP_ID;

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
