'use client';

import React, { useState } from 'react';
import { ScheduleTable } from '@/features/schedule/components/ScheduleTable';
import { IdealScheduleData } from '@/features/schedule/types/practice-schedule-types';

/**
 * ScheduleTableコンポーネントのテストページ
 * モックデータと実際のAPIデータの両方でテスト可能
 */

// モックデータ
const mockIdealScheduleData: IdealScheduleData = {
  schedule_info: {
    id: 'test-schedule-1',
    schedule_date: '2025-01-15',
    start_time: '09:00:00',
    end_time: '17:00:00',
    title: 'テスト練習',
    description: 'スケジュールテーブルのテスト用データ'
  },
  venues: [
    {
      id: 'venue-1',
      name: '第1会場',
      priority: 1,
      color: '#FF6B6B'
    },
    {
      id: 'venue-2',
      name: '第2会場',
      priority: 2,
      color: '#4ECDC4'
    },
    {
      id: 'venue-3',
      name: '第3会場',
      priority: 3,
      color: '#95E1D3'
    }
  ],
  time_schedule: {
    '09:00': {
      'venue-1': [
        {
          part_id: 'part-1',
          part_name: 'セッション1',
          part_color: '#FFD93D',
          session_title: '基礎練習',
          instructors: ['田中先生', '佐藤先生'],
          participants: 8,
          status: 'confirmed',
          slot_order: 1,
          schedule_available_venue_id: 'venue-1'
        }
      ],
      'venue-2': [
        {
          part_id: 'part-2',
          part_name: 'セッション2',
          part_color: '#6BCF7F',
          session_title: '応用練習',
          instructors: ['山田先生'],
          participants: 5,
          status: 'tentative',
          slot_order: 1,
          schedule_available_venue_id: 'venue-2'
        }
      ],
      'venue-3': []
    },
    '11:00': {
      'venue-1': [],
      'venue-2': [
        {
          part_id: 'part-3',
          part_name: 'セッション3',
          part_color: '#A8E6CF',
          session_title: '特別セッション',
          instructors: [],
          participants: 12,
          status: 'confirmed',
          slot_order: 2,
          schedule_available_venue_id: 'venue-2'
        }
      ],
      'venue-3': [
        {
          part_id: 'part-4',
          part_name: 'セッション4',
          part_color: '#FFB6C1',
          session_title: '個別指導',
          instructors: ['鈴木先生', '高橋先生', '伊藤先生'],
          participants: 3,
          status: 'confirmed',
          slot_order: 2,
          schedule_available_venue_id: 'venue-3'
        }
      ]
    },
    '13:00': {
      'venue-1': [
        {
          part_id: 'part-5',
          part_name: 'セッション5',
          part_color: '#DDA0DD',
          session_title: '午後の練習',
          instructors: ['渡辺先生'],
          participants: 15,
          status: 'confirmed',
          slot_order: 3,
          schedule_available_venue_id: 'venue-1'
        }
      ],
      'venue-2': [],
      'venue-3': []
    },
    '15:00': {
      'venue-1': [],
      'venue-2': [],
      'venue-3': []
    }
  },
  debug_info: {
    sessions_count: 5,
    sessions_data: [],
    venues_count: 3,
    division_count: 6,
    session_processing_details: []
  }
};

export default function TestScheduleTablePage() {
  const [testDate, setTestDate] = useState<Date>(new Date('2025-01-15'));
  const [useRealData, setUseRealData] = useState(false);
  const [apiData, setApiData] = useState<IdealScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRealData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateStr = testDate.toISOString().split('T')[0];
      const response = await fetch(`/api/v1/practice_schedules/date/${dateStr}/ideal`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setApiData(data);
      console.log('Fetched API data:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayData = useRealData ? apiData : mockIdealScheduleData;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">ScheduleTable テストページ</h1>

      {/* テストコントロール */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">テスト設定</h2>

        <div className="space-y-4">
          {/* データソース選択 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dataSource"
                checked={!useRealData}
                onChange={() => setUseRealData(false)}
                className="w-4 h-4"
              />
              <span>モックデータを使用</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dataSource"
                checked={useRealData}
                onChange={() => setUseRealData(true)}
                className="w-4 h-4"
              />
              <span>実際のAPIデータを使用</span>
            </label>
          </div>

          {/* 実際のAPIを使用する場合 */}
          {useRealData && (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <span>日付:</span>
                  <input
                    type="date"
                    value={testDate.toISOString().split('T')[0]}
                    onChange={(e) => setTestDate(new Date(e.target.value))}
                    className="px-3 py-2 border rounded"
                  />
                </label>
                <button
                  onClick={fetchRealData}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'データ取得中...' : 'データを取得'}
                </button>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong>エラー:</strong> {error}
                </div>
              )}

              {apiData && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  ✓ APIデータを取得しました
                </div>
              )}
            </div>
          )}
        </div>

        {/* データプレビュー */}
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">使用中のデータを確認</summary>
          <pre className="mt-2 p-4 bg-white rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </details>
      </div>

      {/* データ検証結果 */}
      {displayData && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">データ検証結果</h2>
          <div className="space-y-2 text-sm">
            <div>
              {displayData.schedule_info ? '✓' : '✗'} schedule_info:
              {displayData.schedule_info && ` ${displayData.schedule_info.title || 'タイトルなし'}`}
            </div>
            <div>
              {displayData.venues && Array.isArray(displayData.venues) ? '✓' : '✗'} venues:
              {displayData.venues && ` ${displayData.venues.length}件`}
            </div>
            <div>
              {displayData.time_schedule && typeof displayData.time_schedule === 'object' ? '✓' : '✗'} time_schedule:
              {displayData.time_schedule && ` ${Object.keys(displayData.time_schedule).length}個の時間スロット`}
            </div>

            {/* セッション情報の詳細 */}
            {displayData.time_schedule && (
              <div className="mt-4 pl-4 border-l-2 border-blue-300">
                <div className="font-semibold mb-2">セッション情報:</div>
                {Object.entries(displayData.time_schedule).map(([time, venues]) => {
                  const sessionCount = Object.values(venues).reduce((sum, parts) => sum + parts.length, 0);
                  return sessionCount > 0 ? (
                    <div key={time} className="ml-2">
                      {time}: {sessionCount}件のセッション
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ScheduleTableコンポーネント */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">ScheduleTable コンポーネント表示</h2>
        <ScheduleTable currentDate={testDate} />
      </div>
    </div>
  );
}
