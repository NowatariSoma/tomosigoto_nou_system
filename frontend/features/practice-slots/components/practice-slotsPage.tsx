'use client';

import { useState, useEffect } from 'react';
import { Information } from '@/features/practice-slots/components/information';
import { ScheduleTable } from '@/features/practice-slots/components/Schedule-Table';
import { DateButton } from '@/features/practice-slots/components/date-button';
import { EditGroupsParts } from '@/features/practice-slots/components/EditGroupsParts';
import { ScheduleAssignmentModal } from '@/features/practice-slots/components/ScheduleAssignmentModal';
import { practiceSlotsAPI } from '@/lib/api/practice-slots';
import { PracticeSlot, ScheduleItem } from '@/features/practice-slots/types/schedule';
import { ScheduleAssignmentWithDetails } from '@/features/practice-slots/types/schedule-assignments';
import { Group } from '@/features/practice-slots/types/groups';
import { Part } from '@/features/practice-slots/types/parts';
import { usePracticeSlotIntegrated } from '../hooks';


export const PracticeSlotsPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2024-05-26')); // May 26, 2024
  const [useNewAPI, setUseNewAPI] = useState(false);

  // 新しいAPIのデータを管理
  const {
    practiceSlot: newApiPracticeSlot,
    scheduleData: newApiScheduleData,
    displaySchedule,
    loading: newApiLoading,
    error: newApiError,
    fetchPracticeSlotByDate
  } = usePracticeSlotIntegrated();

  // 既存APIのデータを管理
  const [practiceSlot, setPracticeSlot] = useState<PracticeSlot | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集機能用の状態
  const [groups, setGroups] = useState<Group[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignmentWithDetails[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [selectedGroupColor, setSelectedGroupColor] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleAssignmentWithDetails[]>([]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // グループとパートのデータを取得
  const fetchGroupsAndParts = async () => {
    try {
      // practice-slotsエンドポイントからパート情報を抽出
      if (useNewAPI && newApiScheduleData) {
        // 新APIからパート情報を抽出
        const uniqueParts = new Set<string>();
        newApiScheduleData.forEach(item => {
          if (item.activity) {
            uniqueParts.add(item.activity);
          }
        });

        const partsFromSchedule = Array.from(uniqueParts).map((name, index) => ({
          id: `part-${index}`,
          name,
          display_name: name,
          description: name,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        setParts(partsFromSchedule);
      } else if (scheduleData) {
        // 既存APIからパート情報を抽出
        const uniqueParts = new Set<string>();
        scheduleData.forEach(item => {
          if (item.activity) {
            uniqueParts.add(item.activity);
          }
        });

        const partsFromSchedule = Array.from(uniqueParts).map((name, index) => ({
          id: `part-${index}`,
          name,
          display_name: name,
          description: name,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        setParts(partsFromSchedule);
      }

      // スケジュールデータからグループ情報を抽出（カラム数ベース）
      if (useNewAPI && newApiScheduleData) {
        const maxColumns = Math.max(...newApiScheduleData.map(item => item.columns?.length || 0));
        const generatedGroups = Array.from({ length: maxColumns }, (_, index) => ({
          id: `group-${index}`,
          name: `グループ${index + 1}`,
          display_name: `グループ${index + 1}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setGroups(generatedGroups);
      } else if (scheduleData) {
        const maxColumns = Math.max(...scheduleData.map(item => item.columns?.length || 0));
        const generatedGroups = Array.from({ length: maxColumns }, (_, index) => ({
          id: `group-${index}`,
          name: `グループ${index + 1}`,
          display_name: `グループ${index + 1}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setGroups(generatedGroups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Error extracting parts from practice-slots:', err);
      setGroups([]);
      setParts([]);
    }
  };

  // 割り当てデータを取得
  const fetchAssignments = async () => {
    try {
      // practice-slotsエンドポイントから割り当て情報を抽出
      if (useNewAPI && newApiScheduleData) {
        // 新APIからセッション情報を基に割り当てデータを作成
        const assignmentsFromSchedule: ScheduleAssignmentWithDetails[] = [];

        newApiScheduleData.forEach(item => {
          if (item.columns) {
            item.columns.forEach((column, index) => {
              if (column && column.trim() !== '') {
                assignmentsFromSchedule.push({
                  id: `assignment-${item.time}-${index}`,
                  practice_slot_id: currentPracticeSlot?.id || '',
                  time_slot: item.time,
                  group_id: `group-${index}`,
                  part_id: `part-${item.activity}`,
                  notes: column,
                  is_active: true,
                  sort_order: index,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  group_name: `グループ${index + 1}`,
                  group_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                  part_name: item.activity || ''
                });
              }
            });
          }
        });

        setAssignments(assignmentsFromSchedule);
      } else {
        // 現在practice-slotsに割り当て情報が含まれていないため空配列
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error extracting assignments from practice-slots:', err);
      setAssignments([]);
    }
  };

  // セルクリック時の処理
  const handleCellClick = (timeSlot: string, groupId: string, groupName: string, groupColor: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    setSelectedGroupColor(groupColor);

    // 既存の割り当てを確認（複数パート対応）
    const existingAssignments = assignments.filter(
      assignment =>
        assignment.time_slot === timeSlot &&
        assignment.group_id === groupId
    );

    setSelectedAssignment(existingAssignments);
    setIsModalOpen(true);
  };

  // モーダル保存後の処理
  const handleModalSave = () => {
    fetchAssignments();
  };
  


  const fetchPracticeSlot = async (date: Date) => {
    // タイムゾーンの問題を回避するため、ローカル日付を直接使用
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD format

    console.log('Fetching practice slot for date:', dateString, 'useNewAPI:', useNewAPI);

    if (useNewAPI) {
      // 新しいAPIを使用
      await fetchPracticeSlotByDate(dateString);
    } else {
      // 既存のAPIを使用
      setLoading(true);
      setError(null);

      try {
        const response = await practiceSlotsAPI.getPracticeSlotByDate(dateString);

        if (response.success && response.data) {
          setPracticeSlot(response.data);
          setScheduleData(response.data.schedule_items || []);
        } else {
          setScheduleData([]);
          setPracticeSlot({
            id: 'no-data',
            date: dateString,
            title: `${dateString}の練習表`,
            description: 'データなし',
            is_active: false
          });
        }
      } catch (err) {
        console.error('Error fetching practice slot:', err);
        setScheduleData([]);
        setPracticeSlot(null);
        setError(err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    navigateDate(direction);
  };

  // 適切なロード状態とエラー状態を選択
  const currentLoading = useNewAPI ? newApiLoading : loading;
  const currentError = useNewAPI ? newApiError : error;
  const currentPracticeSlot = useNewAPI ? newApiPracticeSlot : practiceSlot;
  const currentScheduleData = useNewAPI ? newApiScheduleData : scheduleData;

  useEffect(() => {
    fetchPracticeSlot(currentDate);
  }, [currentDate, useNewAPI]);

  // データが取得された後にグループとパート、割り当てデータを抽出
  useEffect(() => {
    if (currentScheduleData && currentScheduleData.length > 0) {
      fetchGroupsAndParts();
      fetchAssignments();
    }
  }, [currentScheduleData, useNewAPI]);

  if (currentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-lg">{currentError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API切り替えボタン */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            表示方式:
          </label>
          <button
            onClick={() => setUseNewAPI(!useNewAPI)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              useNewAPI
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {useNewAPI ? '新API表示' : '既存表示'}
          </button>
          {displaySchedule && useNewAPI && (
            <div className="text-sm text-gray-600">
              {displaySchedule.description}
            </div>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <DateButton
        currentDate={currentDate}
        onDateChange={handleDateChange}
      />
      
      {/* Schedule Table */}
      <ScheduleTable
        scheduleData={currentScheduleData}
        groups={groups}
        assignments={assignments}
        onCellClick={handleCellClick}
      />

      {/* Information */}
      <Information currentDate={currentDate} />

      {/* Groups and Parts Management */}
      <EditGroupsParts />

      {/* Schedule Assignment Modal */}
      {practiceSlot?.id && (
        <ScheduleAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          timeSlot={selectedTimeSlot}
          groupId={selectedGroupId}
          groupName={selectedGroupName}
          groupColor={selectedGroupColor}
          practiceSlotId={practiceSlot.id}
          availableParts={parts}
          existingAssignments={selectedAssignment}
        />
      )}
    </div>
  );
};