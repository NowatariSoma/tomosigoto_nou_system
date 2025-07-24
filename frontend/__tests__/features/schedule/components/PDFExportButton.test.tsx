/**
 * PDFExportButton コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PDFExportButton } from '../../../../features/schedule/components/PDFExportButton';

// モック
vi.mock('../../../../features/schedule/components/PDFExportModal', () => ({
  PDFExportModal: ({ isOpen, onClose, onExport, initialOptions }: any) => (
    <div data-testid="pdf-export-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <div data-testid="modal-initial-start-date">{initialOptions?.startDate?.toISOString()}</div>
      <div data-testid="modal-initial-end-date">{initialOptions?.endDate?.toISOString()}</div>
      <div data-testid="modal-initial-view-mode">{initialOptions?.viewMode}</div>
      <div data-testid="modal-initial-part-id">{initialOptions?.selectedPartId}</div>
      <button data-testid="modal-close-button" onClick={onClose}>閉じる</button>
      <button data-testid="modal-export-button" onClick={() => onExport({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        paperSize: 'A4' as const,
        orientation: 'portrait' as const,
        includeDetails: true
      })}>出力開始</button>
    </div>
  )
}));

describe('PDFExportButton', () => {
  const defaultProps = {
    currentDateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    currentViewMode: 'month' as const,
    selectedPartId: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('PDF出力ボタンが正常に表示される', () => {
      render(<PDFExportButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('disabled=trueの場合、ボタンが無効化される', () => {
      render(<PDFExportButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toBeDisabled();
    });

    it('customClassNameが適用される', () => {
      const customClass = 'custom-pdf-button';
      render(<PDFExportButton {...defaultProps} className={customClass} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toHaveClass(customClass);
    });

    it('初期状態ではモーダルが非表示である', () => {
      render(<PDFExportButton {...defaultProps} />);
      
      const modal = screen.getByTestId('pdf-export-modal');
      expect(modal).toHaveStyle({ display: 'none' });
    });
  });

  describe('モーダル操作', () => {
    it('ボタンクリック時にモーダルが表示される', async () => {
      render(<PDFExportButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      fireEvent.click(button);

      await waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'block' });
      });
    });

    it('モーダルに正しい初期値が渡される', async () => {
      render(<PDFExportButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('modal-initial-start-date')).toHaveTextContent('2024-01-01T00:00:00.000Z');
        expect(screen.getByTestId('modal-initial-end-date')).toHaveTextContent('2024-01-31T00:00:00.000Z');
        expect(screen.getByTestId('modal-initial-view-mode')).toHaveTextContent('month');
        expect(screen.getByTestId('modal-initial-part-id')).toHaveTextContent('1');
      });
    });

    it('モーダルの閉じるボタンでモーダルが非表示になる', async () => {
      render(<PDFExportButton {...defaultProps} />);
      
      // モーダルを開く
      const button = screen.getByRole('button', { name: /PDF出力/i });
      fireEvent.click(button);

      await waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'block' });
      });

      // モーダルを閉じる
      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'none' });
      });
    });
  });

  describe('PDF出力処理', () => {
    it('モーダルからの出力開始時に適切な処理が実行される', async () => {
      render(<PDFExportButton {...defaultProps} />);
      
      // モーダルを開く
      const button = screen.getByRole('button', { name: /PDF出力/i });
      fireEvent.click(button);

      await waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'block' });
      });

      // 出力開始
      const exportButton = screen.getByTestId('modal-export-button');
      fireEvent.click(exportButton);

      // モーダルが閉じられることを確認
      await waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'none' });
      });
    });
  });

  describe('プロパティバリデーション', () => {
    it('selectedPartIdが未設定の場合も正常に動作する', () => {
      const propsWithoutPartId = {
        currentDateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        currentViewMode: 'week' as const
      };

      render(<PDFExportButton {...propsWithoutPartId} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      
      // モーダルが開くことを確認
      waitFor(() => {
        const modal = screen.getByTestId('pdf-export-modal');
        expect(modal).toHaveStyle({ display: 'block' });
        expect(screen.getByTestId('modal-initial-part-id')).toHaveTextContent('');
      });
    });

    it('異なるcurrentViewModeで正しく初期化される', async () => {
      const propsWithWeekView = {
        ...defaultProps,
        currentViewMode: 'week' as const
      };

      render(<PDFExportButton {...propsWithWeekView} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('modal-initial-view-mode')).toHaveTextContent('week');
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('ボタンに適切なARIAラベルが設定される', () => {
      render(<PDFExportButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('disabled状態でもアクセシビリティ情報が保持される', () => {
      render(<PDFExportButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /PDF出力/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});