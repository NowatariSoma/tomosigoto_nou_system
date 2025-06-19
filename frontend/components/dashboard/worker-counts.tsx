'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { WorkerCount } from '@/types/worker';
import { HardHat, Users } from 'lucide-react';

interface WorkerCountsProps {
  counts: WorkerCount;
  isLoading: boolean;
}

export function WorkerCounts({ counts, isLoading }: WorkerCountsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const helmetTypes = [
    { key: 'red', label: '赤ヘルメット', count: counts.red, color: 'bg-red-500' },
    { key: 'other', label: 'その他ヘルメット', count: counts.other, color: 'bg-gray-400' },
    { key: 'no_helmet', label: '未装着', count: counts.no_helmet, color: 'bg-yellow-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {helmetTypes.map((helmet) => (
        <Card key={helmet.key} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${helmet.color}`}></div>
              {helmet.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <HardHat className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{helmet.count}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">総作業員数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 opacity-90" />
            <span className="text-2xl font-bold">{counts.total}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}