'use client';

import React, { useState } from 'react';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { debugMiniKit, checkMiniKitCommands } from '@/lib/utils/wallet';

/**
 * Debug component for troubleshooting MiniKit issues
 * Only visible in development mode
 */
export interface MiniKitDebuggerProps {
  className?: string;
}

export function MiniKitDebugger({ className }: MiniKitDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleDebug = () => {
    debugMiniKit();
  };

  const handleCheckCommands = async () => {
    setIsChecking(true);
    try {
      const result = await checkMiniKitCommands();
      setDebugInfo(result);
      console.log('MiniKit Commands Check:', result);
    } catch (error) {
      console.error('Failed to check MiniKit commands:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallMiniKit = () => {
    try {
      const MiniKit = (window as any).MiniKit;
      if (MiniKit && typeof MiniKit.install === 'function') {
        MiniKit.install();
        console.log('MiniKit installation attempted');
        setTimeout(() => {
          console.log('Post-install status:', MiniKit.isInstalled());
        }, 1000);
      } else {
        console.error('MiniKit.install() not available');
      }
    } catch (error) {
      console.error('Failed to install MiniKit:', error);
    }
  };

  return (
    <div className={`p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🔧 MiniKit Debugger (Dev Only)</h3>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDebug}
          className="w-full"
        >
          🔍 Debug MiniKit (Check Console)
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckCommands}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? '⏳ Checking...' : '🔍 Check Commands'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleInstallMiniKit}
          className="w-full"
        >
          🔧 Force Install MiniKit
        </Button>

        {debugInfo && (
          <div className="mt-3 p-3 bg-white rounded border text-xs">
            <div className="font-semibold mb-2">Command Check Results:</div>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 ${debugInfo.isInstalled ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.isInstalled ? '✅' : '❌'} Installed: {debugInfo.isInstalled ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${debugInfo.hasWalletAuth ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.hasWalletAuth ? '✅' : '❌'} WalletAuth: {debugInfo.hasWalletAuth ? 'Available' : 'Missing'}
              </div>
              <div className={`flex items-center gap-2 ${debugInfo.hasPay ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.hasPay ? '✅' : '❌'} Pay: {debugInfo.hasPay ? 'Available' : 'Missing'}
              </div>
              <div className={`flex items-center gap-2 ${debugInfo.hasVerify ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.hasVerify ? '✅' : '❌'} Verify: {debugInfo.hasVerify ? 'Available' : 'Missing'}
              </div>

              {debugInfo.errors && debugInfo.errors.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-red-600">Errors:</div>
                  {debugInfo.errors.map((error: string, index: number) => (
                    <div key={index} className="text-red-500 text-xs">• {error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
          <strong>💡 Tips:</strong>
          <ul className="mt-1 space-y-1 text-xs">
            <li>• Make sure you're using the World App</li>
            <li>• Try refreshing the page if commands are missing</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• In development, use mock mode for testing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}