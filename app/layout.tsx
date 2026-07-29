import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trimester 1 — Grade Tracker",
  description: "MBA Trimester-1 grade tracking dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
