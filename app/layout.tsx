import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Pharmacy",
  description:
    "Smart Pharmacy — Browse medicines, manage orders and access smarter healthcare support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {/* ==================================================
            CLIENT NAVBAR
        =================================================== */}

        <Navbar />

        {/* ==================================================
            PAGE CONTENT
        =================================================== */}

        <main className="min-h-screen">
          {children}
        </main>

        {/* ==================================================
            CLIENT FOOTER
        =================================================== */}

        <Footer />

        {/* ==================================================
            AI CHATBOT
            Appears on every page.
            Clicking it opens /ai-chat.
        =================================================== */}

        <ChatBot />
      </body>
    </html>
  );
}