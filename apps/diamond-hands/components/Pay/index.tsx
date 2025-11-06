"use client";
import {
  tokenToDecimals,
  Tokens,
  PayCommandInput,
} from "@worldcoin/minikit-js";
import { MiniKit } from "@/lib/minikit";
import { Button, Input, Select } from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { useMockMode } from "@/lib/hooks/useMockMode";
import { PayComponentProps } from "@/lib/mock/types";

const sendPayment = async (
  recipientAddress: string, 
  selectedToken: Tokens, 
  amount: number,
  isMockMode: boolean = false,
  mockConfig?: PayComponentProps['mockConfig']
) => {
  try {
    // Handle mock delay simulation
    if (mockConfig?.simulateNetworkDelay) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Handle forced mock failure
    if (mockConfig?.forceFailure) {
      console.log('🧪 Mock payment failure simulated');
      return {
        finalPayload: {
          status: 'error',
          error_code: 'user_cancelled',
          message: 'Mock payment failure simulated'
        }
      };
    }

    let paymentId: string;
    
    if (isMockMode) {
      // Generate mock payment ID
      paymentId = 'mock-payment-' + Date.now();
      console.log('🧪 Mock payment initiated:', paymentId);
    } else {
      // Real API call
      const res = await fetch(`/api/initiate-payment`, {
        method: "POST",
      });
      const { id } = await res.json();
      paymentId = id;
    }

    const payload: PayCommandInput = {
      reference: paymentId,
      to: recipientAddress,
      tokens: [
        {
          symbol: selectedToken,
          token_amount: tokenToDecimals(amount, selectedToken).toString(),
        },
      ],
      description: "Thanks for the coffee! ☕",
    };

    if (MiniKit.isInstalled()) {
      const result = await MiniKit.commandsAsync.pay(payload);
      
      // Use custom transaction hash if provided
      if (isMockMode && mockConfig?.customTxHash && result.finalPayload.status === 'success') {
        result.finalPayload.transaction_hash = mockConfig.customTxHash;
      }
      
      return result;
    }
    return null;
  } catch (error: unknown) {
    console.log("Error sending payment", error);
    return null;
  }
};

const handlePay = async (
  recipientAddress: string,
  selectedToken: Tokens,
  amount: number,
  setStatus: (status: string | null) => void,
  isMockMode: boolean = false,
  mockConfig?: PayComponentProps['mockConfig'],
  onSuccess?: (txHash: string) => void,
  onError?: (error: Error) => void
) => {
  if (!MiniKit.isInstalled()) {
    const error = new Error("MiniKit is not installed");
    setStatus(error.message);
    onError?.(error);
    return;
  }

  setStatus("Processing payment...");
  
  try {
    const sendPaymentResponse = await sendPayment(recipientAddress, selectedToken, amount, isMockMode, mockConfig);
    const response = sendPaymentResponse?.finalPayload;

    if (!response) {
      const error = new Error("Payment failed - no response");
      setStatus("Payment failed");
      onError?.(error);
      return;
    }

    if (response.status === "success") {
      const txHash = response.transaction_hash;
      
      if (isMockMode) {
        // Mock confirmation - always succeeds
        setStatus("Thank you for the coffee! ☕ (Mock)");
        onSuccess?.(txHash);
        console.log('🧪 Mock payment confirmed:', txHash);
      } else {
        // Real payment confirmation
        const res = await fetch(`/api/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: response }),
        });
        const payment = await res.json();
        
        if (payment.success) {
          setStatus("Thank you for the coffee! ☕");
          onSuccess?.(txHash);
        } else {
          const error = new Error("Payment confirmation failed");
          setStatus(error.message);
          onError?.(error);
        }
      }
    } else {
      // Payment failed
      const error = new Error(response.message || "Payment failed");
      setStatus(`Payment failed: ${response.error_code || 'Unknown error'}`);
      onError?.(error);
      
      if (isMockMode) {
        console.log('🧪 Mock payment failed:', response.error_code);
      }
    }
  } catch (error) {
    const err = error as Error;
    setStatus("Payment error occurred");
    onError?.(err);
    console.error("Payment error:", err);
  }
};

// Generic Pay Component for testing
export const Pay = ({ 
  amount, 
  recipient, 
  mockConfig, 
  onSuccess, 
  onError 
}: PayComponentProps) => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isMockMode, mockWallet } = useMockMode();

  const handlePayment = async () => {
    if (!recipient || !amount) {
      const error = new Error("Missing recipient or amount");
      setStatus("Missing recipient or amount");
      onError?.(error);
      return;
    }

    // Check mock wallet balance
    if (isMockMode && mockWallet && !mockWallet.capabilities.canPay) {
      const error = new Error("Insufficient funds");
      setStatus("Insufficient funds");
      onError?.(error);
      return;
    }

    setLoading(true);
    
    await handlePay(
      recipient,
      Tokens.WLD,
      parseFloat(amount),
      setStatus,
      isMockMode,
      mockConfig,
      onSuccess,
      onError
    );
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      {isMockMode && (
        <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          🧪 Mock Mode: Balance {mockWallet?.balance || '0'} WLD
        </div>
      )}
      
      <div className="text-center">
        <p>Pay {amount} WLD to {recipient.slice(0, 6)}...{recipient.slice(-4)}</p>
      </div>
      
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Processing..." : "Pay"}
      </Button>

      {status && (
        <div className={`mt-2 text-center text-sm ${
          status.includes("Thank you") || status.includes("confirmed") 
            ? "text-green-600" 
            : "text-red-600"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
};

// Coffee Purchase Component (original PayBlock)
export const PayBlock = () => {
  const [recipientAddress, setRecipientAddress] = useState(process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "");
  const [selectedToken, setSelectedToken] = useState<Tokens>(Tokens.WLD);
  const [amount, setAmount] = useState<number>(0.5);
  const [status, setStatus] = useState<string | null>(null);
  const { isMockMode, mockWallet } = useMockMode();

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg shadow-sm">
      {/* Mock mode indicator */}
      {isMockMode && (
        <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          🧪 Mock Mode - Balance: {mockWallet?.balance || '0'} WLD
        </div>
      )}
      
      <h3 className="text-xl font-semibold">Buy me a coffee ☕</h3>
      <p className="text-center text-gray-600 mb-4">
        Enjoyed this app? Buy me a coffee! 🎉 Or change the address to support someone else!
      </p>

      <div className="w-full space-y-4">
        Recipient Address
        <Input
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="0x..."
        />

        <div className="flex gap-4">
          Token
          <Select
            value={selectedToken}
            onChange={(value) => setSelectedToken(value as Tokens)}
            options={[
              { label: "WLD", value: Tokens.WLD },
              { label: "USDC", value: Tokens.USDCE }
            ]}
          />

          Amount
          <Input
            type="number"
            value={amount.toString()}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            placeholder="0.5"
          />
        </div>
      </div>

      <Button
        onClick={() => handlePay(recipientAddress, selectedToken, amount, setStatus, isMockMode)}
        className="w-full mt-2"
      >
        Buy Coffee {isMockMode && '(Mock)'}
      </Button>

      {status && (
        <div className={`mt-2 text-center ${status.includes("Thank you") ? "text-green-600" : "text-red-600"}`}>
          {status}
        </div>
      )}
    </div>
  );
};
