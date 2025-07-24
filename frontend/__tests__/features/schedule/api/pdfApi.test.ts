/**
 * PDF API関連のテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  requestPDFGeneration, 
  checkPDFExportStatus, 
  cancelPDFExport, 
  getPDFDownloadUrl, 
  getPDFTemplates 
} from '../../../../features/schedule/api/pdfApi';
import { PDFExportOptions, PDFExportStatus, PDFTemplate } from '../../../../features/schedule/types/pdf';

// グローバルfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('pdfApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestPDFGeneration', () => {
    it('PDF生成リクエストを正常に送信し、レスポンスを返す', async () => {
      const mockOptions: PDFExportOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        partIds: [1, 2],
        templateId: 'default',
        paperSize: 'A4',
        orientation: 'portrait',
        includeDetails: true,
        fontSize: 10
      };

      const mockResponse = {
        export_id: 'test-export-id',
        status: 'processing',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-02T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await requestPDFGeneration(mockOptions);

      expect(mockFetch).toHaveBeenCalledWith('/api/schedules/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          part_id: undefined,
          template_id: 'default',
          paper_size: 'A4',
          orientation: 'portrait',
          include_details: true,
          font_size: 10
        })
      });

      expect(result).toEqual({
        exportId: 'test-export-id',
        status: 'processing'
      });
    });

    it('APIエラー時に適切なエラーを投げる', async () => {
      const mockOptions: PDFExportOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        paperSize: 'A4',
        orientation: 'portrait',
        includeDetails: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(requestPDFGeneration(mockOptions)).rejects.toThrow('PDF生成リクエストが失敗しました: 500 Internal Server Error');
    });
  });

  describe('checkPDFExportStatus', () => {
    it('PDF出力ステータスを正常に取得する', async () => {
      const exportId = 'test-export-id';
      const mockResponse = {
        export_id: exportId,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-02T00:00:00Z',
        download_url: 'https://example.com/download/test.pdf'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await checkPDFExportStatus(exportId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/pdf-exports/${exportId}`);
      expect(result).toEqual({
        exportId: exportId,
        status: 'completed',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        expiresAt: new Date('2024-01-02T00:00:00Z'),
        downloadUrl: 'https://example.com/download/test.pdf'
      });
    });

    it('存在しないエクスポートIDでエラーを投げる', async () => {
      const exportId = 'non-existent-id';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(checkPDFExportStatus(exportId)).rejects.toThrow('PDF出力ステータスの取得に失敗しました: 404 Not Found');
    });
  });

  describe('cancelPDFExport', () => {
    it('PDF出力を正常にキャンセルする', async () => {
      const exportId = 'test-export-id';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await cancelPDFExport(exportId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/pdf-exports/${exportId}/cancel`, {
        method: 'POST'
      });
      expect(result).toBe(true);
    });
  });

  describe('getPDFDownloadUrl', () => {
    it('PDF ダウンロードURLを正常に取得する', async () => {
      const exportId = 'test-export-id';
      const expectedUrl = `/api/pdf-exports/${exportId}/download`;

      const result = await getPDFDownloadUrl(exportId);

      expect(result).toBe(expectedUrl);
    });
  });

  describe('getPDFTemplates', () => {
    it('利用可能なPDFテンプレート一覧を取得する', async () => {
      const mockTemplates: PDFTemplate[] = [
        {
          id: 'default',
          name: 'デフォルトテンプレート',
          description: '標準的なレイアウトのテンプレート',
          supportedOptions: {
            paperSizes: ['A4', 'A3'],
            orientations: ['portrait', 'landscape']
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates
      });

      const result = await getPDFTemplates();

      expect(mockFetch).toHaveBeenCalledWith('/api/pdf-exports/templates');
      expect(result).toEqual(mockTemplates);
    });

    it('テンプレート取得エラー時に適切なエラーを投げる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(getPDFTemplates()).rejects.toThrow('PDFテンプレート一覧の取得に失敗しました: 500 Internal Server Error');
    });
  });
});