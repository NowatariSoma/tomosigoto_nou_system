import * as React from 'react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePracticeSchedule } from '../hooks';

interface ScheduleTableProps {
  className?: string;
  currentDate: Date;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  currentDate
}) => {

  // 仮のスケジュールデータ（見た目維持用）
  const mockScheduleData = [
    { time: '09:00', duration: '60分', activity: '朝練習' },
    { time: '10:30', duration: '90分', activity: 'メイン練習' },
    { time: '12:00', duration: '60分', activity: '昼休み' },
    { time: '13:30', duration: '120分', activity: '午後練習' },
    { time: '16:00', duration: '30分', activity: 'クールダウン' },
  ];

  // 仮のグループデータ（見た目維持用）
  const mockGroups = [
    { id: '1', display_name: 'A組', color: '#FF6B6B' },
    { id: '2', display_name: 'B組', color: '#4ECDC4' },
    { id: '3', display_name: 'C組', color: '#45B7D1' },
  ];

  const formatCellContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="text-xs leading-tight">
        {line}
      </div>
    ));
  };

  const handleCellClick = (time: string, groupId: string, groupName: string, color: string) => {
    console.log('ScheduleTable - セルクリック:', { time, groupId, groupName, color });
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium">時間</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">全体</th>
              {mockGroups.map((group) => (
                <th key={group.id} className="px-4 py-3 text-center font-medium border-l border-gray-300">
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <span>{group.display_name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockScheduleData.map((item, index) => (
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
                {mockGroups.map((group) => (
                  <td
                    key={group.id}
                    className={cn(
                      "px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0",
                      "cursor-pointer hover:bg-blue-50 transition-colors"
                    )}
                    onClick={() => handleCellClick(item.time, group.id, group.display_name, group.color)}
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


