import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KORN Maschinenakte",
  description: "Digitale Maschinenakte & RAG-Chatbot",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={geist.className}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
