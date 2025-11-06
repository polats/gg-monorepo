"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MiniKit } from "@/lib/minikit";
import { Login } from "@/components/Login";
import { RaffleList } from "@/components/RaffleList";
import { useLaunchMode } from "@/components/providers/LaunchModeProvider";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const { isLaunched } = useLaunchMode();
  const router = useRouter();

  // Check if app is launched, redirect to minigame if not
  useEffect(() => {
    if (!isLaunched) {
      router.push('/minigame');
      return;
    }
  }, [isLaunched, router]);

  useEffect(() => {
    // Only proceed with MiniKit check if app is launched
    if (!isLaunched) return;

    let attempts = 0;
    const maxAttempts = 10; // Try for 5 seconds (10 * 500ms)

    const checkMiniKit = async () => {
      const isInstalled = MiniKit.isInstalled();
      if (isInstalled) {
        setIsLoading(false);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          setIsLoading(false);
          setShowQRCode(true);
        } else {
          setTimeout(checkMiniKit, 500);
        }
      }
    };

    checkMiniKit();
  }, [isLaunched]);

  // Don't render main app content if not launched
  if (!isLaunched) {
    return null; // Will redirect to minigame
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center">
          <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading RaffleTime...</p>
        </div>
      </main>
    );
  }

  if (showQRCode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Open in World App
            </h1>
            <p className="text-gray-600 mb-6">
              RaffleTime is designed to work with WorldID verification. Please scan this QR code with your phone to open in the World App.
            </p>
            
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6 inline-block">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://world.org/mini-app?app_id=app_eb5088e6eec59cb1b16ead1c85886fb0&draft_id=meta_647417012f14c9391c8e6fc5150a993e')}`}
                alt="QR Code to open in World App"
                className="w-48 h-48"
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Or tap the link below on your mobile device:
            </p>
            
            <a 
              href="https://world.org/mini-app?app_id=app_eb5088e6eec59cb1b16ead1c85886fb0&draft_id=meta_647417012f14c9391c8e6fc5150a993e"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in World App
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎟️ RaffleTime
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            WorldID-Powered Zero-Loss On-Chain Sweepstakes Platform
          </p>
          <div className="max-w-md mx-auto">
            <Login />
          </div>
        </header>

        <RaffleList />
      </div>
    </main>
  );
}
