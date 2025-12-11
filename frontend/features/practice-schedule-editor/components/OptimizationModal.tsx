'use client';

import React, { useState } from 'react';
import { Sparkles, X, Zap, Info } from 'lucide-react';
import { schedulingOptimizationService } from '../services/scheduling-optimization-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/forms/button';

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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOptimize = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await schedulingOptimizationService.optimize(scheduleId);
      await onOptimizationComplete();
      toast({
        title: '最適化完了',
        description: 'スケジュールの最適化が完了しました。',
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '最適化に失敗しました';
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
      setErrorMessage(errorMessage);
      console.error('最適化エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">自動最適化</h2>
              <p className="text-black text-sm mt-0.5">スケジュールを自動で最適化します</p>
            </div>
            <Button
              onClick={onClose}
              disabled={loading}
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-white/20 text-white disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Section */}
          <div className="bg-white border border-blue-200 rounded-xl p-5">
            <div className="flex items-start space-x-4">
              <Info className="h-6 w-6 text-black mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-base font-semibold text-black">最適化の内容</p>
                <ul className="list-disc list-inside space-y-1.5 text-base text-black">
                  <li>講師の配置を最適化</li>
                  <li>利用可能な会場を考慮</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Section */}
          {errorMessage && (
            <div className="panel-error rounded-xl p-4 text-gray-900 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="outline"
              className="px-6 py-3 text-black bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl font-medium shadow-sm hover:shadow-md"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleOptimize}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>最適化中...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>最適化を実行</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
