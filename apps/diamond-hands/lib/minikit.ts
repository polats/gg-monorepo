/**
 * Unified MiniKit Interface
 * Automatically switches between real and mock MiniKit based on environment
 */

import { WalletAuthInput } from "@worldcoin/minikit-js";
import { isMockModeEnabled } from "./mock/environment";

// Type-safe interface that matches both real and mock MiniKit
interface UnifiedMiniKit {
  isInstalled(): boolean;
  user: any;
  walletAddress: string;
  commandsAsync: {
    walletAuth(input: WalletAuthInput): Promise<any>;
    pay(payload: any): Promise<any>;
    verify(payload: any): Promise<any>;
  };
}

let miniKitInstance: UnifiedMiniKit;

// Initialize the appropriate MiniKit instance
const initializeMiniKit = (): UnifiedMiniKit => {
  console.log('🔍 [UnifiedMiniKit] initializeMiniKit called');
  console.log('🔍 [UnifiedMiniKit] isMockModeEnabled():', isMockModeEnabled());

  if (isMockModeEnabled()) {
    // Use mock MiniKit in development
    const { MockMiniKitInstance } = require("./mock/mock-minikit");
    console.log("🧪 Using Mock MiniKit");
    console.log('🔍 [UnifiedMiniKit] MockMiniKitInstance:', MockMiniKitInstance);
    return MockMiniKitInstance;
  } else {
    // Use real MiniKit in production
    const { MiniKit: RealMiniKit } = require("@worldcoin/minikit-js");
    console.log("✅ Using Real MiniKit");
    console.log('🔍 [UnifiedMiniKit] RealMiniKit:', RealMiniKit);
    console.log('🔍 [UnifiedMiniKit] RealMiniKit.isInstalled():', RealMiniKit.isInstalled());
    console.log('🔍 [UnifiedMiniKit] RealMiniKit.commandsAsync:', RealMiniKit.commandsAsync);
    return RealMiniKit;
  }
};

// Lazy initialization to avoid issues with SSR
const getMiniKit = (): UnifiedMiniKit => {
  if (!miniKitInstance) {
    miniKitInstance = initializeMiniKit();
  }
  return miniKitInstance;
};

// Export unified interface
export const MiniKit = {
  isInstalled: () => {
    const kit = getMiniKit();
    const result = kit.isInstalled();
    console.log('🔍 [UnifiedMiniKit] isInstalled() called, result:', result);
    return result;
  },

  get user() {
    const kit = getMiniKit();
    const result = kit.user;
    console.log('🔍 [UnifiedMiniKit] user called, result:', result);
    return result;
  },

  get walletAddress() {
    const kit = getMiniKit();
    const result = kit.walletAddress;
    console.log('🔍 [UnifiedMiniKit] walletAddress called, result:', result);
    return result;
  },

  get commandsAsync() {
    const kit = getMiniKit();
    const result = kit.commandsAsync;
    console.log('🔍 [UnifiedMiniKit] commandsAsync called, result:', result);
    console.log('🔍 [UnifiedMiniKit] commandsAsync.walletAuth:', result?.walletAuth);
    return result;
  },

  install: () => {
    console.log('🔍 [UnifiedMiniKit] install called');
    const kit = getMiniKit();
    if ('install' in kit) {
      console.log('🔍 [UnifiedMiniKit] calling kit.install()');
      (kit as any).install();
    } else {
      console.log('🔍 [UnifiedMiniKit] install method not available on kit');
    }
  }
};

// Export getMiniKit for direct access in hooks
export { getMiniKit };

// Re-export types for convenience
export type { WalletAuthInput } from "@worldcoin/minikit-js";