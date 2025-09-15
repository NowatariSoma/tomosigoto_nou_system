import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScheduleItem, ScheduleTableProps } from '@/features/practice-slots/types/schedule';
import { ScheduleAssignmentWithDetails } from '@/features/practice-slots/types/schedule-assignments';
import { Group } from '@/features/practice-slots/types/groups';

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  scheduleData,
  groups = [],
  assignments = [],
  onCellClick
}) => {
  console.log('ScheduleTable - groups:', groups);
  console.log('ScheduleTable - assignments:', assignments);
  // セル内容をフォーマットする関数
  const formatCellContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="text-xs leading-tight">
        {line}
      </div>
    ));
  };

  // 割り当て情報を取得する関数
  const getAssignmentForCell = (timeSlot: string, groupId: string) => {
    return assignments.find(
      assignment => 
        assignment.time_slot === timeSlot && 
        assignment.group_id === groupId
    );
  };

  // セルの内容を表示する関数（複数パート対応）
  const getCellContent = (timeSlot: string, groupId: string) => {
    const cellAssignments = assignments.filter(
      assignment => 
        assignment.time_slot === timeSlot && 
        assignment.group_id === groupId
    );
    
    if (cellAssignments.length > 0) {
      // ソート順で並び替え
      const sortedAssignments = cellAssignments.sort((a, b) => a.sort_order - b.sort_order);
      return sortedAssignments.map(assignment => assignment.part_display_name).join('\n');
    }
    return '';
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-white border-b border-gray-300">
              <th className="px-4 py-3 text-left font-medium">時間</th>
              <th className="px-4 py-3 text-center font-medium border-l border-gray-300">全体</th>
              {groups.map((group) => (
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
                {groups.map((group, colIndex) => {
                  if (!group.id) return null;

                  const cellContent = getCellContent(item.time, group.id);
                  const assignment = getAssignmentForCell(item.time, group.id);

                  return (
                    <td
                      key={group.id}
                      className={cn(
                        "px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0",
                        "cursor-pointer hover:bg-blue-50 transition-colors",
                        assignment && "bg-blue-50"
                      )}
                      onClick={() => onCellClick?.(item.time, group.id!, group.display_name, group.color)}
                    >
                      {cellContent ? (
                        <div className="text-center">
                          <div className="font-medium text-blue-700">{cellContent}</div>
                          {assignment?.notes && (
                            <div className="text-xs text-gray-500 mt-1">{assignment.notes}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          クリックして編集
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