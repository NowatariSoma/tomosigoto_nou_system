/**
 * PDF出力ボタンコンポーネント
 */
'use client';

import React, { useState, useCallback } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PDFExportModal } from './PDFExportModal';
import { PDFExportOptions } from '../types/pdf';

interface PDFExportButtonProps {
  currentDateRange: {
    start: Date;
    end: Date;
  };
  currentViewMode: 'month' | 'week';
  selectedPartId?: number;
  className?: string;
  disabled?: boolean;
}

export function PDFExportButton({
  currentDateRange,
  currentViewMode,
  selectedPartId,
  className,
  disabled = false
}: PDFExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * ボタンクリック処理
   */
  const handleClick = useCallback(() => {
    if (disabled) return;
    setIsModalOpen(true);
  }, [disabled]);

  /**
   * モーダルクローズ処理
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * PDF出力開始処理
   */
  const handleExportStart = useCallback((options: PDFExportOptions) => {
    // モーダルを閉じる
    setIsModalOpen(false);
    
    // 実際の出力処理はモーダル内で実行される
    console.log('PDF出力開始:', options);
  }, []);

  /**
   * 初期オプションを生成
   */
  const getInitialOptions = useCallback((): Partial<PDFExportOptions> => {
    return {
      startDate: currentDateRange.start,
      endDate: currentDateRange.end,
      partIds: selectedPartId ? [selectedPartId] : undefined,
      paperSize: 'A4',
      orientation: 'portrait',
      includeDetails: true,
      templateId: 'default',
      fontSize: 10
    };
  }, [currentDateRange, selectedPartId]);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="default"
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          className
        )}
        type="button"
      >
        <FileDown className="h-4 w-4" />
        PDF出力
      </Button>

      {isModalOpen && (
        <PDFExportModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onExport={handleExportStart}
          initialOptions={getInitialOptions()}
        />
      )}
    </>
  );
}