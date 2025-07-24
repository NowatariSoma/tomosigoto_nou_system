/**
 * PDF出力設定モーダルコンポーネント
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, RotateCcw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PDFExportOptions, PDFExportStatus } from '../types/pdf';
import { usePDFExport } from '../hooks/usePDFExport';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions) => void;
  initialOptions: Partial<PDFExportOptions>;
  exportStatus?: PDFExportStatus;
}

type TabType = 'options' | 'progress';

interface ValidationErrors {
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  general?: string;
}

export function PDFExportModal({
  isOpen,
  onClose,
  onExport,
  initialOptions,
  exportStatus
}: PDFExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('options');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isWarning, setIsWarning] = useState(false);
  const [currentExportId, setCurrentExportId] = useState<string | null>(null);

  const { exportPDF, downloadPDF, cancelExport, clearExport, exportStatus: hookExportStatus } = usePDFExport();

  // フォームデータの状態
  const [options, setOptions] = useState<PDFExportOptions>({
    startDate: initialOptions.startDate || new Date(),
    endDate: initialOptions.endDate || new Date(),
    partIds: initialOptions.partIds,
    templateId: initialOptions.templateId || 'default',
    paperSize: initialOptions.paperSize || 'A4',
    orientation: initialOptions.orientation || 'portrait',
    includeDetails: initialOptions.includeDetails ?? true,
    fontSize: initialOptions.fontSize || 10
  });

  /**
   * オプション変更処理
   */
  const handleOptionChange = useCallback(<K extends keyof PDFExportOptions>(
    key: K,
    value: PDFExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    
    // バリデーションエラーをクリア
    if (validationErrors[key as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [validationErrors]);

  /**
   * 日付範囲変更処理
   */
  const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    const date = new Date(value);
    handleOptionChange(field, date);
    
    // 日付範囲の警告チェック
    const otherDate = field === 'startDate' ? options.endDate : options.startDate;
    const start = field === 'startDate' ? date : options.startDate;
    const end = field === 'endDate' ? date : options.endDate;
    
    if (start && end) {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setIsWarning(diffDays > 90);
    }
  }, [options.startDate, options.endDate, handleOptionChange]);

  /**
   * オプションバリデーション
   */
  const validateOptions = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // 日付の妥当性チェック
    if (options.startDate >= options.endDate) {
      errors.dateRange = '終了日は開始日以降である必要があります';
    }

    // 今日より未来の日付チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (options.startDate < today) {
      errors.startDate = '開始日は今日以降である必要があります';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [options]);

  /**
   * PDF出力開始処理
   */
  const handleExportClick = useCallback(async () => {
    if (!validateOptions()) {
      return;
    }

    try {
      const exportId = await exportPDF(options);
      setCurrentExportId(exportId);
      setActiveTab('progress');
      onExport(options);
    } catch (error) {
      setValidationErrors({ general: 'PDF生成の開始に失敗しました' });
    }
  }, [options, validateOptions, exportPDF, onExport]);

  /**
   * PDFダウンロード処理
   */
  const handleDownloadClick = useCallback(async () => {
    if (!currentExportId) return;
    
    const success = await downloadPDF(currentExportId);
    if (success) {
      // ダウンロード成功後にモーダルを閉じる
      setTimeout(() => {
        onClose();
        if (currentExportId) {
          clearExport(currentExportId);
        }
        setCurrentExportId(null);
      }, 1000);
    }
  }, [currentExportId, downloadPDF, onClose, clearExport]);

  /**
   * リトライ処理
   */
  const handleRetryClick = useCallback(() => {
    if (currentExportId) {
      clearExport(currentExportId);
    }
    setCurrentExportId(null);
    setActiveTab('options');
  }, [currentExportId, clearExport]);

  /**
   * キャンセル処理
   */
  const handleCancelClick = useCallback(async () => {
    if (currentExportId) {
      await cancelExport(currentExportId);
      clearExport(currentExportId);
    }
    setCurrentExportId(null);
    setActiveTab('options');
    onClose();
  }, [currentExportId, cancelExport, clearExport, onClose]);

  // 現在のエクスポートステータスを取得
  const currentStatus = currentExportId ? hookExportStatus[currentExportId] : exportStatus;

  // エクスポート状態によってタブを自動切り替え
  useEffect(() => {
    if (currentStatus?.status === 'processing') {
      setActiveTab('progress');
    }
  }, [currentStatus?.status]);

  /**
   * オプション設定タブ
   */
  const renderOptionsTab = () => (
    <div className="space-y-6">
      {/* 日付範囲設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">出力期間</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">開始日</Label>
            <Input
              id="start-date"
              type="date"
              value={options.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className={cn(validationErrors.startDate && 'border-red-500')}
            />
            {validationErrors.startDate && (
              <p className="text-sm text-red-500">{validationErrors.startDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">終了日</Label>
            <Input
              id="end-date"
              type="date"
              value={options.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className={cn(validationErrors.endDate && 'border-red-500')}
            />
            {validationErrors.endDate && (
              <p className="text-sm text-red-500">{validationErrors.endDate}</p>
            )}
          </div>
        </div>
        {validationErrors.dateRange && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationErrors.dateRange}</AlertDescription>
          </Alert>
        )}
        {isWarning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              日付範囲が長いため、PDF生成に時間がかかる場合があります
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      {/* PDF設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">PDF設定</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paper-size">用紙サイズ</Label>
            <Select
              value={options.paperSize}
              onValueChange={(value) => handleOptionChange('paperSize', value as 'A4' | 'A3' | 'Letter')}
            >
              <SelectTrigger id="paper-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">用紙の向き</Label>
            <Select
              value={options.orientation}
              onValueChange={(value) => handleOptionChange('orientation', value as 'portrait' | 'landscape')}
            >
              <SelectTrigger id="orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">縦向き</SelectItem>
                <SelectItem value="landscape">横向き</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-details"
            checked={options.includeDetails}
            onCheckedChange={(checked) => handleOptionChange('includeDetails', !!checked)}
          />
          <Label htmlFor="include-details">詳細情報を含める</Label>
        </div>
      </div>

      {validationErrors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.general}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  /**
   * 進行状況タブ
   */
  const renderProgressTab = () => {
    if (!currentStatus) {
      return <div>ステータス情報がありません</div>;
    }

    return (
      <div className="space-y-6 text-center">
        {currentStatus.status === 'processing' && (
          <>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <h3 className="text-lg font-medium">PDF生成中...</h3>
              {currentStatus.progress !== undefined && (
                <>
                  <Progress value={currentStatus.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{currentStatus.progress}%</p>
                </>
              )}
            </div>
          </>
        )}

        {currentStatus.status === 'completed' && (
          <>
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-green-700">PDF生成が完了しました</h3>
              <p className="text-sm text-muted-foreground">
                下のボタンをクリックしてダウンロードを開始してください
              </p>
            </div>
            <Button onClick={handleDownloadClick} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              ダウンロード
            </Button>
          </>
        )}

        {currentStatus.status === 'failed' && (
          <>
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-red-700">PDF生成に失敗しました</h3>
              {currentStatus.error && (
                <p className="text-sm text-red-600">{currentStatus.error}</p>
              )}
            </div>
            <Button onClick={handleRetryClick} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              再試行
            </Button>
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-overlay">
        <DialogHeader>
          <DialogTitle>PDF出力設定</DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {activeTab === 'options' && renderOptionsTab()}
          {activeTab === 'progress' && renderProgressTab()}
        </div>

        <div className="flex justify-end space-x-2 mt-8">
          {activeTab === 'options' && (
            <>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button 
                onClick={handleExportClick}
                disabled={Object.keys(validationErrors).length > 0}
              >
                出力開始
              </Button>
            </>
          )}
          {activeTab === 'progress' && currentStatus?.status === 'processing' && (
            <Button variant="outline" onClick={handleCancelClick}>
              キャンセル
            </Button>
          )}
          {activeTab === 'progress' && currentStatus?.status !== 'processing' && (
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}