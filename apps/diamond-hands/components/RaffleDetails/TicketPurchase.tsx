"use client";
import { useState } from 'react';
import { Raffle } from '@/types/raffle';

interface TicketPurchaseProps {
  raffle: Raffle;
}

export function TicketPurchase({ raffle }: TicketPurchaseProps) {
  const [numTickets, setNumTickets] = useState(1);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(
    raffle.beneficiaries.length === 1 ? raffle.beneficiaries[0].id : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const totalCost = numTickets * raffle.ticketPrice;

  const handlePurchase = async () => {
    if (!selectedBeneficiary && raffle.beneficiaries.length > 1) {
      alert('Please select a beneficiary to vote for');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Purchasing tickets:', {
        raffleId: raffle.id,
        numTickets,
        selectedBeneficiary,
        totalCost
      });

      // Here you would integrate with WorldCoin payments and WorldID verification
      // await verifyWorldID();
      // await processPurechase(totalCost);
      
      alert(`Successfully purchased ${numTickets} ticket(s) for ${totalCost} WLD! (Mock implementation)`);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🎟️ Buy Raffle Tickets
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of tickets (max {raffle.maxEntriesPerUser})
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setNumTickets(Math.max(1, numTickets - 1))}
                className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="1"
                  max={raffle.maxEntriesPerUser}
                  value={numTickets}
                  onChange={(e) => setNumTickets(Math.min(raffle.maxEntriesPerUser, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full text-center text-lg font-semibold py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setNumTickets(Math.min(raffle.maxEntriesPerUser, numTickets + 1))}
                className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {raffle.beneficiaries.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vote for beneficiary organization
              </label>
              <select
                value={selectedBeneficiary}
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a beneficiary...</option>
                {raffle.beneficiaries.map((beneficiary) => (
                  <option key={beneficiary.id} value={beneficiary.id}>
                    {beneficiary.name} ({beneficiary.votes} votes)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Tickets ({numTickets}x)</span>
              <span className="font-medium">{totalCost.toFixed(4)} WLD</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Winners get {raffle.winnerSharePercentage}%</span>
              <span>Beneficiaries get {raffle.beneficiarySharePercentage}%</span>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">WorldID Required</p>
                <p>You'll need to verify your identity with WorldID to purchase tickets and ensure fair play.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isLoading || (!selectedBeneficiary && raffle.beneficiaries.length > 1)}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              `Buy ${numTickets} Ticket${numTickets === 1 ? '' : 's'} (${totalCost.toFixed(4)} WLD)`
            )}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📋 How it works</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Verify your identity with WorldID</li>
          <li>2. Pay with WLD tokens from your wallet</li>
          <li>3. Receive soulbound NFT tickets</li>
          <li>4. Wait for the raffle drawing</li>
          <li>5. Claim your prizes if you win!</li>
        </ol>
      </div>
    </div>
  );
}