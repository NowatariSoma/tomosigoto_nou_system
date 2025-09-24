'use client';

import { useState } from 'react';
import { PartCard } from '@/components/PartCard';
import { MemberRegistrationModal } from '@/components/MemberRegistrationModal';
import { mockParts } from '@/data/mockData';
import { Part, Member } from '@/types';

export default function Home() {
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePartClick = (part: Part) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPart(null);
  };

  const handleConfirm = (partId: number, selectedMembers: Member[]) => {
    setParts(prevParts =>
      prevParts.map(part =>
        part.id === partId
          ? {
              ...part,
              members: part.members.map(member => ({
                ...member,
                isSelected: selectedMembers.some(selected => selected.id === member.id)
              }))
            }
          : part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">メンバー選択</h1>
          <h2 className="text-xl text-gray-700">2025EVE祭</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {parts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onClick={handlePartClick}
            />
          ))}
        </div>

        <MemberRegistrationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedPart={selectedPart}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}