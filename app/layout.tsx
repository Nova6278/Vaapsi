import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "./components/NavbarWrapper";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://vaapsi.live";

export const metadata: Metadata = {
  title: {
    default: "Vaapsi — Lost & Found for KIIT University",
    template: "%s | Vaapsi",
  },
  description:
    "Lost something on campus? Found someone's belongings? Vaapsi helps KIIT students recover lost items through verified claims, photo proof, and auto-matching.",
  keywords: [
    "lost and found",
    "KIIT",
    "KIIT University",
    "campus lost and found",
    "lost items",
    "found items",
    "student platform",
    "Vaapsi",
  ],
  authors: [{ name: "Nova" }],
  creator: "Nova",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Vaapsi",
    title: "Vaapsi — Lost & Found for KIIT University",
    description:
      "Lost something on campus? Found someone's belongings? Vaapsi helps KIIT students recover lost items through verified claims, photo proof, and auto-matching.",
    images: [
      {
        url: "/vaapsi-logo-512.png",
        width: 512,
        height: 512,
        alt: "Vaapsi Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Vaapsi — Lost & Found for KIIT University",
    description:
      "Lost something on campus? Found someone's belongings? Vaapsi helps KIIT students recover lost items through verified claims, photo proof, and auto-matching.",
    images: ["/vaapsi-logo-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/vaapsi-logo-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "#080c18" }}
      >
        <NavbarWrapper />
        {children}
        <Analytics />
      </body>
    </html>
  );
}