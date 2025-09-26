'use client';

import { Performance } from '../types';
import { Card, CardContent } from '@/components/ui/layout/card';

interface PerformanceCardProps {
  performance: Performance;
  onClick: () => void;
} 

export function PerformanceCard({ performance, onClick }: PerformanceCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 border-blue-200 bg-white"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {performance.name}
        </h3>
        <div className="space-y-1">
          {performance.parts.map((part, index) => (
            <div key={index} className="text-gray-600 text-sm">
              {part}
            </div>
          ))}
          <div className="text-gray-400 text-sm mt-2">
            ・・・
          </div>
        </div>
      </CardContent>
    </Card>
  );
}