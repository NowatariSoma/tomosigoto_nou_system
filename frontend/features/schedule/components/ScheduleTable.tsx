import * as React from 'react';
import { cn } from '@/lib/utils';
import { IdealScheduleData } from '../types/practice-schedule-types';
import { InstructorDisplay } from './InstructorDisplay';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/data-display/table';

interface ScheduleTableProps {
  className?: string;
  currentDate: Date;
  idealData?: IdealScheduleData | null;
  loading?: boolean;
  error?: string | null;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  className,
  currentDate,
  idealData = null,
  loading = false,
  error = null
}) => {

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

  const handleCellClick = (time: string, venueId: string, parts: any[]) => {
    // セルクリック時の処理（将来の機能拡張用）
  };

  const handlePartClick = (e: React.MouseEvent, part: any) => {
    e.stopPropagation();
    // パートクリック時の処理（将来の機能拡張用）
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <div className={cn("bg-blue-50 rounded-lg shadow-lg p-8 text-center border border-blue-100", className)}>
        <div className="text-gray-500">スケジュール詳細を読み込み中...</div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={cn("bg-blue-50 rounded-lg shadow-lg p-8 text-center border border-blue-100", className)}>
        <div className="text-gray-600">エラー: {error}</div>
      </div>
    );
  }

  // データがない場合の表示
  if (!idealData || !idealData.venues || !Array.isArray(idealData.venues)) {
    return (
      <div className={cn("bg-blue-50 rounded-lg shadow-lg p-8 text-center border border-blue-100", className)}>
        <div className="text-gray-500">スケジュールデータがありません</div>
      </div>
    );
  }

  // 時間スロットを取得
  const timeSlots = Object.keys(idealData?.time_schedule || {}).sort();

  // 重複を除去した会場データを取得
  const uniqueVenues = idealData?.venues?.filter((venue, index, self) =>
    index === self.findIndex(v => v?.id === venue?.id)
  ) || [];

  return (
    <div className={cn("bg-blue-50 rounded-lg shadow-lg overflow-hidden border border-blue-200", className)}>
      {/* テーブルヘッダー */}
      <div className="flex">
        <div className="w-24 px-4 py-3 bg-blue-100 text-sm font-semibold text-black border-r border-b border-blue-200">時間</div>
        <div className="flex-1 bg-blue-100 py-3 px-4 flex border-b border-blue-200">
          {uniqueVenues.map((venue) => (
            <div key={venue?.id || 'unknown'} className="flex-1 text-sm font-semibold text-black text-center">
              {venue?.name || `会場${venue?.id?.slice(-4) || 'unknown'}`}
            </div>
          ))}
        </div>
      </div>

      {/* テーブルボディ */}
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableBody>
            {timeSlots.map((time) => (
              <TableRow key={time} className="border-b border-gray-100">
                <TableCell className="w-24 px-4 py-3 text-sm font-medium text-black bg-blue-100 align-top border-r border-blue-200">
                  {time}
                </TableCell>
                {uniqueVenues.map((venue) => {
                  const parts = idealData.time_schedule?.[time]?.[venue?.id] || [];
                  return (
                    <TableCell
                      key={`${time}-${venue?.id || 'unknown'}`}
                      className={cn(
                        "px-2 py-2 border-r border-blue-200 last:border-r-0 min-h-[80px] align-top",
                        "cursor-pointer transition-colors bg-blue-50",
                        parts.length > 0 ? "hover:bg-blue-100" : "hover:bg-blue-100/50"
                      )}
                      onClick={() => handleCellClick(time, venue?.id || '', parts)}
                    >
                      {parts.length > 0 ? (
                        <div
                          className="p-2 bg-white border border-blue-200 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                          onClick={(e) => handlePartClick(e, parts[0])}
                        >
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
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

ScheduleTable.displayName = 'ScheduleTable';

export { ScheduleTable };