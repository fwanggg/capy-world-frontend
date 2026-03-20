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
    <html lang="en" className="bg-[#0a0c10]">
      <body className="min-h-screen bg-[#0a0c10] text-[#e1e2eb] antialiased">
        {children}
      </body>
    </html>
  );
}
