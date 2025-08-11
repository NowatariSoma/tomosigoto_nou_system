import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateNavigationProps } from '@/types/schedule';

const DateButton: React.FC<DateNavigationProps> = ({ 
  currentDate,
  onDateChange
}) => {
  // 日付をフォーマットする関数
  const formatDate = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return `${month}${day}日（${weekday}）`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={() => onDateChange('prev')}
          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6 text-blue-600" />
        </button>
        
        <div className="mx-8 px-12 py-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full text-white font-medium text-lg shadow-md">
          {formatDate(currentDate)}
        </div>
        
        <button
          onClick={() => onDateChange('next')}
          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
        >
          <ChevronRight className="w-6 h-6 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

DateButton.displayName = 'DateButton';

export { DateButton };