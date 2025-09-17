import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePracticeScheduleDetails } from '../hooks';
import { PracticeScheduleDisplayResponse } from '../types/schedule';
import { PracticeScheduleService } from '../services';

interface ScheduleTableProps {
  className?: string;
  currentDate: Date;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  currentDate
}) => {
  // 練習スケジュール詳細管理フック
  const { detailsData, loading, error, fetchPracticeScheduleDetailsByDate } = usePracticeScheduleDetails();
  
  // 表示用データ（会場名付き）の状態管理
  const [displayData, setDisplayData] = useState<PracticeScheduleDisplayResponse | null>(null);
  const [displayLoading, setDisplayLoading] = useState(false);

  // 日付が変更されたときにスケジュール詳細データを取得
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    console.log('ScheduleTable - 日付変更:', dateString);
    
    // 詳細データと表示用データを並行取得
    fetchPracticeScheduleDetailsByDate(dateString);
    
    // 表示用データ（会場名付き）も取得
    const fetchDisplayData = async () => {
      setDisplayLoading(true);
      try {
        const data = await PracticeScheduleService.getPracticeScheduleDisplayByDate(dateString);
        setDisplayData(data);
      } catch (err) {
        console.error('Error fetching display data:', err);
      } finally {
        setDisplayLoading(false);
      }
    };
    
    fetchDisplayData();
  }, [currentDate, fetchPracticeScheduleDetailsByDate]);

  // ランダムな色を生成する関数
  const generateRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // APIデータから表示用データを生成
  const generateScheduleData = () => {
    if (!detailsData || !detailsData.sessions) return [];
    
    return detailsData.sessions.map(session => ({
      time: session.start_time.substring(0, 5), // HH:MM形式
      duration: `${session.start_time.substring(0, 5)} - ${session.end_time.substring(0, 5)}`,
      activity: session.title
    }));
  };

  // APIデータから会場データを生成
  const generateVenueData = () => {
    if (!displayData || !displayData.available_venues) return [];
    
    return displayData.available_venues
      .sort((a, b) => a.priority - b.priority)
      .map(venue => ({
        id: venue.id,
        display_name: venue.name, // 実際の会場名を使用
        color: generateRandomColor()
      }));
  };

  const scheduleData = generateScheduleData();
  const venueGroups = generateVenueData();

  const formatCellContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="text-xs leading-tight">
        {line}
      </div>
    ));
  };

  const handleCellClick = (time: string, venueId: string, venueName: string, color: string) => {
    console.log('ScheduleTable - セルクリック:', { time, venueId, venueName, color, detailsData });
  };

  // ローディング状態の表示
  if (loading || displayLoading) {
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

  // データなしの場合
  if (!detailsData || !displayData || scheduleData.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">この日のスケジュールはありません</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      {/* スケジュール情報表示 */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">
          {detailsData.schedule_date} の練習スケジュール詳細
        </h3>
        <p className="text-sm text-gray-600">
          {detailsData.start_time} - {detailsData.end_time}
          {detailsData.description && ` | ${detailsData.description}`}
        </p>
        <p className="text-xs text-gray-500">
          セッション数: {scheduleData.length} | 利用可能会場数: {venueGroups.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium">時間</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">全体</th>
              {venueGroups.map((venue) => (
                <th key={venue.id} className="px-4 py-3 text-center font-medium border-l border-gray-300">
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: venue.color }}
                    ></div>
                    <span>{venue.display_name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scheduleData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 bg-white hover:bg-blue-100 transition-colors duration-150"
              >
                <td className="px-4 py-4 font-medium text-black bg-gray-200 border-r border-gray-300">
                  <div className="flex items-center">
                    <span className="text-sm font-bold">{item.time}</span>
                    {item.duration && (
                      <span className="text-xs text-gray-700 ml-1">{item.duration}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200">
                  {formatCellContent(item.activity)}
                </td>
                {venueGroups.map((venue) => (
                  <td
                    key={venue.id}
                    className={cn(
                      "px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0",
                      "cursor-pointer hover:bg-blue-50 transition-colors"
                    )}
                    onClick={() => handleCellClick(item.time, venue.id, venue.display_name, venue.color)}
                  >
                    <div className="text-center text-gray-400">
                      クリックして編集
                    </div>
                  </td>
                ))}
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


