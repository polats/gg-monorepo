"use client";
import { useState } from 'react';
import { CreateRaffleRequest } from '@/types/raffle';

interface CreateRaffleFormData {
  title: string;
  description: string;
  ticketPrice: string;
  maxEntriesPerUser: string;
  numWinners: string;
  winnerSharePercentage: string;
  durationDays: string;
  beneficiaries: Array<{
    name: string;
    walletAddress: string;
    description: string;
  }>;
}

export function CreateRaffleForm() {
  const [formData, setFormData] = useState<CreateRaffleFormData>({
    title: '',
    description: '',
    ticketPrice: '1',
    maxEntriesPerUser: '10',
    numWinners: '1',
    winnerSharePercentage: '90',
    durationDays: '7',
    beneficiaries: [
      { name: '', walletAddress: '', description: '' }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const beneficiarySharePercentage = 100 - parseInt(formData.winnerSharePercentage || '0');

  const addBeneficiary = () => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { name: '', walletAddress: '', description: '' }]
    }));
  };

  const removeBeneficiary = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter((_, i) => i !== index)
    }));
  };

  const updateBeneficiary = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((ben, i) => 
        i === index ? { ...ben, [field]: value } : ben
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData: CreateRaffleRequest = {
        title: formData.title,
        description: formData.description,
        ticketPrice: parseFloat(formData.ticketPrice),
        maxEntriesPerUser: parseInt(formData.maxEntriesPerUser),
        numWinners: parseInt(formData.numWinners),
        winnerSharePercentage: parseInt(formData.winnerSharePercentage),
        beneficiarySharePercentage,
        beneficiaries: formData.beneficiaries.filter(b => b.name && b.walletAddress),
        durationDays: parseInt(formData.durationDays)
      };

      console.log('Creating raffle:', requestData);
      
      // Here you would call your API
      // await createRaffle(requestData);
      
      alert('Raffle created successfully! (Mock implementation)');
      
    } catch (error) {
      console.error('Error creating raffle:', error);
      alert('Error creating raffle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raffle Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter a catchy title for your raffle"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe your raffle and what makes it special"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price (WLD) *
            </label>
            <input
              type="number"
              required
              min="0.0001"
              max="1000"
              step="0.0001"
              value={formData.ticketPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, ticketPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Entries Per User *
            </label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={formData.maxEntriesPerUser}
              onChange={(e) => setFormData(prev => ({ ...prev, maxEntriesPerUser: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Winners *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.numWinners}
              onChange={(e) => setFormData(prev => ({ ...prev, numWinners: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Winner Share (%) *
            </label>
            <input
              type="number"
              required
              min="0"
              max="100"
              value={formData.winnerSharePercentage}
              onChange={(e) => setFormData(prev => ({ ...prev, winnerSharePercentage: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Beneficiaries will receive {beneficiarySharePercentage}%
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (Days) *
            </label>
            <input
              type="number"
              required
              min="1"
              max="365"
              value={formData.durationDays}
              onChange={(e) => setFormData(prev => ({ ...prev, durationDays: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Beneficiary Organizations
            </h3>
            <button
              type="button"
              onClick={addBeneficiary}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              + Add Beneficiary
            </button>
          </div>

          {formData.beneficiaries.map((beneficiary, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">
                  Beneficiary #{index + 1}
                </h4>
                {formData.beneficiaries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={beneficiary.name}
                    onChange={(e) => updateBeneficiary(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Red Cross"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={beneficiary.walletAddress}
                    onChange={(e) => updateBeneficiary(index, 'walletAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0x..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={beneficiary.description}
                    onChange={(e) => updateBeneficiary(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of the organization"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Raffle Requirements</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Requires 10 WLD deposit (5 WLD refunded, 5 WLD to protocol)</li>
            <li>• Minimum participants: {parseInt(formData.numWinners || '1') * parseInt(formData.maxEntriesPerUser || '1') + 1}</li>
            <li>• Ticket price must be between 0.0001 and 1000 WLD</li>
            <li>• All participants must verify with WorldID</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Raffle (10 WLD)'}
          </button>
        </div>
      </form>
    </div>
  );
}