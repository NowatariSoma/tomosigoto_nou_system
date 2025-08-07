import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScheduleItem, ScheduleTableProps } from '@/features/practice_slots/types/schedule';

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  scheduleData 
}) => {
  // セル内容をフォーマットする関数
  const formatCellContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="text-xs leading-tight">
        {line}
      </div>
    ));
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-black border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium">時間</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">XX</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">XX</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">XX</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">XX</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">XX</th>
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
                {item.columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0"
                  >
                    {formatCellContent(column)}
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