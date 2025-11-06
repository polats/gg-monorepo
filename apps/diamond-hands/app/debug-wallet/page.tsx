"use client";

import { useState } from 'react';
import { MiniKit, WalletAuthInput } from '@worldcoin/minikit-js';

export default function DebugWalletPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🔍 [DebugWallet] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testMiniKitAvailability = () => {
    addLog('=== Testing MiniKit Availability ===');

    // Check if MiniKit exists on window
    addLog(`window.MiniKit exists: ${typeof (window as any).MiniKit !== 'undefined'}`);

    // Check if our imported MiniKit exists
    addLog(`Imported MiniKit exists: ${typeof MiniKit !== 'undefined'}`);
    addLog(`MiniKit object: ${JSON.stringify(MiniKit, null, 2)}`);

    // Check if isInstalled method exists
    addLog(`MiniKit.isInstalled exists: ${typeof MiniKit.isInstalled === 'function'}`);

    if (typeof MiniKit.isInstalled === 'function') {
      const isInstalled = MiniKit.isInstalled();
      addLog(`MiniKit.isInstalled(): ${isInstalled}`);
    }

    // Check commandsAsync
    addLog(`MiniKit.commandsAsync exists: ${typeof MiniKit.commandsAsync !== 'undefined'}`);
    if (MiniKit.commandsAsync) {
      addLog(`MiniKit.commandsAsync.walletAuth exists: ${typeof MiniKit.commandsAsync.walletAuth === 'function'}`);
    }

    // Check user agent for World App
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`Is World App: ${navigator.userAgent.includes('Worldcoin')}`);
  };

  const testWalletAuth = async () => {
    if (isConnecting) return;

    addLog('=== Starting Wallet Authentication ===');
    setIsConnecting(true);

    try {
      // Step 1: Check if MiniKit is installed
      addLog('Step 1: Checking MiniKit installation...');
      if (!MiniKit.isInstalled()) {
        addLog('❌ MiniKit is not installed');
        return;
      }
      addLog('✅ MiniKit is installed');

      // Step 2: Fetch nonce from backend
      addLog('Step 2: Fetching nonce from /api/nonce...');
      const res = await fetch('/api/nonce');
      const { nonce } = await res.json();
      addLog(`✅ Received nonce: ${nonce}`);

      // Step 3: Configure wallet auth parameters
      addLog('Step 3: Configuring wallet auth parameters...');
      const authParams: WalletAuthInput = {
        nonce: nonce,
        requestId: '0',
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        statement: 'Debug wallet authentication test'
      };
      addLog(`✅ Auth params: ${JSON.stringify(authParams, null, 2)}`);

      // Step 4: Execute wallet authentication
      addLog('Step 4: Calling MiniKit.commandsAsync.walletAuth...');
      const result = await MiniKit.commandsAsync.walletAuth(authParams);
      addLog(`✅ walletAuth result: ${JSON.stringify(result, null, 2)}`);

      const { commandPayload, finalPayload } = result;
      addLog(`Command payload: ${JSON.stringify(commandPayload, null, 2)}`);
      addLog(`Final payload: ${JSON.stringify(finalPayload, null, 2)}`);

      // Step 5: Handle the response
      if (finalPayload.status === 'success') {
        addLog('✅ Authentication successful!');

        // Step 6: Get wallet address
        addLog('Step 6: Getting wallet address...');
        const address = MiniKit.walletAddress;
        addLog(`Wallet address: ${address}`);
        setWalletAddress(address);

        // Step 7: Send to backend for verification
        addLog('Step 7: Sending to backend for verification...');
        const response = await fetch('/api/complete-siwe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: finalPayload,
            nonce
          })
        });

        const verificationResult = await response.json();
        addLog(`Backend verification: ${JSON.stringify(verificationResult, null, 2)}`);

      } else {
        addLog(`❌ Authentication failed: ${finalPayload.status}`);
        if (finalPayload.message) {
          addLog(`Error message: ${finalPayload.message}`);
        }
      }

    } catch (error: any) {
      addLog(`❌ Error occurred: ${error.message}`);
      addLog(`Error stack: ${error.stack}`);
    } finally {
      setIsConnecting(false);
      addLog('=== Wallet Authentication Complete ===');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 MiniKit Debug Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Controls</h2>

            <div className="space-y-3">
              <button
                onClick={testMiniKitAvailability}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Test MiniKit Availability
              </button>

              <button
                onClick={testWalletAuth}
                disabled={isConnecting}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                {isConnecting ? 'Connecting...' : 'Test Wallet Auth'}
              </button>

              <button
                onClick={clearLogs}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Clear Logs
              </button>
            </div>

            {walletAddress && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800">Connected!</h3>
                <p className="text-sm text-green-700 font-mono">{walletAddress}</p>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>

            <div className="bg-black text-green-400 p-4 rounded text-sm font-mono h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Click a button to start debugging.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>First click "Test MiniKit Availability" to check the environment</li>
            <li>Then click "Test Wallet Auth" to test the authentication flow</li>
            <li>Watch the logs for detailed step-by-step debugging</li>
            <li>Use Eruda console for additional debugging</li>
          </ol>
        </div>
      </div>
    </div>
  );
}