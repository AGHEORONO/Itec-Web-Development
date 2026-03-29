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
  title: "iTECify | Code Together, Smarter",
  description: "Platforma web supremă destinată colaborării P2P în timp real la cod, cu asistență AI integrată și engine dedicat de execuție în mediul de Sandbox public (Piston).",
  keywords: ["iTECify", "ITEC", "hackathon", "editor colaborativ", "monaco editor", "real-time coding", "Next.js"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
