'use client';

import { useState, useEffect } from 'react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Information } from '@/features/practice-slots/components/information';
import { ScheduleTable } from '@/features/practice-slots/components/Schedule-Table';
import { DateButton } from '@/features/practice-slots/components/date-button';
import { EditGroupsParts } from '@/features/practice-slots/components/EditGroupsParts';
import { ScheduleAssignmentModal } from '@/features/practice-slots/components/ScheduleAssignmentModal';
import { practiceSlotsAPI } from '@/lib/api/practice-slots';
import { scheduleAssignmentsAPI } from '@/lib/api/schedule-assignments';
import { PracticeSlot, ScheduleItem } from '@/features/practice-slots/types/schedule';
import { ScheduleAssignmentWithDetails } from '@/features/practice-slots/types/schedule-assignments';
import { Group } from '@/features/practice-slots/types/groups';
import { Part } from '@/features/practice-slots/types/parts';

// 初期モックデータ
const initialMockData: ScheduleItem[] = [
  {
    id: '1',
    time: '19:00',
    duration: '(5)',
    activity: '集合・挨拶',
    columns: ['', '', '', '', '']
  },
  {
    id: '2',
    time: '19:05',
    duration: '(10)',
    activity: '女子準備',
    columns: ['', '男子準備', '', '', '']
  },
  {
    id: '3',
    time: '19:15',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    id: '4',
    time: '19:35',
    duration: '(15)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    id: '5',
    time: '19:50',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    id: '6',
    time: '20:10',
    duration: '(15)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    id: '7',
    time: '20:25',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    id: '8',
    time: '20:45',
    duration: '',
    activity: '集合・整上坊・挨拶',
    columns: ['', '', '', '', '']
  }
];

export const PracticeSlotsPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2024-05-26')); // May 26, 2024
  const [practiceSlot, setPracticeSlot] = useState<PracticeSlot | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>(initialMockData); // 初期データを設定
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

  const createMockData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return {
      id: '550e8400-e29b-41d4-a716-446655440000', // 有効なUUID形式
      date: dateString,
      title: `${dateString}の練習表`,
      description: 'サンプルデータ付きの練習表です',
      is_active: true,
      schedule_items: [
        {
          id: '1',
          time: '19:00',
          duration: '(5)',
          activity: '集合・挨拶',
          columns: ['', '', '', '', '']
        },
        {
          id: '2',
          time: '19:05',
          duration: '(10)',
          activity: '女子準備',
          columns: ['', '男子準備', '', '', '']
        },
        {
          id: '3',
          time: '19:15',
          duration: '(20)',
          activity: '○○パート\n××パート\n△△パート',
          columns: [
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート'
          ]
        },
        {
          id: '4',
          time: '19:35',
          duration: '(15)',
          activity: '○○パート\n××パート\n△△パート',
          columns: [
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート'
          ]
        },
        {
          id: '5',
          time: '19:50',
          duration: '(20)',
          activity: '○○パート\n××パート\n△△パート',
          columns: [
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート'
          ]
        },
        {
          id: '6',
          time: '20:10',
          duration: '(15)',
          activity: '○○パート\n××パート\n△△パート',
          columns: [
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート'
          ]
        },
        {
          id: '7',
          time: '20:25',
          duration: '(20)',
          activity: '○○パート\n××パート\n△△パート',
          columns: [
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート',
            '○○パート\n××パート\n△△パート'
          ]
        },
        {
          id: '8',
          time: '20:45',
          duration: '',
          activity: '集合・整上坊・挨拶',
          columns: ['', '', '', '', '']
        }
      ]
    };
  };

  // グループとパートのデータを取得
  const fetchGroupsAndParts = async () => {
    try {
      console.log('Fetching groups and parts...');
      
      // グループデータを取得
      try {
        const groupsResponse = await fetch('http://localhost:8000/api/v1/groups/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Groups response status:', groupsResponse.status);
        console.log('Groups response headers:', groupsResponse.headers);
        
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          console.log('Groups data:', groupsData);
          setGroups(groupsData);
        } else {
          console.error('Groups response not ok:', groupsResponse.status, groupsResponse.statusText);
          const errorText = await groupsResponse.text();
          console.error('Groups error response:', errorText);
        }
      } catch (groupsErr) {
        console.error('Error fetching groups:', groupsErr);
      }

      // パートデータを取得
      try {
        const partsResponse = await fetch('http://localhost:8000/api/v1/parts/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Parts response status:', partsResponse.status);
        console.log('Parts response headers:', partsResponse.headers);
        
        if (partsResponse.ok) {
          const partsData = await partsResponse.json();
          console.log('Parts data:', partsData);
          setParts(partsData);
        } else {
          console.error('Parts response not ok:', partsResponse.status, partsResponse.statusText);
          const errorText = await partsResponse.text();
          console.error('Parts error response:', errorText);
        }
      } catch (partsErr) {
        console.error('Error fetching parts:', partsErr);
      }
    } catch (err) {
      console.error('Error fetching groups and parts:', err);
    }
  };

  // 割り当てデータを取得
  const fetchAssignments = async () => {
    if (!practiceSlot?.id) return;
    
    try {
      const response = await scheduleAssignmentsAPI.getAssignmentsByPracticeSlot(practiceSlot.id);
      if (response.success && response.data) {
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
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
    setLoading(true);
    setError(null);
    
    try {
      // タイムゾーンの問題を回避するため、ローカル日付を直接使用
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD format
      
      console.log('Fetching practice slot for date:', dateString);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1');
      
      // 実際のAPIから練習表を取得
      const response = await practiceSlotsAPI.getPracticeSlotByDate(dateString);
      
      if (response.success && response.data) {
        setPracticeSlot(response.data);
        setScheduleData(response.data.sessions || response.data.schedule_items || []);
      } else {
        // 練習表が見つからない場合はサンプルデータを作成
        console.log('Practice slot not found, creating sample data...');
        const sampleResponse = await practiceSlotsAPI.createPracticeSlotWithSampleData(dateString);
        if (sampleResponse.success && sampleResponse.data) {
          setPracticeSlot(sampleResponse.data);
          setScheduleData(sampleResponse.data.sessions || sampleResponse.data.schedule_items || []);
        } else {
          console.log('Failed to create sample data, using mock data');
          // サンプルデータの作成に失敗した場合はモックデータを使用
          setPracticeSlot({
            id: 'mock-id',
            date: dateString,
            title: `${dateString}の練習表`,
            description: 'モックデータ',
            is_active: true
          });
          setScheduleData(initialMockData);
        }
      }
      
      // グループとパートのデータを取得
      await fetchGroupsAndParts();
      
      // 割り当てデータを取得
      await fetchAssignments();
      
    } catch (err) {
      console.error('Error fetching practice slot:', err);
      console.log('Using mock data due to error');
      // エラーが発生した場合はモックデータを使用
      setPracticeSlot({
        id: 'mock-id',
        date: date.toISOString().split('T')[0],
        title: `${date.toISOString().split('T')[0]}の練習表`,
        description: 'モックデータ',
        is_active: true
      });
      setScheduleData(initialMockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeSlot(currentDate);
  }, [currentDate]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    navigateDate(direction);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <DateButton 
        currentDate={currentDate}
        onDateChange={handleDateChange}
      />
      
      {/* Schedule Table */}
      <ScheduleTable 
        scheduleData={scheduleData}
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