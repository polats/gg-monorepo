"use client";
import {
  VerificationLevel,
  ISuccessResult,
  MiniAppVerifyActionErrorPayload,
  IVerifyResponse,
  VerificationErrorCodes,
} from "@worldcoin/minikit-js";
import { MiniKit } from "@/lib/minikit";
import { useCallback, useState } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useMockMode } from "@/lib/hooks/useMockMode";
import { VerifyComponentProps } from "@/lib/mock/types";

export type VerifyCommandInput = {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel; // Default: Orb
};

const verifyPayload: VerifyCommandInput = {
  action: "test-action-2", // This is your action ID from the Developer Portal
  signal: "",
  verification_level: VerificationLevel.Orb, // Orb | Device
};

// Generic Verify Component for testing
export const Verify = ({ 
  action,
  signal,
  mockConfig, 
  onSuccess, 
  onError 
}: VerifyComponentProps) => {
  const [handleVerifyResponse, setHandleVerifyResponse] = useState<
    MiniAppVerifyActionErrorPayload | IVerifyResponse | null
  >(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const { isMockMode, mockUser } = useMockMode();

  const handleVerify = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
      const error = new Error("MiniKit is not installed");
      onError?.(error);
      return;
    }

    setLoading(true);

    try {
      // Handle mock delay simulation
      if (isMockMode && mockConfig?.simulateDelay) {
        await new Promise(resolve => setTimeout(resolve, mockConfig.simulateDelay));
      }

      // Handle mock error simulation
      if (isMockMode && mockConfig?.forceError) {
        const mockError: MiniAppVerifyActionErrorPayload = {
          status: "error" as const,
          error_code: VerificationErrorCodes.VerificationRejected,
          version: 1
        };
        console.log('🧪 Mock verification error simulated');
        setHandleVerifyResponse(mockError);
        setLoading(false);
        onError?.(new Error("Mock verification error simulated"));
        return mockError;
      }

      const customPayload = {
        action: action,
        signal: signal,
        verification_level: VerificationLevel.Orb
      };
      const { finalPayload } = await MiniKit.commandsAsync.verify(customPayload);

      // no need to verify if command errored
      if (finalPayload.status === "error") {
        console.log("Command error");
        console.log(finalPayload);
        setHandleVerifyResponse(finalPayload);
        setLoading(false);
        onError?.(new Error(finalPayload.message || "Verification failed"));
        return finalPayload;
      }

      // Mock or real verification
      let verifyResponseJson;
      
      if (isMockMode) {
        // Mock verification always succeeds unless forced to fail
        verifyResponseJson = {
          status: 200,
          success: true,
          verified: true,
          nullifier_hash: finalPayload.nullifier_hash,
          merkle_root: finalPayload.merkle_root,
          proof: finalPayload.proof,
          verification_level: finalPayload.verification_level
        };
        console.log('🧪 Mock verification successful:', mockUser?.username);
      } else {
        // Real backend verification
        const verifyResponse = await fetch(`/api/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: finalPayload as ISuccessResult,
            action: action,
            signal: signal,
          }),
        });
        verifyResponseJson = await verifyResponse.json();
      }

      if (verifyResponseJson.status === 200) {
        console.log("Verification success!");
        console.log(finalPayload);
        setVerified(true);
        onSuccess?.(verifyResponseJson);
      }

      setHandleVerifyResponse(verifyResponseJson);
      setLoading(false);
      return verifyResponseJson;
    } catch (error) {
      console.error("Verification error:", error);
      setLoading(false);
      onError?.(error as Error);
      return null;
    }
  }, [action, signal, isMockMode, mockConfig, onSuccess, onError, mockUser]);

  const resetVerification = useCallback(() => {
    setHandleVerifyResponse(null);
    setVerified(false);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Mock mode indicator */}
      {isMockMode && (
        <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          🧪 Mock Mode: {mockUser?.persona || 'No User'}
        </div>
      )}
      
      {!handleVerifyResponse ? (
        <Button 
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "Verifying..." : `Verify with World ID${isMockMode ? ' (Mock)' : ''}`}
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          {verified ? (
            <>
              <div className="text-green-600 font-medium">✓ Verified {isMockMode && '(Mock)'}</div>
              <div className="bg-gray-100 p-4 rounded-md max-w-md overflow-auto">
                <pre className="text-xs">{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-600 font-medium">✗ Verification Failed {isMockMode && '(Mock)'}</div>
              <div className="bg-gray-100 p-4 rounded-md max-w-md overflow-auto">
                <pre className="text-xs">{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
              </div>
            </>
          )}
          <Button
            onClick={resetVerification}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

// Original VerifyBlock component (backward compatibility)
export const VerifyBlock = () => {
  const [handleVerifyResponse, setHandleVerifyResponse] = useState<
    MiniAppVerifyActionErrorPayload | IVerifyResponse | null
  >(null);
  const [verified, setVerified] = useState<boolean>(false);
  const { isMockMode, mockUser } = useMockMode();

  const handleVerify = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
      return;
    }

    const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

    // no need to verify if command errored
    if (finalPayload.status === "error") {
      console.log("Command error");
      console.log(finalPayload);

      setHandleVerifyResponse(finalPayload);
      return finalPayload;
    }

    // Mock or real verification
    let verifyResponseJson;
    
    if (isMockMode) {
      // Mock verification always succeeds
      verifyResponseJson = {
        status: 200,
        success: true,
        verified: true,
        nullifier_hash: finalPayload.nullifier_hash,
        merkle_root: finalPayload.merkle_root,
        proof: finalPayload.proof,
        verification_level: finalPayload.verification_level
      };
      console.log('🧪 Mock verification successful:', mockUser?.username);
    } else {
      // Real backend verification
      const verifyResponse = await fetch(`/api/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
        }),
      });
      verifyResponseJson = await verifyResponse.json();
    }

    if (verifyResponseJson.status === 200) {
      console.log("Verification success!");
      console.log(finalPayload);
      setVerified(true);
    }

    setHandleVerifyResponse(verifyResponseJson);
    return verifyResponseJson;
  }, [isMockMode, mockUser]);

  return (
    <div className="flex flex-col items-center">
      {/* Mock mode indicator */}
      {isMockMode && (
        <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          🧪 Mock Mode: {mockUser?.persona || 'No User'}
        </div>
      )}
      
      {!handleVerifyResponse ? (
        <Button 
          onClick={handleVerify}
        >
          Verify with World ID{isMockMode && ' (Mock)'}
        </Button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          {verified ? (
            <>
              <div className="text-green-600 font-medium">✓ Verified {isMockMode && '(Mock)'}</div>
              <div className="bg-gray-100 p-4 rounded-md max-w-md overflow-auto">
                <pre className="text-xs">{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-600 font-medium">✗ Verification Failed {isMockMode && '(Mock)'}</div>
              <div className="bg-gray-100 p-4 rounded-md max-w-md overflow-auto">
                <pre className="text-xs">{JSON.stringify(handleVerifyResponse, null, 2)}</pre>
              </div>
            </>
          )}
          <Button
            onClick={() => setHandleVerifyResponse(null)}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
