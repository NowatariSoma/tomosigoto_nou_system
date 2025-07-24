/**
 * PDF関連の型定義
 */

export interface PDFExportOptions {
  startDate: Date;
  endDate: Date;
  partIds?: number[];
  templateId?: string;
  paperSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeDetails: boolean;
  fontSize?: number;
}

export interface PDFExportStatus {
  exportId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  createdAt: Date;
  expiresAt?: Date;
  downloadUrl?: string;
}

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
  supportedOptions: {
    paperSizes: string[];
    orientations: string[];
    [key: string]: any;
  };
}

export interface PDFExportRequest {
  start_date: string;
  end_date: string;
  part_id?: number;
  template_id: string;
  paper_size: string;
  orientation: string;
  include_details: boolean;
  font_size: number;
}

export interface PDFExportResponse {
  export_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  download_url?: string;
  error_message?: string;
}