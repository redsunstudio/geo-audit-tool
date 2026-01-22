import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "GEO Audit Tool | Free AI Search Optimization Checker",
  description: "Check if your website is optimized for Google AI Overviews, ChatGPT, and other AI search engines. Get a free GEO audit with actionable recommendations.",
  keywords: ["GEO", "Generative Engine Optimization", "AI SEO", "AI Overviews", "ChatGPT optimization", "website audit"],
  authors: [{ name: "John Isaacson", url: "https://johnisaacson.co.uk" }],
  openGraph: {
    title: "GEO Audit Tool | Free AI Search Optimization Checker",
    description: "Is your website ready for AI search? Get your free GEO audit now.",
    url: "https://geo-audit.johnisaacson.co.uk",
    siteName: "GEO Audit Tool",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEO Audit Tool | Free AI Search Optimization",
    description: "Check if your website is optimized for AI search engines. Free audit with actionable recommendations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
