export interface Raffle {
  id: string;
  title: string;
  description: string;
  operator: string;
  operatorId: string;
  ticketPrice: number; // in WLD
  maxEntriesPerUser: number;
  numWinners: number;
  winnerSharePercentage: number;
  beneficiarySharePercentage: number;
  beneficiaries: Beneficiary[];
  startDate: Date;
  endDate: Date;
  minParticipants: number;
  currentParticipants: number;
  totalPoolSize: number;
  status: 'upcoming' | 'active' | 'drawing' | 'completed' | 'cancelled';
  winners?: Winner[];
  selectedBeneficiary?: string;
  createdAt: Date;
}

export interface Beneficiary {
  id: string;
  name: string;
  walletAddress: string;
  description: string;
  votes: number;
}

export interface Winner {
  id: string;
  walletAddress: string;
  username: string;
  prizeAmount: number;
  claimed: boolean;
}

export interface RaffleTicket {
  id: string;
  raffleId: string;
  ownerAddress: string;
  ownerUsername: string;
  votedBeneficiary: string;
  mintedAt: Date;
  nftTokenId?: string;
}

export interface CreateRaffleRequest {
  title: string;
  description: string;
  ticketPrice: number;
  maxEntriesPerUser: number;
  numWinners: number;
  winnerSharePercentage: number;
  beneficiarySharePercentage: number;
  beneficiaries: Omit<Beneficiary, 'id' | 'votes'>[];
  durationDays: number;
}