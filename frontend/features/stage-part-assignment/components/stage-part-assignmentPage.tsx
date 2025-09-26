'use client';

import { useState } from 'react';
import { Performance } from '@/features/stage-part-assignment/types';
import { mockPerformances } from '@/features/stage-part-assignment/data/mockData';
import { PerformanceCard } from '@/features/stage-part-assignment/components/performance-card';
import { PartRegistrationModal } from '@/features/stage-part-assignment/components/part-registration-modal';

export const StagePartAssignmentPage = () => {
  const [performances] = useState<Performance[]>(mockPerformances);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePerformanceClick = (performance: Performance) => {
    setSelectedPerformance(performance);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerformance(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          パート登録
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performances.map((performance) => (
            <PerformanceCard
              key={performance.id}
              performance={performance}
              onClick={() => handlePerformanceClick(performance)}
            />
          ))}
        </div>

        <PartRegistrationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          performance={selectedPerformance}
        />
      </div>
    </div>
  );
}