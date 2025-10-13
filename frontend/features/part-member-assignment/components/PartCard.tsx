'use client';

import { Card, CardContent } from '@/components/ui/layout/card';
import { Part } from '../types';

interface PartCardProps {
  part: Part;
  onClick: (part: Part) => void;
}

export function PartCard({ part, onClick }: PartCardProps) {
  const selectedCount = part.members.filter(member => member.isSelected).length;
  const totalCount = part.members.length;

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-blue-300 hover:border-blue-400"
      onClick={() => onClick(part)}
    >
      <CardContent className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {part.name}
        </h3>
        <p className="text-sm text-gray-600">
          {selectedCount}/{totalCount} 名選択中
        </p>
      </CardContent>
    </Card>
  );
}