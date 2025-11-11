'use client';

import { useWallet } from '@solana/wallet-adapter-react';

interface TokenGateModalProps {
  isOpen: boolean;
  currentBalance?: number;
  requiredBalance: number;
}

const PUMP_FUN_URL = 'https://pump.fun/coin/49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump';

export function TokenGateModal({ isOpen, currentBalance = 0, requiredBalance }: TokenGateModalProps) {
  const { disconnect } = useWallet();

  const handleBuyTokens = () => {
    window.open(PUMP_FUN_URL, '_blank');
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isOpen) return null;

  const shortage = requiredBalance - currentBalance;
  const formattedBalance = currentBalance.toLocaleString();
  const formattedRequired = requiredBalance.toLocaleString();
  const formattedShortage = shortage.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-zinc-900 mx-4">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <svg
              className="h-8 w-8 text-yellow-600 dark:text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            🔒 Token Gating Required
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            SilkRoadx402 requires holding $SRx402 tokens for access
          </p>
        </div>

        {/* Balance Info */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/20">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-700 dark:text-zinc-300">Your Balance:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                {formattedBalance} $SRx402
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-700 dark:text-zinc-300">Required:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                {formattedRequired} $SRx402
              </span>
            </div>
            <div className="border-t border-yellow-300 pt-2 dark:border-yellow-900">
              <div className="flex justify-between">
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Need to Buy:</span>
                <span className="font-mono font-bold text-yellow-900 dark:text-yellow-100">
                  {formattedShortage} $SRx402
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>ℹ️ How to get access:</strong>
          </p>
          <ol className="mt-2 ml-4 space-y-1 text-sm text-green-800 dark:text-green-200 list-decimal">
            <li>Buy $SRx402 tokens on pump.fun</li>
            <li>Send tokens to your connected wallet</li>
            <li>Reconnect your wallet to refresh balance</li>
            <li>Accept TOS and start using the platform!</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleBuyTokens}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🚀 Buy $SRx402 on pump.fun
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>

        {/* Contract Info */}
        <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <strong>Token Contract:</strong>
          </p>
          <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
            49AfJsWb9E7VjBDTdZ2DjnSLFgSEvCoP1wdXuhHbpump
          </p>
        </div>
      </div>
    </div>
  );
}

