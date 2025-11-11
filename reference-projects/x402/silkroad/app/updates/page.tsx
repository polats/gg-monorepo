'use client';

import Link from 'next/link';
import { Updates } from '@/components/home/Updates';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumbs */}
        <Breadcrumbs />
        
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to Home
        </Link>

        <Updates />
      </div>
    </div>
  );
}

