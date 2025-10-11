'use client';

import { useState } from 'react';
import { PartCard } from '@/features/part-member-assignment/components/PartCard';
import { MemberRegistrationModal } from '@/features/part-member-assignment/components/MemberRegistrationModal';
import { mockParts } from '@/features/part-member-assignment/data/mockData';
import { Part, Member } from '@/features/part-member-assignment/types';

export const PartMemberAssignmentPage = () => {
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
    <div className="space-y-6">
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
  );
}