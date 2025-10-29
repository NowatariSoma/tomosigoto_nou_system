'use client';

import React, { useState } from 'react';
import { X, Sparkles, Play, Eye, Settings } from 'lucide-react';
import { OptimizationParams, OptimizationResult, PreviewResult } from '../services';
import { schedulingOptimizationService } from '../services/scheduling-optimization-service';

interface OptimizationModalProps {
  scheduleId: string;
  onOptimizationComplete: () => Promise<void>;
  onClose: () => void;
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({
  scheduleId,
  onOptimizationComplete,
  onClose,
}) => {
  const [params, setParams] = useState<OptimizationParams>({
    time_limit_seconds: 30,
    equality_weight: 100,
    allow_overlap: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParamChange = (key: keyof OptimizationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setError(null);
    setPreviewResult(null);
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      const result = await schedulingOptimizationService.preview(scheduleId, params);
      setPreviewResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プレビューの取得に失敗しました';
      setError(errorMessage);
      console.error('プレビューエラー:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!window.confirm('既存のセッションを削除して自動最適化を実行しますか？')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await schedulingOptimizationService.optimize(scheduleId, params);
      setSuccess(true);
      console.log('最適化成功:', result);
      
      // 少し待ってから画面をリフレッシュ
      setTimeout(async () => {
        await onOptimizationComplete();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '最適化に失敗しました';
      setError(errorMessage);
      console.error('最適化エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">練習表を自動最適化</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 成功メッセージ */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-bold">最適化成功</p>
              <p className="text-sm">スケジュールを更新しました。</p>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">エラー</p>
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          )}

          {/* パラメータ設定 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Settings className="h-4 w-4" />
              <span>最適化パラメータ</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  時間制限（秒）
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={params.time_limit_seconds || 30}
                  onChange={(e) => handleParamChange('time_limit_seconds', parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading || previewLoading}
                />
                <p className="text-xs text-gray-500 mt-1">1-300秒</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  均等性重み
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={params.equality_weight || 100}
                  onChange={(e) => handleParamChange('equality_weight', parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading || previewLoading}
                />
                <p className="text-xs text-gray-500 mt-1">0-1000</p>
              </div>
            </div>

            {/* 詳細設定 */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-600 hover:text-gray-900"
              disabled={loading || previewLoading}
            >
              {showAdvanced ? '▼' : '▶'} 詳細設定
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大反復回数
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={params.max_iterations || 1000}
                    onChange={(e) => handleParamChange('max_iterations', parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading || previewLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    解の上限
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={params.solution_limit || 10}
                    onChange={(e) => handleParamChange('solution_limit', parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loading || previewLoading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow-overlap"
                    checked={params.allow_overlap || false}
                    onChange={(e) => handleParamChange('allow_overlap', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                    disabled={loading || previewLoading}
                  />
                  <label htmlFor="allow-overlap" className="text-sm text-gray-700">
                    重複を許可する
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* プレビュー結果 */}
          {previewResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">プレビュー結果</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">セッション数:</span>
                  <span className="ml-2 font-medium">{previewResult.sessions_count}</span>
                </div>
                <div>
                  <span className="text-gray-600">求解時間:</span>
                  <span className="ml-2 font-medium">{previewResult.solve_time_seconds.toFixed(2)}秒</span>
                </div>
                <div>
                  <span className="text-gray-600">最適解:</span>
                  <span className={`ml-2 font-medium ${previewResult.is_optimal ? 'text-green-600' : 'text-yellow-600'}`}>
                    {previewResult.is_optimal ? 'はい' : 'いいえ'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">目的関数値:</span>
                  <span className="ml-2 font-medium">{previewResult.objective_value.toFixed(2)}</span>
                </div>
              </div>

              {/* 指導者分布 */}
              <div>
                <span className="text-gray-600 text-sm block mb-2">指導者別セッション数:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewResult.instructor_distribution).map(([id, count]) => (
                    <span key={id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      指導者{id}: {count}回
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
              disabled={loading || previewLoading}
            >
              {previewLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                  <span>プレビュー中...</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>プレビュー</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleOptimize}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              disabled={loading || previewLoading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>最適化中...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>実行</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

