"use client";
import { useState } from 'react';
import { mockRaffles } from '@/lib/mock-data';
import { Raffle } from '@/types/raffle';
import { RaffleCard } from './RaffleCard';

type FilterStatus = 'all' | 'active' | 'upcoming' | 'drawing' | 'completed';

export function RaffleList() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredRaffles = filter === 'all' 
    ? mockRaffles 
    : mockRaffles.filter(raffle => raffle.status === filter);

  const statusCounts = {
    all: mockRaffles.length,
    active: mockRaffles.filter(r => r.status === 'active').length,
    upcoming: mockRaffles.filter(r => r.status === 'upcoming').length,
    drawing: mockRaffles.filter(r => r.status === 'drawing').length,
    completed: mockRaffles.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.keys(statusCounts) as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {filteredRaffles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎟️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No raffles found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "There are no raffles available right now." 
              : `No ${filter} raffles at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRaffles.map((raffle) => (
            <RaffleCard key={raffle.id} raffle={raffle} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <a 
          href="/create"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          🎲 Create New Raffle
        </a>
      </div>
    </div>
  );
}