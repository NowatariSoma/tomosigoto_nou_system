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

  // APIデータがない場合のフォールバック用モックデータ
  const mockData: IdealScheduleData = {
    "schedule_info": {
      "id": "0471df8a-950a-459b-ab12-f31e000cbb3f",
      "schedule_date": "2024-05-26",
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "description": "定期公演「高砂」総練習"
    },
    "venues": [
      {
        "id": "venue-1",
        "name": "今出川キャンパス 良心館ｄ",
        "priority": 1,
        "color": "#FF6B6B"
      },
      {
        "id": "venue-2", 
        "name": "今出川キャンパス 至誠館",
        "priority": 2,
        "color": "#4ECDC4"
      }
    ],
    "time_schedule": {
      "09:00": {
        "venue-1": [
          {
            "part_id": "part-1",
            "part_name": "前シテパート",
            "part_color": "#FFD700",
            "session_title": "前シテ（老翁）個人練習",
            "instructors": ["山田太郎"],
            "participants": 5,
            "status": "confirmed"
          }
        ],
        "venue-2": [
          {
            "part_id": "part-2",
            "part_name": "地謡パート", 
            "part_color": "#87CEEB",
            "session_title": "地謡基礎練習",
            "instructors": ["鈴木花子"],
            "participants": 8,
            "status": "confirmed"
          }
        ]
      },
      "09:30": {
        "venue-1": [
          {
            "part_id": "part-3",
            "part_name": "後シテパート",
            "part_color": "#98FB98", 
            "session_title": "後シテ（住吉明神）個人練習",
            "instructors": ["田中次郎"],
            "participants": 3,
            "status": "confirmed"
          }
        ],
        "venue-2": [
          {
            "part_id": "part-2",
            "part_name": "地謡パート",
            "part_color": "#87CEEB",
            "session_title": "地謡合わせ",
            "instructors": ["鈴木花子", "佐藤三郎"],
            "participants": 12,
            "status": "confirmed"
          }
        ]
      },
      "10:00": {
        "venue-1": [],
        "venue-2": [
          {
            "part_id": "part-4",
            "part_name": "囃子パート",
            "part_color": "#DDA0DD",
            "session_title": "囃子練習",
            "instructors": ["高橋四郎"],
            "participants": 6,
            "status": "confirmed"
          }
        ]
      },
      "10:30": {
        "venue-1": [],
        "venue-2": []
      },
      "11:00": {
        "venue-1": [],
        "venue-2": []
      }
    }
  };

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
        <div className="text-sm text-gray-500 mt-2">モックデータで表示します</div>
      </div>
    );
  }

  // 表示用データ（APIデータまたはモックデータ）
  const displayData = idealData || mockData;

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      {/* スケジュール情報表示 */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">
          {displayData.schedule_info.schedule_date} の練習スケジュール
        </h3>
        <p className="text-sm text-gray-600">
          {displayData.schedule_info.start_time.substring(0, 5)} - {displayData.schedule_info.end_time.substring(0, 5)}
          {displayData.schedule_info.description && ` | ${displayData.schedule_info.description}`}
        </p>
        <p className="text-xs text-gray-500">
          会場数: {displayData.venues.length} | 
          時間スロット: {Object.keys(displayData.time_schedule).length}コマ
          {idealData ? ' (APIデータ)' : ' (モックデータ)'}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium text-gray-800 border-r border-gray-300 w-20">
                時間
              </th>
              {displayData.venues.map((venue) => (
                <th key={venue.id} className="px-4 py-3 text-center font-medium border-r border-gray-300 text-gray-800">
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: venue.color }}
                    ></div>
                    <span>{venue.name}</span>
                    {venue.priority === 1 && <span className="text-xs">⭐</span>}
                  </div>
                  <div className="text-xs text-gray-500 font-normal">
                    優先度: {venue.priority}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(displayData.time_schedule).map(([time, venueSchedule]) => (
              <tr
                key={time}
                className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-150"
              >
                <td className="px-4 py-4 font-bold text-gray-800 bg-gray-100 border-r border-gray-300 text-center">
                  <div className="text-sm">{time}</div>
                </td>
                {displayData.venues.map((venue) => {
                  const parts = venueSchedule[venue.id] || [];
                  return (
                    <td
                      key={venue.id}
                      className={cn(
                        "px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top",
                        "cursor-pointer transition-colors",
                        parts.length > 0 ? "bg-blue-25" : "hover:bg-blue-50"
                      )}
                      onClick={() => handleCellClick(time, venue.id, parts)}
                    >
                      {parts.length > 0 ? (
                        <div className="space-y-1">
                          {parts.map((part, partIndex) => (
                            <div 
                              key={`${part.part_id}-${partIndex}`}
                              className="rounded-lg p-3 shadow-sm border border-opacity-30 cursor-pointer hover:shadow-md transition-shadow"
                              style={{ 
                                backgroundColor: part.part_color,
                                borderColor: part.part_color 
                              }}
                              onClick={(e) => handlePartClick(e, part)}
                            >
                              <div className="font-bold text-sm text-gray-800 leading-tight mb-1">
                                {part.part_name}
                              </div>
                              <div className="text-xs text-gray-700">
                                👨‍🏫 {part.instructors.join(', ')}
                              </div>
                            </div>
                          ))}
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
      
      {/* 統計情報 */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">総パート数:</span> {
              Object.values(displayData.time_schedule).reduce((total, timeSlot) => {
                return total + Object.values(timeSlot).reduce((venueTotal, parts) => venueTotal + parts.length, 0);
              }, 0)
            }件
          </div>
          <div>
            <span className="font-medium">総監督者数:</span> {
              new Set(
                Object.values(displayData.time_schedule).flatMap(timeSlot =>
                  Object.values(timeSlot).flatMap(parts =>
                    parts.flatMap(part => part.instructors)
                  )
                )
              ).size
            }名
          </div>
          <div>
            <span className="font-medium">会場稼働率:</span> {
              Math.round((Object.values(displayData.time_schedule).reduce((total, timeSlot) => {
                return total + Object.values(timeSlot).filter(parts => parts.length > 0).length;
              }, 0) / (Object.keys(displayData.time_schedule).length * displayData.venues.length)) * 100)
            }%
          </div>
        </div>
      </div>
    </div>
  );
};

ScheduleTable.displayName = 'ScheduleTable';

export { ScheduleTable };