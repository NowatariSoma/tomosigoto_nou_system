/**
 * usePDFExport フックのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDFExport } from '../../../../features/schedule/hooks/usePDFExport';
import { PDFExportOptions } from '../../../../features/schedule/types/pdf';
import * as pdfApi from '../../../../features/schedule/api/pdfApi';
import * as useFileDownload from '../../../../features/schedule/hooks/useFileDownload';

// APIをモック
vi.mock('../../../../features/schedule/api/pdfApi');
vi.mock('../../../../features/schedule/hooks/useFileDownload');

const mockRequestPDFGeneration = vi.mocked(pdfApi.requestPDFGeneration);
const mockCheckPDFExportStatus = vi.mocked(pdfApi.checkPDFExportStatus);
const mockCancelPDFExport = vi.mocked(pdfApi.cancelPDFExport);
const mockGetPDFDownloadUrl = vi.mocked(pdfApi.getPDFDownloadUrl);

const mockUseFileDownload = vi.mocked(useFileDownload.useFileDownload);

describe('usePDFExport', () => {
  const mockDownloadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // useFileDownloadフックのモック
    mockUseFileDownload.mockReturnValue({
      downloadFile: mockDownloadFile,
      downloadBlob: vi.fn(),
      isDownloading: false,
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('exportPDF', () => {
    it('PDF出力を正常に開始し、エクスポートIDを返す', async () => {
      const mockOptions: PDFExportOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        paperSize: 'A4',
        orientation: 'portrait',
        includeDetails: true
      };

      mockRequestPDFGeneration.mockResolvedValueOnce({
        exportId: 'test-export-id',
        status: 'processing'
      });

      const { result } = renderHook(() => usePDFExport());

      let exportId: string;
      await act(async () => {
        exportId = await result.current.exportPDF(mockOptions);
      });

      expect(mockRequestPDFGeneration).toHaveBeenCalledWith(mockOptions);
      expect(exportId!).toBe('test-export-id');
      expect(result.current.exportStatus['test-export-id']).toEqual({
        exportId: 'test-export-id',
        status: 'processing',
        createdAt: expect.any(Date)
      });
    });

    it('PDF出力開始時にエラーが発生した場合、例外を投げる', async () => {
      const mockOptions: PDFExportOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        paperSize: 'A4',
        orientation: 'portrait',
        includeDetails: true
      };

      mockRequestPDFGeneration.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => usePDFExport());

      await expect(async () => {
        await act(async () => {
          await result.current.exportPDF(mockOptions);
        });
      }).rejects.toThrow('API Error');
    });
  });

  describe('checkStatus', () => {
    it('PDF出力ステータスを正常に取得し、状態を更新する', async () => {
      const exportId = 'test-export-id';
      const mockStatus = {
        exportId,
        status: 'completed' as const,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        expiresAt: new Date('2024-01-02T00:00:00Z'),
        downloadUrl: 'https://example.com/download/test.pdf'
      };

      mockCheckPDFExportStatus.mockResolvedValueOnce(mockStatus);

      const { result } = renderHook(() => usePDFExport());

      // 初期状態を設定
      await act(async () => {
        result.current.exportPDF({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          paperSize: 'A4',
          orientation: 'portrait',
          includeDetails: true
        });
      });

      let status;
      await act(async () => {
        status = await result.current.checkStatus(exportId);
      });

      expect(mockCheckPDFExportStatus).toHaveBeenCalledWith(exportId);
      expect(status).toEqual(mockStatus);
      expect(result.current.exportStatus[exportId]).toEqual(mockStatus);
    });

    it('存在しないエクスポートIDでエラーを投げる', async () => {
      const exportId = 'non-existent-id';

      mockCheckPDFExportStatus.mockRejectedValueOnce(new Error('Not Found'));

      const { result } = renderHook(() => usePDFExport());

      await expect(async () => {
        await act(async () => {
          await result.current.checkStatus(exportId);
        });
      }).rejects.toThrow('Not Found');
    });
  });

  describe('cancelExport', () => {
    it('PDF出力を正常にキャンセルする', async () => {
      const exportId = 'test-export-id';

      mockCancelPDFExport.mockResolvedValueOnce(true);

      const { result } = renderHook(() => usePDFExport());

      // 初期状態を設定
      await act(async () => {
        await result.current.exportPDF({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          paperSize: 'A4',
          orientation: 'portrait',
          includeDetails: true
        });
      });

      let cancelResult: boolean;
      await act(async () => {
        cancelResult = await result.current.cancelExport(exportId);
      });

      expect(mockCancelPDFExport).toHaveBeenCalledWith(exportId);
      expect(cancelResult!).toBe(true);
    });
  });

  describe('downloadPDF', () => {
    it('完了したPDFを正常にダウンロードする', async () => {
      const exportId = 'test-export-id';
      const downloadUrl = `/api/pdf-exports/${exportId}/download`;

      mockGetPDFDownloadUrl.mockResolvedValueOnce(downloadUrl);
      mockDownloadFile.mockResolvedValueOnce(true);

      const { result } = renderHook(() => usePDFExport());

      // 完了状態のエクスポートを設定
      await act(async () => {
        result.current.exportStatus[exportId] = {
          exportId,
          status: 'completed',
          createdAt: new Date(),
          downloadUrl
        };
      });

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadPDF(exportId);
      });

      expect(mockGetPDFDownloadUrl).toHaveBeenCalledWith(exportId);
      expect(mockDownloadFile).toHaveBeenCalledWith(downloadUrl, expect.any(String));
      expect(downloadResult!).toBe(true);
    });

    it('未完了のPDFのダウンロード時にfalseを返す', async () => {
      const exportId = 'test-export-id';

      const { result } = renderHook(() => usePDFExport());

      // 処理中状態のエクスポートを設定
      await act(async () => {
        result.current.exportStatus[exportId] = {
          exportId,
          status: 'processing',
          createdAt: new Date()
        };
      });

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadPDF(exportId);
      });

      expect(downloadResult!).toBe(false);
      expect(mockDownloadFile).not.toHaveBeenCalled();
    });
  });

  describe('clearExport', () => {
    it('エクスポート情報を正常にクリアする', async () => {
      const exportId = 'test-export-id';

      const { result } = renderHook(() => usePDFExport());

      // エクスポート状態を設定
      await act(async () => {
        result.current.exportStatus[exportId] = {
          exportId,
          status: 'completed',
          createdAt: new Date()
        };
      });

      expect(result.current.exportStatus[exportId]).toBeDefined();

      act(() => {
        result.current.clearExport(exportId);
      });

      expect(result.current.exportStatus[exportId]).toBeUndefined();
    });
  });

  describe('statusPolling', () => {
    it('処理中の出力に対して定期的にステータスをポーリングする', async () => {
      const exportId = 'test-export-id';

      mockRequestPDFGeneration.mockResolvedValueOnce({
        exportId,
        status: 'processing'
      });

      // 最初は処理中、2回目で完了を返す
      mockCheckPDFExportStatus
        .mockResolvedValueOnce({
          exportId,
          status: 'processing',
          createdAt: new Date(),
          progress: 50
        })
        .mockResolvedValueOnce({
          exportId,
          status: 'completed',
          createdAt: new Date(),
          downloadUrl: 'https://example.com/download/test.pdf'
        });

      const { result } = renderHook(() => usePDFExport());

      await act(async () => {
        await result.current.exportPDF({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          paperSize: 'A4',
          orientation: 'portrait',
          includeDetails: true
        });
      });

      // 2秒経過させる（ポーリング間隔）
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await waitFor(() => {
          expect(mockCheckPDFExportStatus).toHaveBeenCalledTimes(1);
        });
      });

      // さらに2秒経過させる
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await waitFor(() => {
          expect(mockCheckPDFExportStatus).toHaveBeenCalledTimes(2);
        });
      });

      // 完了状態になったらポーリングが停止する
      expect(result.current.exportStatus[exportId].status).toBe('completed');
    });
  });
});