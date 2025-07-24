/**
 * useFileDownload フックのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileDownload } from '../../../../features/schedule/hooks/useFileDownload';

// ブラウザAPIをモック
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

global.URL = {
  ...global.URL,
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
} as any;

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
    style: {}
  })
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild
});

// グローバルfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useFileDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadFile', () => {
    it('URLからファイルをダウンロードする', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const { result } = renderHook(() => useFileDownload());

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error).toBe(null);

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadFile('https://example.com/test.pdf', 'test-file.pdf');
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/test.pdf');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(downloadResult!).toBe(true);
    });

    it('ファイル名が指定されていない場合、URLから推測する', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const { result } = renderHook(() => useFileDownload());

      await act(async () => {
        await result.current.downloadFile('https://example.com/files/schedule.pdf');
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/files/schedule.pdf');
      expect(mockClick).toHaveBeenCalled();
    });

    it('ダウンロード中フラグが正しく設定される', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      
      // ダウンロードを遅延させる
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              blob: async () => mockBlob
            });
          }, 100);
        })
      );

      const { result } = renderHook(() => useFileDownload());

      expect(result.current.isDownloading).toBe(false);

      const downloadPromise = act(async () => {
        return result.current.downloadFile('https://example.com/test.pdf');
      });

      // ダウンロード中はフラグがtrueになる
      expect(result.current.isDownloading).toBe(true);

      await downloadPromise;

      // ダウンロード完了後はフラグがfalseになる
      expect(result.current.isDownloading).toBe(false);
    });

    it('ダウンロードエラー時にエラー状態を設定する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const { result } = renderHook(() => useFileDownload());

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadFile('https://example.com/nonexistent.pdf');
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('ファイルのダウンロードに失敗しました');
      expect(downloadResult!).toBe(false);
    });

    it('ネットワークエラー時にエラー状態を設定する', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFileDownload());

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadFile('https://example.com/test.pdf');
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      expect(downloadResult!).toBe(false);
    });
  });

  describe('downloadBlob', () => {
    it('Blobから直接ファイルをダウンロードする', () => {
      const { result } = renderHook(() => useFileDownload());
      const mockBlob = new Blob(['test content'], { type: 'text/plain' });

      const downloadResult = result.current.downloadBlob(mockBlob, 'test-file.txt');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(downloadResult).toBe(true);
    });

    it('Blobダウンロードでエラーが発生した場合、falseを返す', () => {
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error('createObjectURL error');
      });

      const { result } = renderHook(() => useFileDownload());
      const mockBlob = new Blob(['test content'], { type: 'text/plain' });

      const downloadResult = result.current.downloadBlob(mockBlob, 'test-file.txt');

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('createObjectURL error');
      expect(downloadResult).toBe(false);
    });
  });
});