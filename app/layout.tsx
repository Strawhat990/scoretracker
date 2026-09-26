import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "MBA Grade Tracker — CIA, End Sem & Analytics",
  description:
    "Track your MBA marks across CIAs, class participation, and end semester exams. Live grade calculation, subject-wise analytics, and cross-device sync.",
  openGraph: {
    title: "MBA Grade Tracker — CIA, End Sem & Analytics",
    description:
      "Track your MBA marks across CIAs, class participation, and end semester exams. Live grade calculation, subject-wise analytics, and cross-device sync.",
    siteName: "MBA Grade Tracker",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
