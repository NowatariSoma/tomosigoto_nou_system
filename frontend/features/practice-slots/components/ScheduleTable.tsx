import * as React from 'react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIdealSchedule } from '../hooks';
import { IdealScheduleData } from '../types/schedule';

interface ScheduleTableProps {
  className?: string;
  currentDate: Date;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  currentDate
}) => {
  // 理想的な形式のスケジュール管理フック
  const { idealData, loading, error, fetchIdealScheduleByDate } = useIdealSchedule();

  // 日付が変更されたときにAPIからデータを取得
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    console.log('ScheduleTable - 日付変更:', dateString);
    fetchIdealScheduleByDate(dateString);
  }, [currentDate, fetchIdealScheduleByDate]);

  const handleCellClick = (time: string, venueId: string, parts: any[]) => {
    console.log('ScheduleTable - セルクリック:', { time, venueId, parts });
  };

  const handlePartClick = (e: React.MouseEvent, part: any) => {
    e.stopPropagation();
    console.log('パートクリック:', part);
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">スケジュール詳細を読み込み中...</div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  // データがない場合の表示
  if (!idealData) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">スケジュールデータがありません</div>
      </div>
    );
  }

  // 時間スロットを取得
  const timeSlots = Object.keys(idealData.time_schedule).sort();
  
  // デバッグ: 会場データを確認
  console.log('会場データ:', idealData.venues);
  console.log('会場の詳細:', idealData.venues.map(venue => ({ id: venue.id, name: venue.name, priority: venue.priority, color: venue.color })));

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      {/* テーブルヘッダー */}
      <div className="flex">
        <div className="w-24 px-4 py-3 bg-gray-900 text-sm font-semibold text-white border-r border-b border-gray-600 hover:bg-gray-800 transition-colors">時間</div>
        <div className="flex-1 bg-gray-900 py-3 px-4 flex border-b border-gray-600">
          {idealData.venues.map((venue) => (
            <div key={venue.id} className="flex-1 text-sm font-semibold text-white text-center hover:bg-gray-800 transition-colors">
              {venue.name || `会場${venue.id.slice(-4)}`}
            </div>
          ))}
        </div>
      </div>

      {/* テーブルボディ */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-gray-100">
                <td className="w-24 px-4 py-3 text-sm font-medium text-white bg-gray-900 align-top border-r border-gray-600 hover:bg-gray-800 transition-colors">
                  {time}
                </td>
                {idealData.venues.map((venue) => {
                  const parts = idealData.time_schedule[time]?.[venue.id] || [];
                  return (
                    <td
                      key={`${time}-${venue.id}`}
                      className={cn(
                        "px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top",
                        "cursor-pointer transition-colors bg-white",
                        parts.length > 0 ? "hover:bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => handleCellClick(time, venue.id, parts)}
                    >
                      {parts.length > 0 ? (
                        <div 
                          className="p-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all"
                          onClick={(e) => handlePartClick(e, parts[0])}
                        >
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {parts[0].part_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            🎭 {parts[0].instructors.length > 0 ? parts[0].instructors.join(', ') : '指導者未定'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-6">
                          空き
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 統計情報 - 目立たないデザイン */}
      <div className="px-4 py-2 bg-white border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>パート: {
              Object.values(idealData.time_schedule).reduce((total: number, timeSlot: any) => {
                return total + Object.values(timeSlot).reduce((venueTotal: number, parts: any) => venueTotal + parts.length, 0);
              }, 0)
            }</span>
            <span>指導者: {
              new Set(
                Object.values(idealData.time_schedule).flatMap((timeSlot: any) =>
                  Object.values(timeSlot).flatMap((parts: any) =>
                    parts.flatMap((part: any) => part.instructors)
                  )
                )
              ).size
            }</span>
            <span>稼働率: {
              idealData.venues.length > 0 ? Math.round((Object.values(idealData.time_schedule).reduce((total: number, timeSlot: any) => {
                return total + Object.values(timeSlot).filter((parts: any) => parts.length > 0).length;
              }, 0) / (Object.keys(idealData.time_schedule).length * idealData.venues.length)) * 100) : 0
            }%</span>
          </div>
          {idealData.debug_info && (
            <div className="text-gray-400">
              セッション: {idealData.debug_info.sessions_count}, 会場: {idealData.debug_info.venues_count}, 分割: {idealData.debug_info.division_count}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ScheduleTable.displayName = 'ScheduleTable';

export { ScheduleTable };