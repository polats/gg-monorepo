'use client';

import { useEffect } from 'react';

/**
 * AppInitializer Component
 * 
 * Clears localStorage on every app load for a clean slate.
 * This is a TEMPORARY solution for MVP admin authentication.
 * 
 * TODO: Remove this when implementing real admin authentication
 */
export function AppInitializer() {
  useEffect(() => {
    // Clear all localStorage on app mount for clean slate
    if (typeof window !== 'undefined') {
      console.log('🧹 Clearing localStorage for fresh session...');
      localStorage.clear();
    }
  }, []);

  return null; // This component doesn't render anything
}

