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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container antialiased">
        {children}
      </body>
    </html>
  );
}
