/**
 * PDF出力処理とその状態管理を行うカスタムフック
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFExportOptions, PDFExportStatus } from '../types/pdf';
import { 
  requestPDFGeneration, 
  checkPDFExportStatus, 
  cancelPDFExport, 
  getPDFDownloadUrl 
} from '../api/pdfApi';
import { useFileDownload } from './useFileDownload';

interface UsePDFExportReturn {
  exportPDF: (options: PDFExportOptions) => Promise<string>;
  exportStatus: Record<string, PDFExportStatus>;
  checkStatus: (exportId: string) => Promise<PDFExportStatus>;
  cancelExport: (exportId: string) => Promise<boolean>;
  downloadPDF: (exportId: string) => Promise<boolean>;
  clearExport: (exportId: string) => void;
}

const POLLING_INTERVAL = 2000; // 2秒間隔でポーリング

export function usePDFExport(): UsePDFExportReturn {
  const [exportStatus, setExportStatus] = useState<Record<string, PDFExportStatus>>({});
  const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});
  const { downloadFile } = useFileDownload();

  /**
   * ポーリングによるステータス更新を開始
   */
  const startStatusPolling = useCallback((exportId: string) => {
    if (pollingIntervals.current[exportId]) {
      clearInterval(pollingIntervals.current[exportId]);
    }

    pollingIntervals.current[exportId] = setInterval(async () => {
      try {
        const status = await checkPDFExportStatus(exportId);
        updateExportStatus(exportId, status);

        // 完了または失敗した場合はポーリングを停止
        if (status.status === 'completed' || status.status === 'failed') {
          stopStatusPolling(exportId);
        }
      } catch (error) {
        console.error('ステータスポーリングエラー:', error);
        // エラーが発生した場合もポーリングを停止
        stopStatusPolling(exportId);
      }
    }, POLLING_INTERVAL);
  }, []);

  /**
   * ポーリングを停止
   */
  const stopStatusPolling = useCallback((exportId: string) => {
    if (pollingIntervals.current[exportId]) {
      clearInterval(pollingIntervals.current[exportId]);
      delete pollingIntervals.current[exportId];
    }
  }, []);

  /**
   * エクスポート状態を更新
   */
  const updateExportStatus = useCallback((exportId: string, status: Partial<PDFExportStatus>) => {
    setExportStatus(prev => ({
      ...prev,
      [exportId]: {
        ...prev[exportId],
        ...status
      }
    }));
  }, []);

  /**
   * PDF出力を開始
   */
  const exportPDF = useCallback(async (options: PDFExportOptions): Promise<string> => {
    try {
      const result = await requestPDFGeneration(options);
      
      const initialStatus: PDFExportStatus = {
        exportId: result.exportId,
        status: result.status as 'processing' | 'completed' | 'failed',
        createdAt: new Date()
      };

      updateExportStatus(result.exportId, initialStatus);

      // 処理中の場合はポーリングを開始
      if (result.status === 'processing') {
        startStatusPolling(result.exportId);
      }

      return result.exportId;
    } catch (error) {
      console.error('PDF出力開始エラー:', error);
      throw error;
    }
  }, [startStatusPolling, updateExportStatus]);

  /**
   * PDF出力ステータスを確認
   */
  const checkStatus = useCallback(async (exportId: string): Promise<PDFExportStatus> => {
    try {
      const status = await checkPDFExportStatus(exportId);
      updateExportStatus(exportId, status);
      return status;
    } catch (error) {
      console.error('ステータス確認エラー:', error);
      throw error;
    }
  }, [updateExportStatus]);

  /**
   * PDF出力をキャンセル
   */
  const cancelExportFunc = useCallback(async (exportId: string): Promise<boolean> => {
    try {
      const result = await cancelPDFExport(exportId);
      
      if (result) {
        stopStatusPolling(exportId);
        updateExportStatus(exportId, { status: 'failed', error: 'ユーザーによってキャンセルされました' });
      }
      
      return result;
    } catch (error) {
      console.error('PDF出力キャンセルエラー:', error);
      return false;
    }
  }, [stopStatusPolling, updateExportStatus]);

  /**
   * PDFをダウンロード
   */
  const downloadPDF = useCallback(async (exportId: string): Promise<boolean> => {
    try {
      const status = exportStatus[exportId];
      
      if (!status || status.status !== 'completed') {
        console.warn('PDF生成が完了していません:', exportId);
        return false;
      }

      const downloadUrl = await getPDFDownloadUrl(exportId);
      
      // ファイル名を生成（日付ベース）
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `schedule_${dateStr}_${exportId.substring(0, 8)}.pdf`;
      
      return await downloadFile(downloadUrl, filename);
    } catch (error) {
      console.error('PDFダウンロードエラー:', error);
      return false;
    }
  }, [exportStatus, downloadFile]);

  /**
   * エクスポート情報をクリア
   */
  const clearExport = useCallback((exportId: string) => {
    stopStatusPolling(exportId);
    setExportStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[exportId];
      return newStatus;
    });
  }, [stopStatusPolling]);

  // コンポーネントのアンマウント時にポーリングをクリーンアップ
  useEffect(() => {
    return () => {
      Object.keys(pollingIntervals.current).forEach(exportId => {
        stopStatusPolling(exportId);
      });
    };
  }, [stopStatusPolling]);

  return {
    exportPDF,
    exportStatus,
    checkStatus,
    cancelExport: cancelExportFunc,
    downloadPDF,
    clearExport
  };
}