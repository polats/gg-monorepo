"use client";
import { useState } from 'react';
import { Raffle } from '@/types/raffle';
import { TicketPurchase } from './TicketPurchase';
import { WinnersClaim } from './WinnersClaim';

interface RaffleDetailsProps {
  raffle: Raffle;
}

export function RaffleDetails({ raffle }: RaffleDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'tickets' | 'winners'>('details');

  const getStatusColor = (status: Raffle['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'drawing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m remaining`;
  };

  const progressPercentage = Math.min(
    (raffle.currentParticipants / raffle.minParticipants) * 100,
    100
  );

  const topBeneficiary = raffle.beneficiaries.reduce((prev, current) => 
    prev.votes > current.votes ? prev : current
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <a 
          href="/"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Back to Raffles
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(raffle.status)}`}>
              {raffle.status.toUpperCase()}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {raffle.totalPoolSize.toLocaleString()} WLD
              </div>
              <div className="text-sm text-gray-600">Total Prize Pool</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {raffle.title}
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            {raffle.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {raffle.ticketPrice}
              </div>
              <div className="text-sm text-gray-600">WLD per ticket</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {raffle.numWinners}
              </div>
              <div className="text-sm text-gray-600">Winners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {raffle.currentParticipants.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {raffle.status === 'active' || raffle.status === 'upcoming' 
                  ? formatTimeRemaining(raffle.endDate)
                  : raffle.status === 'completed' ? 'Complete' : 'Drawing'
                }
              </div>
              <div className="text-sm text-gray-600">Time Status</div>
            </div>
          </div>

          {(raffle.status === 'active' || raffle.status === 'upcoming') && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress to minimum participants ({raffle.minParticipants})</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              {(raffle.status === 'active' || raffle.status === 'upcoming') && (
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tickets'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Buy Tickets
                </button>
              )}
              {(raffle.status === 'completed' || raffle.status === 'drawing') && (
                <button
                  onClick={() => setActiveTab('winners')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'winners'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Winners
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Raffle Rules
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Maximum {raffle.maxEntriesPerUser} tickets per person</li>
                    <li>• {raffle.numWinners} winners will be selected</li>
                    <li>• Winners receive {raffle.winnerSharePercentage}% of the pool</li>
                    <li>• Beneficiaries receive {raffle.beneficiarySharePercentage}% of the pool</li>
                    <li>• WorldID verification required</li>
                    <li>• Minimum {raffle.minParticipants} participants needed</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Beneficiary Organizations
                  </h3>
                  {raffle.beneficiaries.length === 1 ? (
                    <div className="space-y-2">
                      <div className="font-medium text-green-600">
                        {raffle.beneficiaries[0].name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {raffle.beneficiaries[0].description}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {raffle.beneficiaries[0].walletAddress}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {raffle.beneficiaries
                        .sort((a, b) => b.votes - a.votes)
                        .map((beneficiary, index) => (
                          <div key={beneficiary.id} className="flex justify-between items-center">
                            <div>
                              <div className={`font-medium ${index === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                {beneficiary.name}
                                {index === 0 && ' (Leading)'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {beneficiary.description}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                              {beneficiary.votes} votes
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Operated by {raffle.operator}
                </h3>
                <p className="text-blue-700 text-sm">
                  Raffle created on {raffle.createdAt.toLocaleDateString()} • 
                  Runs from {raffle.startDate.toLocaleDateString()} to {raffle.endDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && raffle.status === 'active' && (
            <TicketPurchase raffle={raffle} />
          )}

          {activeTab === 'tickets' && raffle.status === 'upcoming' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Raffle Hasn't Started Yet
              </h3>
              <p className="text-gray-600">
                This raffle will begin on {raffle.startDate.toLocaleDateString()}
              </p>
            </div>
          )}

          {activeTab === 'winners' && (
            <WinnersClaim raffle={raffle} />
          )}
        </div>
      </div>
    </div>
  );
}