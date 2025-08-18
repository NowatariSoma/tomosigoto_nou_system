import * as React from 'react';
import { cn } from '@/lib/utils';
import { InformationProps } from '@/features/practice-slots/types/schedule';

const Information: React.FC<InformationProps> = ({ 
  className,
  currentDate = new Date()
}) => {
  // 日付をフォーマットする関数
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 曜日を取得する関数
  const getWeekday = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg p-6 mt-6", className)}>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        正規練習 {formatDate(currentDate)}（{getWeekday(currentDate)}）
      </h2>
      
      <div className="space-y-3 text-sm text-gray-600 max-w-4xl mx-auto">
        <p className="leading-relaxed">
          <span className="font-medium">大会：</span>
          川端康成記念 ◯◯パート：◯◯練習ミーティング　要記録パート：◯◯指導、去川◯◯優勝パート：◯◯平泳ぎ◯◯キック　要記録パート：◯◯指導、山東◯◯　
          ◯◯練習営業
        </p>
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 mb-2">今日の練習:</h3>
          <ul className="space-y-1 text-xs">
            <li>・4/30,5/3,7月-◯◯競泳ことばかりをやり切り◯◯開始山口の練習</li>
            <li>・6/8こう◯◯日～◯◯練習◯◯要塞と◯◯こと◯◯開始山口の練習</li>
            <li>・◯◯DG各種時間を2交代制の山口の、設備、◯◯練習</li>
            <li>・山口7-◯◯練習◯◯パート　◯◯春～◯◯練習記録◯◯パート　◯◯-◯◯練習パート　◯◯未定を◯◯練習を進めてください</li>
            <li>・◯◯練習の練習の記録「◯◯上場」を◯◯そう◯◯練習の山口先を◯◯春てください</li>
            <li>・◯◯練習山口指導◯◯の練習、◯◯フリップ◯◯サブハーション◯◯フリップ、◯◯こう</li>
            <li className="text-red-600">
              ◯◯◯◯サブ→◯◯春→◯◯練習そうそう→◯◯こう◯◯フリップ練習◯◯に◯◯こう◯◯練習営業です。◯◯てください
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

Information.displayName = 'Information';

export { Information };