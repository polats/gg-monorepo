"use client";
import { useState } from 'react';
import { CreateRaffleForm } from '@/components/CreateRaffle';

export default function CreateRafflePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎲 Create New Raffle
            </h1>
            <p className="text-gray-600">
              Set up your WorldID-powered zero-loss sweepstakes
            </p>
          </div>
          
          <CreateRaffleForm />
        </div>
      </div>
    </main>
  );
}