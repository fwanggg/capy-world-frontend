import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Capysan",
  description: "AI-powered user research for founders and marketers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: '#0f172a' }}>
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
