/**
 * ファイルダウンロード処理を行うカスタムフック
 */
import { useState, useCallback } from 'react';

interface UseFileDownloadReturn {
  downloadFile: (url: string, filename?: string) => Promise<boolean>;
  downloadBlob: (blob: Blob, filename: string) => boolean;
  isDownloading: boolean;
  error: Error | null;
}

export function useFileDownload(): UseFileDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * URLからファイルをダウンロード
   */
  const downloadFile = useCallback(async (url: string, filename?: string): Promise<boolean> => {
    try {
      setIsDownloading(true);
      setError(null);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ファイルのダウンロードに失敗しました: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // ファイル名を決定
      let finalFilename = filename;
      if (!finalFilename) {
        // URLからファイル名を推測
        const urlParts = url.split('/');
        finalFilename = urlParts[urlParts.length - 1] || 'download';
        
        // Content-Dispositionヘッダーからファイル名を取得
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            finalFilename = filenameMatch[1];
          }
        }
      }

      return downloadBlob(blob, finalFilename);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('ダウンロードエラーが発生しました');
      setError(error);
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  /**
   * Blobから直接ファイルをダウンロード
   */
  const downloadBlob = useCallback((blob: Blob, filename: string): boolean => {
    try {
      setError(null);

      // Blob URLを作成
      const url = URL.createObjectURL(blob);

      // ダウンロード用のアンカー要素を作成
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // DOMに追加してクリック
      document.body.appendChild(link);
      link.click();

      // リソースをクリーンアップ
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Blobダウンロードエラーが発生しました');
      setError(error);
      return false;
    }
  }, []);

  return {
    downloadFile,
    downloadBlob,
    isDownloading,
    error
  };
}