'use client';

import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';
import { Input } from '@/components/ui/inputs/input';

interface ScheduleSearchFilterProps {
  searchTerm: string;
  selectedDate: string;
  availableDates: string[];
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export const ScheduleSearchFilter: React.FC<ScheduleSearchFilterProps> = ({
  searchTerm,
  selectedDate,
  availableDates,
  onSearchChange,
  onDateChange,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <div className="card-blue shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 検索 */}
        <div>
          <label className="flex items-center space-x-2 label-form mb-2">
            <Search className="h-4 w-4" />
            <span>検索</span>
          </label>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タイトル、説明、会場名で検索..."
          />
        </div>

        {/* 日付フィルター */}
        <div>
          <label className="flex items-center space-x-2 label-form mb-2">
            <Calendar className="h-4 w-4" />
            <span>日付で絞り込み</span>
          </label>
          <Select value={selectedDate} onValueChange={onDateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべての日付" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての日付</SelectItem>
              {availableDates.map(date => (
                <SelectItem key={date} value={date}>
                  {formatDate(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
