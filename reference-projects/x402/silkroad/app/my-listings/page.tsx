'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /my-listings to /listings/my
 * This is the old route - redirecting to new standardized route
 */
export default function MyListingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new my listings page
    router.replace('/listings/my');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Redirecting to your listings...</p>
      </div>
    </div>
  );
}
