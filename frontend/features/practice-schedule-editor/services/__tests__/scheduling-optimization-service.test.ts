import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulingOptimizationService } from '@/features/practice-schedule-editor/services/scheduling-optimization-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('SchedulingOptimizationService', () => {
  let service: SchedulingOptimizationService;

  beforeEach(() => {
    service = new SchedulingOptimizationService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockOptimizationResult = {
    status: 'optimal',
    schedule_id: 'schedule-1',
    sessions_created: 12,
    objective_value: 95.5,
    is_optimal: true,
    solve_time_seconds: 2.3,
    instructor_distribution: { '田中': 3, '佐藤': 4 },
    part_distribution: { 'シテ': 6, 'ワキ': 6 },
  };

  const mockPreviewResult = {
    status: 'optimal',
    schedule_id: 'schedule-1',
    preview: true,
    sessions_count: 12,
    objective_value: 95.5,
    is_optimal: true,
    solve_time_seconds: 1.8,
    instructor_distribution: { '田中': 3, '佐藤': 4 },
    part_distribution: { 'シテ': 6, 'ワキ': 6 },
    schedule_matrix: {
      '09:00': { 'venue-1': [{ part: 'シテ', instructor: '田中' }] },
    },
  };

  describe('optimize', () => {
    it('パラメータなしでスケジュールを最適化する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockOptimizationResult));

      const result = await service.optimize('schedule-1');
      expect(result.status).toBe('optimal');
      expect(result.schedule_id).toBe('schedule-1');
      expect(result.sessions_created).toBe(12);
      expect(result.is_optimal).toBe(true);
      expect(mockFetchApi).toHaveBeenCalledWith('/scheduling/optimize', {
        method: 'POST',
        body: JSON.stringify({ schedule_id: 'schedule-1' }),
      });
    });

    it('パラメータ付きで最適化する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockOptimizationResult));

      const params = {
        time_limit_seconds: 30,
        equality_weight: 0.8,
        allow_overlap: false,
        max_iterations: 1000,
        solution_limit: 5,
      };

      const result = await service.optimize('schedule-1', params);
      expect(result.status).toBe('optimal');

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.optimization_params).toEqual(params);
    });

    it('パラメータがundefinedの場合はoptimization_paramsが含まれない', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockOptimizationResult));

      await service.optimize('schedule-1', undefined);

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.optimization_params).toBeUndefined();
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Optimization failed'));

      await expect(service.optimize('schedule-1')).rejects.toThrow('Optimization failed');
    });
  });

  describe('preview', () => {
    it('パラメータなしでプレビューを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockPreviewResult));

      const result = await service.preview('schedule-1');
      expect(result.status).toBe('optimal');
      expect(result.preview).toBe(true);
      expect(result.sessions_count).toBe(12);
      expect(result.schedule_matrix).toBeDefined();
      expect(mockFetchApi).toHaveBeenCalledWith('/scheduling/preview', {
        method: 'POST',
        body: JSON.stringify({ schedule_id: 'schedule-1' }),
      });
    });

    it('パラメータ付きでプレビューを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockPreviewResult));

      const params = {
        time_limit_seconds: 15,
        equality_weight: 0.5,
      };

      const result = await service.preview('schedule-1', params);
      expect(result.status).toBe('optimal');

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.optimization_params).toEqual(params);
    });

    it('パラメータがundefinedの場合はoptimization_paramsが含まれない', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockPreviewResult));

      await service.preview('schedule-1', undefined);

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.optimization_params).toBeUndefined();
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Preview failed'));

      await expect(service.preview('schedule-1')).rejects.toThrow('Preview failed');
    });
  });
});
