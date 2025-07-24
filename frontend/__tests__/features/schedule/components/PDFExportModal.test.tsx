/**
 * PDFExportModal コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PDFExportModal } from '../../../../features/schedule/components/PDFExportModal';
import { PDFExportOptions, PDFExportStatus } from '../../../../features/schedule/types/pdf';

describe('PDFExportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnExport = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onExport: mockOnExport,
    initialOptions: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      paperSize: 'A4' as const,
      orientation: 'portrait' as const,
      includeDetails: true
    } as Partial<PDFExportOptions>
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが開いている時に正常に表示される', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('PDF出力設定')).toBeInTheDocument();
    });

    it('モーダルが閉じている時は表示されない', () => {
      render(<PDFExportModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('初期オプションが正しくフォームに反映される', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      // 日付範囲の確認
      const startDateInput = screen.getByLabelText(/開始日/i);
      const endDateInput = screen.getByLabelText(/終了日/i);
      expect(startDateInput).toHaveValue('2024-01-01');
      expect(endDateInput).toHaveValue('2024-01-31');

      // 用紙サイズの確認
      const paperSizeSelect = screen.getByLabelText(/用紙サイズ/i);
      expect(paperSizeSelect).toHaveValue('A4');

      // 向きの確認
      const orientationSelect = screen.getByLabelText(/用紙の向き/i);
      expect(orientationSelect).toHaveValue('portrait');

      // 詳細情報の確認
      const includeDetailsCheckbox = screen.getByLabelText(/詳細情報を含める/i);
      expect(includeDetailsCheckbox).toBeChecked();
    });
  });

  describe('フォーム操作', () => {
    it('日付範囲を変更できる', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText(/開始日/i);
      const endDateInput = screen.getByLabelText(/終了日/i);

      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-02-29' } });

      expect(startDateInput).toHaveValue('2024-02-01');
      expect(endDateInput).toHaveValue('2024-02-29');
    });

    it('用紙サイズを変更できる', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const paperSizeSelect = screen.getByLabelText(/用紙サイズ/i);
      fireEvent.change(paperSizeSelect, { target: { value: 'A3' } });

      expect(paperSizeSelect).toHaveValue('A3');
    });

    it('用紙の向きを変更できる', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const orientationSelect = screen.getByLabelText(/用紙の向き/i);
      fireEvent.change(orientationSelect, { target: { value: 'landscape' } });

      expect(orientationSelect).toHaveValue('landscape');
    });

    it('詳細情報の表示設定を切り替えられる', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const includeDetailsCheckbox = screen.getByLabelText(/詳細情報を含める/i);
      fireEvent.click(includeDetailsCheckbox);

      expect(includeDetailsCheckbox).not.toBeChecked();
    });
  });

  describe('バリデーション', () => {
    it('開始日が終了日より後の場合、エラーメッセージが表示される', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText(/開始日/i);
      const endDateInput = screen.getByLabelText(/終了日/i);

      fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });

      // フォームのバリデーションをトリガー
      const exportButton = screen.getByRole('button', { name: /出力開始/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/終了日は開始日以降である必要があります/i)).toBeInTheDocument();
      });

      // onExportが呼ばれないことを確認
      expect(mockOnExport).not.toHaveBeenCalled();
    });

    it('日付範囲が90日を超える場合、警告メッセージが表示される', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText(/開始日/i);
      const endDateInput = screen.getByLabelText(/終了日/i);

      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-06-01' } });

      await waitFor(() => {
        expect(screen.getByText(/日付範囲が長いため、PDF生成に時間がかかる場合があります/i)).toBeInTheDocument();
      });
    });
  });

  describe('出力処理', () => {
    it('有効なオプションで出力開始ボタンをクリックすると、onExportが呼ばれる', async () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /出力開始/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          paperSize: 'A4',
          orientation: 'portrait',
          includeDetails: true,
          templateId: 'default',
          fontSize: 10
        });
      });
    });

    it('出力処理中は出力ボタンが無効化される', () => {
      const exportStatus: PDFExportStatus = {
        exportId: 'test-export-id',
        status: 'processing',
        createdAt: new Date(),
        progress: 50
      };

      render(<PDFExportModal {...defaultProps} exportStatus={exportStatus} />);
      
      const exportButton = screen.getByRole('button', { name: /出力開始/i });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('進行状況表示', () => {
    it('PDF生成中に進行状況が表示される', () => {
      const exportStatus: PDFExportStatus = {
        exportId: 'test-export-id',
        status: 'processing',
        createdAt: new Date(),
        progress: 75
      };

      render(<PDFExportModal {...defaultProps} exportStatus={exportStatus} />);
      
      expect(screen.getByText('PDF生成中...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      
      // プログレスバーの確認
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('value', '75');
    });

    it('PDF生成完了時に成功メッセージとダウンロードボタンが表示される', () => {
      const exportStatus: PDFExportStatus = {
        exportId: 'test-export-id',
        status: 'completed',
        createdAt: new Date(),
        downloadUrl: 'https://example.com/download/test.pdf'
      };

      render(<PDFExportModal {...defaultProps} exportStatus={exportStatus} />);
      
      expect(screen.getByText('PDF生成が完了しました')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ダウンロード/i })).toBeInTheDocument();
    });

    it('PDF生成失敗時にエラーメッセージとリトライボタンが表示される', () => {
      const exportStatus: PDFExportStatus = {
        exportId: 'test-export-id',
        status: 'failed',
        createdAt: new Date(),
        error: 'サーバーエラーが発生しました'
      };

      render(<PDFExportModal {...defaultProps} exportStatus={exportStatus} />);
      
      expect(screen.getByText('PDF生成に失敗しました')).toBeInTheDocument();
      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();
    });
  });

  describe('モーダル操作', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('オーバーレイをクリックするとモーダルが閉じる', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('Escキーでモーダルが閉じる', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('モーダルに適切なARIA属性が設定される', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('フォーム要素に適切なラベルが関連付けられる', () => {
      render(<PDFExportModal {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText(/開始日/i);
      const endDateInput = screen.getByLabelText(/終了日/i);
      const paperSizeSelect = screen.getByLabelText(/用紙サイズ/i);
      const orientationSelect = screen.getByLabelText(/用紙の向き/i);
      const includeDetailsCheckbox = screen.getByLabelText(/詳細情報を含める/i);

      expect(startDateInput).toBeInTheDocument();
      expect(endDateInput).toBeInTheDocument();
      expect(paperSizeSelect).toBeInTheDocument();
      expect(orientationSelect).toBeInTheDocument();
      expect(includeDetailsCheckbox).toBeInTheDocument();
    });
  });
});