import { Raffle } from '@/types/raffle';

interface RaffleCardProps {
  raffle: Raffle;
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const getStatusColor = (status: Raffle['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'drawing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusEmoji = (status: Raffle['status']) => {
    switch (status) {
      case 'active': return '🟢';
      case 'upcoming': return '🔵';
      case 'drawing': return '🎯';
      case 'completed': return '✅';
      default: return '⚪';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const progressPercentage = Math.min(
    (raffle.currentParticipants / raffle.minParticipants) * 100,
    100
  );

  const topBeneficiary = raffle.beneficiaries.reduce((prev, current) => 
    prev.votes > current.votes ? prev : current
  );

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(raffle.status)}`}>
            {getStatusEmoji(raffle.status)} {raffle.status.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {raffle.status === 'active' || raffle.status === 'upcoming' 
              ? formatTimeRemaining(raffle.endDate)
              : raffle.status === 'completed' ? 'Completed' : 'Drawing'
            }
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {raffle.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {raffle.description}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Prize Pool</span>
            <span className="font-semibold text-purple-600">
              {raffle.totalPoolSize.toLocaleString()} WLD
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ticket Price</span>
            <span className="font-medium">{raffle.ticketPrice} WLD</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Winners</span>
            <span className="font-medium">{raffle.numWinners}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Participants</span>
            <span className="font-medium">
              {raffle.currentParticipants.toLocaleString()} / {raffle.minParticipants}
            </span>
          </div>
        </div>

        {(raffle.status === 'active' || raffle.status === 'upcoming') && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress to minimum</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {raffle.beneficiaries.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-600 mb-2">
              {raffle.beneficiarySharePercentage}% goes to:
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-green-600">
                {raffle.beneficiaries.length === 1 
                  ? raffle.beneficiaries[0].name
                  : `${topBeneficiary.name} (leading)`
                }
              </span>
              {raffle.beneficiaries.length > 1 && (
                <span className="ml-2 text-xs text-gray-500">
                  {topBeneficiary.votes} votes
                </span>
              )}
            </div>
          </div>
        )}

        <a 
          href={`/raffle/${raffle.id}`}
          className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
        >
          {raffle.status === 'active' ? '🎟️ Buy Tickets' :
           raffle.status === 'upcoming' ? '🔔 Notify Me' :
           raffle.status === 'drawing' ? '⏳ Drawing...' :
           '👑 View Results'}
        </a>
      </div>
    </div>
  );
}