'use client';

import { useAuth } from '@/hooks/useAuth';
import { TOSModal } from '@/components/modals/TOSModal';
import { TokenGateModal } from '@/components/modals/TokenGateModal';
import { MIN_SRX402_BALANCE } from '@/config/constants';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    showTOSModal,
    showTokenGateModal,
    tokenBalance,
    acceptTOS,
    declineTOS,
  } = useAuth();

  return (
    <>
      {/* Global Token Gate Modal - Priority 1: Shown if insufficient tokens */}
      <TokenGateModal
        isOpen={showTokenGateModal}
        currentBalance={tokenBalance}
        requiredBalance={MIN_SRX402_BALANCE}
      />

      {/* Global TOS Modal - Priority 2: Shown if tokens sufficient but TOS not accepted */}
      <TOSModal
        isOpen={showTOSModal}
        onAccept={acceptTOS}
        onDecline={declineTOS}
      />
      
      {children}
    </>
  );
}

