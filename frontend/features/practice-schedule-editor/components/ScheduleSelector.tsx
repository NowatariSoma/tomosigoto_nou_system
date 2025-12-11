'use client';

import React, { useState, useEffect } from 'react';
import { PracticeSchedule } from '../../practice-schedule/types';
import { usePracticeSchedules } from '../../practice-schedule/hooks/use-practice-schedules';
import { UI_TEXT } from '../constants';
import { Calendar, Search, ChevronRight, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

interface ScheduleSelectorProps {
  onScheduleSelect: (scheduleId: string, scheduleDate: string) => void;
}

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ onScheduleSelect }) => {
  const { schedules, loading, error } = usePracticeSchedules();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');

  // フィルタリングされたスケジュール
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.venueName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = selectedDate === 'all' || schedule.date === selectedDate;
    
    return matchesSearch && matchesDate;
  });

  // 日付の一覧を取得（重複を除く）
  const availableDates = Array.from(new Set(schedules.map(s => s.date))).sort();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleScheduleClick = (schedule: PracticeSchedule) => {
    onScheduleSelect(schedule.id, schedule.date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        エラー: {error}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-black mx-auto mb-4" />
        <div className="text-black text-lg mb-2">
          練習予定がありません
        </div>
        <p className="text-black text-sm">
          まず練習予定を作成してから編集してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-black">練習表編集</h1>
        <p className="text-black mt-1">
          編集する練習予定を選択してください
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-blue-50 rounded-lg shadow-md border border-blue-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 検索 */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-black mb-2">
              <Search className="h-4 w-4" />
              <span>検索</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="タイトル、説明、会場名で検索..."
              className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 日付フィルター */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-black mb-2">
              <Calendar className="h-4 w-4" />
              <span>日付で絞り込み</span>
            </label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
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

      {/* スケジュール一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">
            練習予定一覧 ({filteredSchedules.length}件)
          </h2>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-black text-lg mb-2">
              条件に一致する練習予定がありません
            </div>
            <p className="text-black text-sm">
              検索条件を変更してお試しください
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => handleScheduleClick(schedule)}
                className="bg-blue-50 rounded-lg shadow-md border border-blue-200 p-6 hover:shadow-lg hover:bg-blue-100/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-black" />
                      <h3 className="text-lg font-semibold text-black">
                        {schedule.title || '無題の練習予定'}
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm text-black">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-black" />
                        <span>{formatDate(schedule.date)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-black" />
                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-black" />
                        <span>{schedule.venueName} ({schedule.campus}キャンパス)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <ChevronRight className="h-5 w-5 text-black transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
