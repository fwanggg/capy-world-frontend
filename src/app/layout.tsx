import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
