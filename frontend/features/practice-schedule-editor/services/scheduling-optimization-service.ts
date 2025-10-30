/**
 * スケジューリング最適化APIサービス
 */

import { fetchApi } from '../../../lib/api';

export interface OptimizationParams {
  time_limit_seconds?: number;
  equality_weight?: number;
  allow_overlap?: boolean;
  max_iterations?: number;
  solution_limit?: number;
}

export interface OptimizationResult {
  status: string;
  schedule_id: string;
  sessions_created: number;
  objective_value: number;
  is_optimal: boolean;
  solve_time_seconds: number;
  instructor_distribution: Record<string, number>;
  part_distribution: Record<string, number>;
}

export interface PreviewResult {
  status: string;
  schedule_id: string;
  preview: boolean;
  sessions_count: number;
  objective_value: number;
  is_optimal: boolean;
  solve_time_seconds: number;
  instructor_distribution: Record<string, number>;
  part_distribution: Record<string, number>;
  schedule_matrix: Record<string, Record<string, any[]>>;
}

export class SchedulingOptimizationService {
  private readonly basePath = '/scheduling';

  /**
   * スケジュールを最適化
   * @param scheduleId - スケジュールID
   * @param params - 最適化パラメータ
   * @returns 最適化結果
   */
  async optimize(scheduleId: string, params?: OptimizationParams): Promise<OptimizationResult> {
    const requestBody: any = {
      schedule_id: scheduleId,
    };

    if (params) {
      requestBody.optimization_params = params;
    }

    const response = await fetchApi(`${this.basePath}/optimize`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  /**
   * 最適化結果をプレビュー
   * @param scheduleId - スケジュールID
   * @param params - 最適化パラメータ
   * @returns プレビュー結果
   */
  async preview(scheduleId: string, params?: OptimizationParams): Promise<PreviewResult> {
    const requestBody: any = {
      schedule_id: scheduleId,
    };

    if (params) {
      requestBody.optimization_params = params;
    }

    const response = await fetchApi(`${this.basePath}/preview`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }
}

export const schedulingOptimizationService = new SchedulingOptimizationService();

