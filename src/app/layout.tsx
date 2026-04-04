import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPIC CONECTA",
  description: "App para organizar cultos e destacar avisos para a comunidade da Igreja.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1B3B36",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        <Toaster position="top-center" richColors />
        <AuthProvider>
          <Header />
            <main style={{ flex: 1, paddingBottom: '90px' }}>
              {children}
            </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
