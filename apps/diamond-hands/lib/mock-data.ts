import { Raffle, Beneficiary } from '@/types/raffle';

const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'red-cross',
    name: 'Red Cross',
    walletAddress: '0x1234567890123456789012345678901234567890',
    description: 'International humanitarian organization',
    votes: 0
  },
  {
    id: 'oxfam',
    name: 'Oxfam',
    walletAddress: '0x2345678901234567890123456789012345678901',
    description: 'Global organization fighting inequality',
    votes: 0
  },
  {
    id: 'unicef',
    name: 'UNICEF',
    walletAddress: '0x3456789012345678901234567890123456789012',
    description: "Children's rights and emergency relief",
    votes: 0
  }
];

export const mockRaffles: Raffle[] = [
  {
    id: 'raffle-1',
    title: 'Global Charity Mega Raffle',
    description: 'A massive raffle to support global humanitarian efforts. 10 winners will share 90% of the prize pool!',
    operator: 'RaffleTime Foundation',
    operatorId: '0xoperator1',
    ticketPrice: 1,
    maxEntriesPerUser: 10,
    numWinners: 10,
    winnerSharePercentage: 90,
    beneficiarySharePercentage: 10,
    beneficiaries: mockBeneficiaries.map(b => ({ ...b, votes: Math.floor(Math.random() * 100) })),
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    minParticipants: 101,
    currentParticipants: 8542,
    totalPoolSize: 10000,
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'raffle-2',
    title: 'Quick Draw Weekend Special',
    description: 'Fast-paced weekend raffle with 5 lucky winners. Support education worldwide!',
    operator: 'Weekend Warriors',
    operatorId: '0xoperator2',
    ticketPrice: 0.5,
    maxEntriesPerUser: 5,
    numWinners: 5,
    winnerSharePercentage: 85,
    beneficiarySharePercentage: 15,
    beneficiaries: [mockBeneficiaries[2]], // Only UNICEF
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    minParticipants: 26,
    currentParticipants: 234,
    totalPoolSize: 350,
    status: 'active',
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'raffle-3',
    title: 'Disaster Relief Fund Raffle',
    description: 'All proceeds go to disaster relief efforts. 3 winners share 70% of the pool.',
    operator: 'Crisis Response Team',
    operatorId: '0xoperator3',
    ticketPrice: 2,
    maxEntriesPerUser: 3,
    numWinners: 3,
    winnerSharePercentage: 70,
    beneficiarySharePercentage: 30,
    beneficiaries: [mockBeneficiaries[0]], // Only Red Cross
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Starts tomorrow
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    minParticipants: 10,
    currentParticipants: 0,
    totalPoolSize: 0,
    status: 'upcoming',
    createdAt: new Date()
  },
  {
    id: 'raffle-4',
    title: 'Community Champions Raffle',
    description: 'Celebrating community heroes! 20 winners will be selected from this massive pool.',
    operator: 'Community Foundation',
    operatorId: '0xoperator4',
    ticketPrice: 0.1,
    maxEntriesPerUser: 50,
    numWinners: 20,
    winnerSharePercentage: 95,
    beneficiarySharePercentage: 5,
    beneficiaries: mockBeneficiaries.map(b => ({ ...b, votes: Math.floor(Math.random() * 500) })),
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended yesterday
    minParticipants: 1001,
    currentParticipants: 15678,
    totalPoolSize: 25000,
    status: 'drawing',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'raffle-5',
    title: 'New Year Resolution Raffle',
    description: 'Start the year right by supporting good causes. 1 big winner takes it all!',
    operator: 'New Beginnings Org',
    operatorId: '0xoperator5',
    ticketPrice: 5,
    maxEntriesPerUser: 2,
    numWinners: 1,
    winnerSharePercentage: 50,
    beneficiarySharePercentage: 50,
    beneficiaries: mockBeneficiaries.slice(0, 2),
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    minParticipants: 3,
    currentParticipants: 456,
    totalPoolSize: 1200,
    status: 'completed',
    winners: [
      {
        id: 'winner-1',
        walletAddress: '0xwinner1234567890123456789012345678901234',
        username: 'lucky.winner',
        prizeAmount: 600,
        claimed: true
      }
    ],
    selectedBeneficiary: 'oxfam',
    createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000)
  }
];

export function getRaffleById(id: string): Raffle | undefined {
  return mockRaffles.find(raffle => raffle.id === id);
}

export function getRafflesByStatus(status: Raffle['status']): Raffle[] {
  return mockRaffles.filter(raffle => raffle.status === status);
}

export function getActiveRaffles(): Raffle[] {
  return mockRaffles.filter(raffle => raffle.status === 'active');
}

export function getUpcomingRaffles(): Raffle[] {
  return mockRaffles.filter(raffle => raffle.status === 'upcoming');
}