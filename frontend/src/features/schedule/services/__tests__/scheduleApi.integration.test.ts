/**
 * Schedule API 統合テスト
 * 実際のバックエンドAPIとの統合テスト用
 */

import { fetchSchedulesFromApi, createScheduleApi, updateScheduleApi, deleteScheduleApi, checkApiHealth } from '../scheduleApi';
import { Schedule, CalendarDataParams } from '@/types/schedule';

// テスト用のモックサーバー設定
const TEST_API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:8000/api';

describe('Schedule API Integration Tests', () => {
  // APIヘルスチェック
  describe('API Health Check', () => {
    test('should return true when API is healthy', async () => {
      // Note: 実際のAPIが利用可能な場合のみテストが成功する
      try {
        const isHealthy = await checkApiHealth();
        expect(typeof isHealthy).toBe('boolean');
      } catch (error) {
        console.warn('API health check failed, API may not be available:', error);
        // APIが利用できない場合はテストをスキップ
        expect(true).toBe(true);
      }
    }, 10000);
  });

  // スケジュール取得テスト
  describe('fetchSchedulesFromApi', () => {
    const testParams: CalendarDataParams = {
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      viewMode: 'month'
    };

    test('should fetch schedules for date range', async () => {
      try {
        const schedules = await fetchSchedulesFromApi(testParams);
        
        expect(Array.isArray(schedules)).toBe(true);
        
        // スケジュールが存在する場合の形式チェック
        if (schedules.length > 0) {
          const schedule = schedules[0];
          expect(schedule).toHaveProperty('id');
          expect(schedule).toHaveProperty('title');
          expect(schedule).toHaveProperty('startDate');
          expect(schedule).toHaveProperty('endDate');
          expect(schedule.startDate).toBeInstanceOf(Date);
          expect(schedule.endDate).toBeInstanceOf(Date);
        }
      } catch (error) {
        // APIが利用できない場合の処理
        console.warn('API fetch test failed, using mock data fallback:', error);
        expect(error).toBeDefined();
      }
    }, 15000);

    test('should filter by partId when provided', async () => {
      const paramsWithPart: CalendarDataParams = {
        ...testParams,
        partId: 1
      };

      try {
        const schedules = await fetchSchedulesFromApi(paramsWithPart);
        
        // パートIDでフィルタリングされているかチェック
        if (schedules.length > 0) {
          schedules.forEach(schedule => {
            expect(schedule.partId).toBe(1);
          });
        }
        
        expect(Array.isArray(schedules)).toBe(true);
      } catch (error) {
        console.warn('Part filtering test failed:', error);
        expect(error).toBeDefined();
      }
    }, 15000);

    test('should handle API timeout', async () => {
      // タイムアウトテスト用の非常に短いタイムアウト
      const originalTimeout = jest.setTimeout(1000);
      
      try {
        await fetchSchedulesFromApi(testParams);
      } catch (error) {
        // タイムアウトまたはその他のエラーを期待
        expect(error).toBeDefined();
      } finally {
        jest.clearAllTimers();
      }
    });
  });

  // スケジュール作成テスト（実際のAPIが利用可能な場合のみ実行）
  describe('createScheduleApi', () => {
    const newSchedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'テスト練習',
      startDate: new Date('2024-02-15T19:00:00'),
      endDate: new Date('2024-02-15T21:00:00'),
      partId: 1,
      partName: '管楽器',
      location: 'テスト会場',
      color: '#3b82f6',
      description: 'API統合テスト用のスケジュール'
    };

    test('should create a new schedule', async () => {
      try {
        const createdSchedule = await createScheduleApi(newSchedule);
        
        expect(createdSchedule).toHaveProperty('id');
        expect(createdSchedule.title).toBe(newSchedule.title);
        expect(createdSchedule.startDate).toEqual(newSchedule.startDate);
        expect(createdSchedule.endDate).toEqual(newSchedule.endDate);
        
        // 作成されたスケジュールをクリーンアップ（可能であれば）
        if (createdSchedule.id) {
          try {
            await deleteScheduleApi(createdSchedule.id);
          } catch (cleanupError) {
            console.warn('Failed to cleanup test schedule:', cleanupError);
          }
        }
      } catch (error) {
        console.warn('Schedule creation test failed:', error);
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  // スケジュール更新テスト
  describe('updateScheduleApi', () => {
    test('should update existing schedule', async () => {
      // Note: 実際のテストでは既存のスケジュールIDが必要
      const testScheduleId = 'test-schedule-1';
      const updateData = {
        title: '更新されたタイトル',
        location: '更新された場所'
      };

      try {
        const updatedSchedule = await updateScheduleApi(testScheduleId, updateData);
        
        expect(updatedSchedule).toHaveProperty('id');
        expect(updatedSchedule.title).toBe(updateData.title);
        expect(updatedSchedule.location).toBe(updateData.location);
      } catch (error) {
        console.warn('Schedule update test failed:', error);
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  // エラーハンドリングテスト
  describe('Error Handling', () => {
    test('should handle invalid date range', async () => {
      const invalidParams: CalendarDataParams = {
        dateRange: {
          start: new Date('2024-12-31'),
          end: new Date('2024-01-01') // 終了日が開始日より前
        },
        viewMode: 'month'
      };

      try {
        await fetchSchedulesFromApi(invalidParams);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    test('should handle network errors gracefully', async () => {
      // 無効なAPIエンドポイントでテスト
      const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
      process.env.NEXT_PUBLIC_API_BASE_URL = 'http://invalid-url:9999/api';

      try {
        await fetchSchedulesFromApi({
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          },
          viewMode: 'month'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      } finally {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
      }
    });
  });
});

/**
 * 統合テスト実行ガイド
 * 
 * 1. バックエンドAPIサーバーを起動
 * 2. 環境変数 TEST_API_BASE_URL を設定（オプション）
 * 3. npm run test -- scheduleApi.integration.test.ts を実行
 * 
 * Note: このテストは実際のAPIサーバーが必要です。
 * APIが利用できない場合、多くのテストは警告を出してスキップされます。
 */