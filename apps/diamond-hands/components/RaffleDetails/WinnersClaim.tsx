"use client";
import { useState } from 'react';
import { Raffle } from '@/types/raffle';

interface WinnersClaimProps {
  raffle: Raffle;
}

export function WinnersClaim({ raffle }: WinnersClaimProps) {
  const [isClaimingPrize, setIsClaimingPrize] = useState(false);

  const handleClaimPrize = async () => {
    setIsClaimingPrize(true);
    
    try {
      console.log('Claiming prize for raffle:', raffle.id);
      
      // Here you would verify the user owns winning NFT tickets and process the claim
      // await verifyWinningNFT();
      // await processPrizeClaim();
      
      alert('Prize claimed successfully! (Mock implementation)');
      
    } catch (error) {
      console.error('Prize claim failed:', error);
      alert('Prize claim failed. Please try again.');
    } finally {
      setIsClaimingPrize(false);
    }
  };

  if (raffle.status === 'drawing') {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Drawing in Progress
        </h3>
        <p className="text-gray-600 mb-4">
          Winners are being selected using our provably fair random number generator.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (raffle.status !== 'completed' || !raffle.winners) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">❓</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Results Available
        </h3>
        <p className="text-gray-600">
          Winner information is not yet available for this raffle.
        </p>
      </div>
    );
  }

  const totalWinnerPrize = raffle.totalPoolSize * (raffle.winnerSharePercentage / 100);
  const prizePerWinner = totalWinnerPrize / raffle.numWinners;
  const beneficiaryAmount = raffle.totalPoolSize * (raffle.beneficiarySharePercentage / 100);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            🏆 Winners ({raffle.winners.length})
          </h3>
          
          <div className="space-y-3">
            {raffle.winners.map((winner, index) => (
              <div key={winner.id} className="bg-white p-4 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    #{index + 1} {winner.username}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {prizePerWinner.toFixed(2)} WLD
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-mono mb-2">
                  {winner.walletAddress}
                </div>
                <div className={`text-xs font-medium ${
                  winner.claimed ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {winner.claimed ? '✅ Prize Claimed' : '⏳ Pending Claim'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-dashed border-green-300">
            <div className="text-sm text-green-700 text-center">
              Total Winners Prize Pool: <span className="font-bold">{totalWinnerPrize.toFixed(2)} WLD</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            💝 Beneficiary
          </h3>
          
          {raffle.selectedBeneficiary && (
            <div className="bg-white p-4 rounded border">
              <div className="font-medium text-gray-900 mb-2">
                {raffle.beneficiaries.find(b => b.id === raffle.selectedBeneficiary)?.name}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {raffle.beneficiaries.find(b => b.id === raffle.selectedBeneficiary)?.description}
              </div>
              <div className="text-xs text-gray-500 font-mono mb-3">
                {raffle.beneficiaries.find(b => b.id === raffle.selectedBeneficiary)?.walletAddress}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {beneficiaryAmount.toFixed(2)} WLD
              </div>
              <div className="text-xs text-green-600 font-medium mt-2">
                ✅ Automatically Distributed
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-white rounded border border-dashed border-blue-300">
            <div className="text-sm text-blue-700 text-center">
              Beneficiary Share: <span className="font-bold">{raffle.beneficiarySharePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">
          🎟️ Claim Your Prize
        </h3>
        
        <p className="text-purple-800 mb-4">
          If you're a winner, present your winning NFT tickets to claim your prize. 
          The claim period is open indefinitely.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Your Prize Amount</div>
            <div className="text-xl font-bold text-purple-600">
              {prizePerWinner.toFixed(4)} WLD
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Claim Status</div>
            <div className="text-xl font-bold text-orange-600">
              Not Claimed
            </div>
          </div>
        </div>

        <button
          onClick={handleClaimPrize}
          disabled={isClaimingPrize}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        >
          {isClaimingPrize ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying & Claiming...
            </>
          ) : (
            'Claim My Prize 🎉'
          )}
        </button>

        <div className="mt-4 text-xs text-purple-600">
          * You need to own winning NFT tickets to claim prizes
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📊 Raffle Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Pool</div>
            <div className="font-semibold">{raffle.totalPoolSize.toLocaleString()} WLD</div>
          </div>
          <div>
            <div className="text-gray-600">Participants</div>
            <div className="font-semibold">{raffle.currentParticipants.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Winners</div>
            <div className="font-semibold">{raffle.numWinners}</div>
          </div>
          <div>
            <div className="text-gray-600">Completed</div>
            <div className="font-semibold">{raffle.endDate.toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}