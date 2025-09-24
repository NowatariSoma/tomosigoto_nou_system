import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateNavigationProps } from '@/features/practice-slots/types/schedule';

const DateButton: React.FC<DateNavigationProps> = ({ 
  currentDate,
  onDateChange,
  onNextPractice
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

  const formattedDateText = formatDate(currentDate);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center gap-12">
        <button
          onClick={() => onNextPractice ? onNextPractice('prev') : onDateChange('prev')}
          className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
          aria-label="前の練習日"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <div 
          className="px-8 py-3 bg-gray-100 rounded-lg text-white font-bold text-xl shadow-sm min-w-[240px] text-center border border-gray-300"
        >
          {formattedDateText}
        </div>
        
        <button
          onClick={() => onNextPractice ? onNextPractice('next') : onDateChange('next')}
          className="p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
          aria-label="次の練習日"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

DateButton.displayName = 'DateButton';

export { DateButton };