"use client";
import { use } from 'react';
import { getRaffleById } from '@/lib/mock-data';
import { RaffleDetails } from '@/components/RaffleDetails';
import { notFound } from 'next/navigation';

interface RafflePageProps {
  params: Promise<{ id: string }>;
}

export default function RafflePage({ params }: RafflePageProps) {
  const { id } = use(params);
  const raffle = getRaffleById(id);

  if (!raffle) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <RaffleDetails raffle={raffle} />
      </div>
    </main>
  );
}