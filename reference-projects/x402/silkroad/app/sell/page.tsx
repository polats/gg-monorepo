'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /sell to /listings/new
 * This is the old route - redirecting to new standardized route
 */
export default function SellPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new listing creation page
    router.replace('/listings/new');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Redirecting to create listing...</p>
      </div>
    </div>
  );
}
