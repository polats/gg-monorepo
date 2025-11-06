import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import { MockModeProvider } from "@/components/providers/MockModeProvider";
import { LaunchModeProvider } from "@/components/providers/LaunchModeProvider";
import { DebugButton } from "@/components/DebugButton";
import dynamic from "next/dynamic";
import NextAuthProvider from "@/components/next-auth-provider";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RaffleTime",
  description: "WorldID-Powered Zero-Loss On-Chain Sweepstakes Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ErudaProvider = dynamic(
    () => import("../components/Eruda").then((c) => c.ErudaProvider),
    {
      ssr: false,
    }
  );
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital@0;1&family=Rubik:ital,wght@0,300..900;1,300..900&family=Sora:wght@600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={sora.className}>
        <NextAuthProvider>
          <ErudaProvider>
            <LaunchModeProvider>
              <MockModeProvider>
                <MiniKitProvider>
                  {children}
                  <DebugButton />
                </MiniKitProvider>
              </MockModeProvider>
            </LaunchModeProvider>
          </ErudaProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
