/**
 * カレンダーテストページ
 * 実装したカレンダーコンポーネントの動作確認用
 */

'use client';

import React from 'react';
import { CalendarView } from '@/src/features/schedule/views/CalendarView';

export default function CalendarTestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">カレンダーテストページ</h1>
        <p className="text-gray-600">
          月間・週間カレンダービューの動作確認を行います。
        </p>
      </div>
      
      <CalendarView
        initialDate={new Date()}
        initialViewMode="month"
        className="max-w-6xl mx-auto"
      />
    </div>
  );
}