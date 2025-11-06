"use client";
import { MiniKit, WalletAuthInput } from "@/lib/minikit";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useState } from "react";
import { useMockMode } from "@/lib/hooks/useMockMode";
import { LoginComponentProps } from "@/lib/mock/types";

const walletAuthInput = (nonce: string): WalletAuthInput => {
    return {
        nonce,
        requestId: "0",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "This is my statement and here is a link https://worldcoin.com/apps",
    };
};

type User = {
    walletAddress: string;
    username: string | null;
    profilePictureUrl: string | null;
};

export const Login = ({ mockConfig, onLogin, onError }: LoginComponentProps = {}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const { isMockMode, mockUser } = useMockMode();
    
    const refreshUserData = useCallback(async () => {
        try {
            // In mock mode, use mock user directly
            if (isMockMode && mockUser) {
                const mockUserData: User = {
                    walletAddress: mockUser.walletAddress,
                    username: mockUser.username,
                    profilePictureUrl: mockUser.profilePictureUrl
                };
                setUser(mockUserData);
                return;
            }

            // Real API call for non-mock mode
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }, [isMockMode, mockUser]);
    
    useEffect(() => {
        refreshUserData();
    }, [refreshUserData]);
    
    const handleLogin = async () => {
        try {
            setLoading(true);

            // Handle mock auto-login
            if (isMockMode && (mockConfig?.autoLogin || process.env.NEXT_PUBLIC_MOCK_AUTO_LOGIN === 'true')) {
                // Simulate delay if configured
                if (mockConfig?.simulateDelay) {
                    await new Promise(resolve => setTimeout(resolve, mockConfig.simulateDelay));
                }

                if (mockUser) {
                    const mockUserData: User = {
                        walletAddress: mockUser.walletAddress,
                        username: mockUser.username,
                        profilePictureUrl: mockUser.profilePictureUrl
                    };
                    setUser(mockUserData);
                    onLogin?.(mockUser as any);
                    console.log('🧪 Mock auto-login successful:', mockUser.username);
                }
                setLoading(false);
                return;
            }

            // Handle mock error simulation
            if (isMockMode && mockConfig?.forceError) {
                setLoading(false);
                const error = new Error('Mock login error simulated');
                onError?.(error);
                console.log('🧪 Mock login error simulated');
                return;
            }

            // Get nonce (real or mock endpoint)
            let nonce: string;
            if (isMockMode) {
                // In mock mode, generate a mock nonce
                nonce = 'mock-nonce-' + Date.now();
            } else {
                const res = await fetch(`/api/nonce`);
                const data = await res.json();
                nonce = data.nonce;
            }

            // Execute wallet auth (unified MiniKit handles mock/real)
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput(nonce));

            if (finalPayload.status === 'error') {
                setLoading(false);
                const error = new Error(finalPayload.message || 'Login failed');
                onError?.(error);
                return;
            }

            // Handle login response
            if (isMockMode) {
                // In mock mode, use MiniKit.user directly
                const currentUser = MiniKit.user;
                if (currentUser) {
                    const userData: User = {
                        walletAddress: currentUser.walletAddress,
                        username: currentUser.username,
                        profilePictureUrl: currentUser.profilePictureUrl
                    };
                    setUser(userData);
                    onLogin?.(currentUser);
                    console.log('🧪 Mock login successful:', currentUser.username);
                }
            } else {
                // Real API call for authentication
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payload: finalPayload,
                        nonce,
                    }),
                });

                if (response.status === 200) {
                    const realUser = MiniKit.user;
                    setUser(realUser);
                    onLogin?.(realUser);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Login error:", error);
            setLoading(false);
            onError?.(error as Error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {/* Mock mode indicator */}
            {isMockMode && (
                <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    🧪 Mock Mode: {mockUser?.persona || 'No User'}
                </div>
            )}
            
            {!user ? (
                <Button 
                    onClick={handleLogin} 
                    disabled={loading}
                >
                    {loading ? "Connecting..." : "Login"}
                </Button>
            ) : (
                <div className="flex flex-col items-center space-y-2">
                    <div className="text-green-600 font-medium">
                        ✓ Connected {isMockMode && '(Mock)'}
                    </div>
                    <div className="flex items-center space-x-2">
                        {user?.profilePictureUrl && (
                            <img
                                src={user.profilePictureUrl}
                                alt="Profile"
                                className="w-8 h-8 rounded-full"
                            />
                        )}
                        <span className="font-medium">
                            {user?.username || user?.walletAddress.slice(0, 6) + '...' + user?.walletAddress.slice(-4)}
                        </span>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        size="md"
                        disabled={loading}
                    >
                        {loading ? "Signing Out..." : "Sign Out"}
                    </Button>
                </div>
            )}
        </div>
    )
};
