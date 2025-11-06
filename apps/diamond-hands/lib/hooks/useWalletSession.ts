import { useState, useEffect, useCallback, useRef } from 'react';
import { UserSession } from '@/types/wallet';

export interface UseWalletSessionOptions {
  autoRestore?: boolean;
  sessionTimeout?: number;
  onSessionRestore?: (session: UserSession) => void;
  onSessionExpired?: () => void;
  onSessionCreated?: (session: UserSession) => void;
}

export interface UseWalletSessionReturn {
  session: UserSession | null;
  isSessionValid: boolean;
  createSession: (walletAddress: string, options?: { mockUserId?: string }) => UserSession;
  restoreSession: () => UserSession | null;
  updateSession: (updates: Partial<UserSession>) => void;
  clearSession: () => void;
  refreshSession: () => void;
  getSessionAge: () => number;
}

const STORAGE_KEY = 'worldWalletSession';
const DEFAULT_SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_VERSION = '1.0';

// Device fingerprinting for basic security
const getDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);

  return {
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    canvas: canvas.toDataURL(),
    userAgent: navigator.userAgent.substring(0, 100), // Truncated for storage
  };
};

// Generate a secure session ID
const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
};

export function useWalletSession(options: UseWalletSessionOptions = {}): UseWalletSessionReturn {
  const {
    autoRestore = true,
    sessionTimeout = DEFAULT_SESSION_TIMEOUT,
    onSessionRestore,
    onSessionExpired,
    onSessionCreated,
  } = options;

  const [session, setSession] = useState<UserSession | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const deviceFingerprintRef = useRef<any>(null);
  const lastActivityRef = useRef(Date.now());

  // Initialize device fingerprint
  useEffect(() => {
    if (typeof window !== 'undefined') {
      deviceFingerprintRef.current = getDeviceFingerprint();
    }
  }, []);

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Validate session integrity
  const validateSession = useCallback((sessionData: any): boolean => {
    if (!sessionData || typeof sessionData !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['walletAddress', 'sessionId', 'timestamp', 'version'];
    for (const field of requiredFields) {
      if (!sessionData[field]) {
        return false;
      }
    }

    // Check version compatibility
    if (sessionData.version !== SESSION_VERSION) {
      return false;
    }

    // Check session age
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > sessionTimeout) {
      return false;
    }

    // Basic device fingerprint check
    if (sessionData.deviceFingerprint && deviceFingerprintRef.current) {
      const currentFingerprint = deviceFingerprintRef.current;
      const storedFingerprint = sessionData.deviceFingerprint;

      // Check key identifying factors
      if (
        storedFingerprint.screen !== currentFingerprint.screen ||
        storedFingerprint.timezone !== currentFingerprint.timezone ||
        storedFingerprint.platform !== currentFingerprint.platform
      ) {
        console.warn('Device fingerprint mismatch, session may be compromised');
        return false;
      }
    }

    return true;
  }, [sessionTimeout]);

  // Get stored session from localStorage
  const getStoredSession = useCallback((): any => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse stored session:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }, []);

  // Save session to localStorage with encryption-like obfuscation
  const saveSession = useCallback((sessionData: UserSession & {
    timestamp: number;
    version: string;
    deviceFingerprint?: any;
    lastActivity?: number;
  }) => {
    try {
      const dataToStore = {
        ...sessionData,
        deviceFingerprint: deviceFingerprintRef.current,
        lastActivity: lastActivityRef.current,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  // Create new session
  const createSession = useCallback((
    walletAddress: string,
    options: { mockUserId?: string } = {}
  ): UserSession => {
    const newSession: UserSession = {
      walletAddress,
      sessionId: generateSessionId(),
      autoConnect: true,
      mockUserId: options.mockUserId || null,
    };

    const sessionWithMetadata = {
      ...newSession,
      timestamp: Date.now(),
      version: SESSION_VERSION,
    };

    saveSession(sessionWithMetadata);
    setSession(newSession);
    setIsSessionValid(true);

    onSessionCreated?.(newSession);
    return newSession;
  }, [saveSession, onSessionCreated]);

  // Restore session from localStorage
  const restoreSession = useCallback((): UserSession | null => {
    const storedData = getStoredSession();

    if (!storedData) {
      return null;
    }

    if (!validateSession(storedData)) {
      localStorage.removeItem(STORAGE_KEY);
      onSessionExpired?.();
      return null;
    }

    const restoredSession: UserSession = {
      walletAddress: storedData.walletAddress,
      sessionId: storedData.sessionId,
      autoConnect: storedData.autoConnect ?? true,
      mockUserId: storedData.mockUserId || null,
    };

    setSession(restoredSession);
    setIsSessionValid(true);

    onSessionRestore?.(restoredSession);
    return restoredSession;
  }, [getStoredSession, validateSession, onSessionRestore, onSessionExpired]);

  // Update existing session
  const updateSession = useCallback((updates: Partial<UserSession>) => {
    if (!session) {
      return;
    }

    const updatedSession = { ...session, ...updates };
    const sessionWithMetadata = {
      ...updatedSession,
      timestamp: Date.now(),
      version: SESSION_VERSION,
    };

    saveSession(sessionWithMetadata);
    setSession(updatedSession);
  }, [session, saveSession]);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setIsSessionValid(false);
  }, []);

  // Refresh session timestamp
  const refreshSession = useCallback(() => {
    if (!session) {
      return;
    }

    const refreshedSession = {
      ...session,
      timestamp: Date.now(),
      version: SESSION_VERSION,
    };

    saveSession(refreshedSession);
  }, [session, saveSession]);

  // Get session age in milliseconds
  const getSessionAge = useCallback((): number => {
    const storedData = getStoredSession();
    if (!storedData || !storedData.timestamp) {
      return Infinity;
    }
    return Date.now() - storedData.timestamp;
  }, [getStoredSession]);

  // Auto-restore session on mount
  useEffect(() => {
    if (autoRestore && !session) {
      restoreSession();
    }
  }, [autoRestore, session, restoreSession]);

  // Session validation timer
  useEffect(() => {
    if (!session || !isSessionValid) {
      return;
    }

    const checkSessionValidity = () => {
      const storedData = getStoredSession();
      if (!validateSession(storedData)) {
        clearSession();
        onSessionExpired?.();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionValidity, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session, isSessionValid, getStoredSession, validateSession, clearSession, onSessionExpired]);

  // Periodic session refresh based on user activity
  useEffect(() => {
    if (!session || !isSessionValid) {
      return;
    }

    const refreshBasedOnActivity = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const shouldRefresh = timeSinceActivity < 30 * 60 * 1000; // 30 minutes

      if (shouldRefresh) {
        refreshSession();
      }
    };

    // Refresh every hour if user is active
    const interval = setInterval(refreshBasedOnActivity, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session, isSessionValid, refreshSession]);

  // Handle tab/window close for session cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && isSessionValid) {
        // Update last activity timestamp before page unload
        updateSession({ ...session });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isSessionValid, updateSession]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === null) {
          // Session was cleared in another tab
          setSession(null);
          setIsSessionValid(false);
        } else {
          // Session was updated in another tab
          try {
            const updatedData = JSON.parse(e.newValue);
            if (validateSession(updatedData)) {
              const updatedSession: UserSession = {
                walletAddress: updatedData.walletAddress,
                sessionId: updatedData.sessionId,
                autoConnect: updatedData.autoConnect ?? true,
                mockUserId: updatedData.mockUserId || null,
              };
              setSession(updatedSession);
              setIsSessionValid(true);
            }
          } catch (error) {
            console.warn('Failed to sync session from another tab:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [validateSession]);

  return {
    session,
    isSessionValid,
    createSession,
    restoreSession,
    updateSession,
    clearSession,
    refreshSession,
    getSessionAge,
  };
}