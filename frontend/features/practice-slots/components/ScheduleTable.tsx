import * as React from 'react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIdealSchedule } from '../hooks';
import { IdealScheduleData } from '../types/schedule';
import { InstructorDisplay } from './InstructorDisplay';
import { formatDateToYYYYMMDD } from '@/shared/utils/format';

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

  /**
   * 時間文字列からslot_orderを計算する
   * バックエンドの_calculate_slot_time関数の逆算
   */
  const calculateSlotOrder = (timeStr: string, scheduleData: IdealScheduleData): number => {
    if (!scheduleData?.schedule_info) return 1;

    try {
      const startTime = new Date(`2000-01-01T${scheduleData.schedule_info.start_time}`);
      const endTime = new Date(`2000-01-01T${scheduleData.schedule_info.end_time}`);
      const targetTime = new Date(`2000-01-01T${timeStr}:00`);

      const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const timeSlots = Object.keys(scheduleData?.time_schedule || {}).length;
      const slotDuration = timeSlots > 0 ? totalMinutes / timeSlots : 60;
      
      const elapsedMinutes = (targetTime.getTime() - startTime.getTime()) / (1000 * 60);
      const slotOrder = Math.floor(elapsedMinutes / slotDuration) + 1;
      
      return Math.max(1, slotOrder);
    } catch (error) {
      console.warn('slot_orderの計算に失敗:', error);
      return 1;
    }
  };

  // 日付が変更されたときにAPIからデータを取得
  useEffect(() => {
    const dateString = formatDateToYYYYMMDD(currentDate);
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
  if (!idealData || !idealData.venues || !Array.isArray(idealData.venues)) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">スケジュールデータがありません</div>
      </div>
    );
  }

  // 時間スロットを取得
  const timeSlots = Object.keys(idealData?.time_schedule || {}).sort();
  
  // デバッグ: 会場データを確認
  console.log('会場データ:', idealData?.venues);
  console.log('会場の詳細:', idealData?.venues?.map(venue => ({ id: venue.id, name: venue.name, priority: venue.priority, color: venue.color })));
  
  // 重複するvenue.idをチェック
  const venueIds = idealData?.venues?.map(venue => venue?.id) || [];
  const uniqueVenueIds = Array.from(new Set(venueIds));
  if (venueIds.length !== uniqueVenueIds.length) {
    console.warn('重複するvenue.idが検出されました:', venueIds);
    console.warn('重複するID:', venueIds.filter((id, index) => venueIds.indexOf(id) !== index));
  }

  // 重複を除去した会場データを取得
  const uniqueVenues = idealData?.venues?.filter((venue, index, self) => 
    index === self.findIndex(v => v?.id === venue?.id)
  ) || [];

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      {/* テーブルヘッダー */}
      <div className="flex">
        <div className="w-24 px-4 py-3 bg-gray-900 text-sm font-semibold text-white border-r border-b border-gray-600 hover:bg-gray-800 transition-colors">時間</div>
        <div className="flex-1 bg-gray-900 py-3 px-4 flex border-b border-gray-600">
          {uniqueVenues.map((venue) => (
            <div key={venue?.id || 'unknown'} className="flex-1 text-sm font-semibold text-white text-center hover:bg-gray-800 transition-colors">
              {venue?.name || `会場${venue?.id?.slice(-4) || 'unknown'}`}
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
                {uniqueVenues.map((venue) => {
                  const parts = idealData.time_schedule?.[time]?.[venue?.id] || [];
                  return (
                    <td
                      key={`${time}-${venue?.id || 'unknown'}`}
                      className={cn(
                        "px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top",
                        "cursor-pointer transition-colors bg-white",
                        parts.length > 0 ? "hover:bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => handleCellClick(time, venue?.id || '', parts)}
                    >
                      {parts.length > 0 ? (
                        <div
                          className="p-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all"
                          onClick={(e) => handlePartClick(e, parts[0])}
                        >
                          {/* セッションタイトル */}
                          {parts[0].session_title && (
                            <div className="text-xs font-semibold text-blue-700 mb-1">
                              {parts[0].session_title}
                            </div>
                          )}
                          {/* パート名 */}
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {parts[0].part_name}
                          </div>
                          <InstructorDisplay
                            scheduleId={idealData?.schedule_info?.id || ''}
                            slotOrder={parts[0].slot_order || calculateSlotOrder(time, idealData)}
                            fallbackInstructors={parts[0].instructors}
                            maxDisplay={2}
                          />
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
    </div>
  );
};

ScheduleTable.displayName = 'ScheduleTable';

export { ScheduleTable };