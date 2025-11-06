"use client"; // Required for Next.js

import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect } from "react";
import { isMockModeEnabled } from "@/lib/mock/environment";
import { MockMiniKitInstance } from "@/lib/mock/mock-minikit";

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mockModeActive = isMockModeEnabled();
    
    if (mockModeActive) {
      // Use mock MiniKit in development
      MockMiniKitInstance.install();
      console.log('🧪 Mock MiniKit installed:', MockMiniKitInstance.isInstalled());
      
      // Log mock user info
      if (MockMiniKitInstance.user) {
        console.log('🧪 Mock user:', MockMiniKitInstance.user.username, MockMiniKitInstance.user.walletAddress);
      }
    } else {
      // Use real MiniKit in production
      MiniKit.install();
      console.log('✅ Real MiniKit installed:', MiniKit.isInstalled());
    }
  }, []);

  return <>{children}</>;
}
