/**
 * PDF関連API呼び出し関数
 */
import { 
  PDFExportOptions, 
  PDFExportStatus, 
  PDFTemplate, 
  PDFExportRequest, 
  PDFExportResponse 
} from '../types/pdf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * PDF生成リクエストを送信
 */
export async function requestPDFGeneration(options: PDFExportOptions): Promise<{ exportId: string; status: string }> {
  const requestBody: PDFExportRequest = {
    start_date: options.startDate.toISOString().split('T')[0],
    end_date: options.endDate.toISOString().split('T')[0],
    part_id: options.partIds?.[0], // 現在のAPIは単一パートのみサポート
    template_id: options.templateId || 'default',
    paper_size: options.paperSize,
    orientation: options.orientation,
    include_details: options.includeDetails,
    font_size: options.fontSize || 10
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/export-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`PDF生成リクエストが失敗しました: ${response.status} ${response.statusText}`);
    }

    const data: PDFExportResponse = await response.json();
    
    return {
      exportId: data.export_id,
      status: data.status
    };
  } catch (error) {
    console.error('PDF生成リクエストエラー:', error);
    throw error;
  }
}

/**
 * PDF出力ステータスを確認
 */
export async function checkPDFExportStatus(exportId: string): Promise<PDFExportStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-exports/${exportId}`);

    if (!response.ok) {
      throw new Error(`PDF出力ステータスの取得に失敗しました: ${response.status} ${response.statusText}`);
    }

    const data: PDFExportResponse = await response.json();
    
    return {
      exportId: data.export_id,
      status: data.status as 'processing' | 'completed' | 'failed',
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      downloadUrl: data.download_url,
      error: data.error_message
    };
  } catch (error) {
    console.error('PDF出力ステータス取得エラー:', error);
    throw error;
  }
}

/**
 * PDF出力をキャンセル
 */
export async function cancelPDFExport(exportId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-exports/${exportId}/cancel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`PDF出力のキャンセルに失敗しました: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.success || true;
  } catch (error) {
    console.error('PDF出力キャンセルエラー:', error);
    return false;
  }
}

/**
 * PDFダウンロードURLを取得
 */
export async function getPDFDownloadUrl(exportId: string): Promise<string> {
  // ダウンロードURLは直接エンドポイントを指す
  return `${API_BASE_URL}/api/pdf-exports/${exportId}/download`;
}

/**
 * 利用可能なPDFテンプレート一覧を取得
 */
export async function getPDFTemplates(): Promise<PDFTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-exports/templates`);

    if (!response.ok) {
      throw new Error(`PDFテンプレート一覧の取得に失敗しました: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('PDFテンプレート一覧取得エラー:', error);
    throw error;
  }
}