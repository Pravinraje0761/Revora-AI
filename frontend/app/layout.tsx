import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revora AI — Autonomous Revenue Recovery",
  description: "AI-powered churn prediction and retention automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
