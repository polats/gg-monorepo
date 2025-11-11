import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/providers/WalletProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PublicChat } from "@/components/chat/PublicChat";
import { AppInitializer } from "@/components/providers/AppInitializer";
import { UIProviders } from "@/components/providers/UIProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SilkRoadx402 - Anonymous Software Marketplace",
  description: "Peer-to-peer marketplace for private software using x402 micropayments on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppInitializer />
        <SolanaWalletProvider>
          <AuthProvider>
            <UIProviders>
              <div className="relative">
                <Navbar />
                <main className="pt-16 pb-16">
                  {children}
                </main>
                <Footer />
                <PublicChat />
              </div>
            </UIProviders>
          </AuthProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
