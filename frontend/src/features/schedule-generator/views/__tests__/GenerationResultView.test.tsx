import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerationResultView } from '../GenerationResultView';
import { GeneratedSchedule, RegenerationParams } from '../../types/generatedSchedule';

// モック作成
jest.mock('../../../hooks/useScheduleDrag', () => ({
  useScheduleDrag: () => ({
    draggedSession: null,
    dragPreview: null,
    startDrag: jest.fn(),
    updateDragPosition: jest.fn(),
    endDrag: jest.fn(),
    isDragInProgress: false,
    isValidDropTarget: jest.fn(() => true),
  }),
}));

jest.mock('../../../hooks/useChangeHistory', () => ({
  useChangeHistory: () => ({
    history: [],
    currentIndex: -1,
    canUndo: false,
    canRedo: false,
    addChange: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    clearHistory: jest.fn(),
  }),
}));

// モックデータ
const mockSchedule: GeneratedSchedule = {
  id: 'test-schedule',
  name: 'テストスケジュール',
  sessions: [
    {
      id: 'session-1',
      title: 'セッション1',
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '10:00',
      venueId: 1,
      partIds: [1],
      status: 'confirmed',
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: 'session-2',
      title: 'セッション2',
      date: new Date('2024-01-15'),
      startTime: '10:30',
      endTime: '11:30',
      venueId: 2,
      partIds: [2],
      status: 'confirmed',
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
  ],
  venues: [
    { id: 1, name: '会場A', capacity: 50, location: 'ビル1' },
    { id: 2, name: '会場B', capacity: 30, location: 'ビル2' },
  ],
  parts: [
    { id: 1, name: 'パートA', color: '#FF0000' },
    { id: 2, name: 'パートB', color: '#00FF00' },
  ],
  conflicts: [],
  optimizationScore: {
    total: 85,
    breakdown: {
      venueUtilization: 80,
      partBalance: 90,
      timeEfficiency: 85,
      conflictPenalty: 0,
    },
    suggestions: ['会場の利用率を向上させる余地があります'],
  },
  generatedAt: new Date(),
  version: 1,
};

describe('GenerationResultView', () => {
  const defaultProps = {
    generatedSchedule: mockSchedule,
    onScheduleConfirm: jest.fn(),
    onRegenerateRequest: jest.fn(),
    readOnly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('スケジュール名が表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('テストスケジュール')).toBeInTheDocument();
    });

    it('最適化スコアが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('最適化スコア')).toBeInTheDocument();
    });

    it('セッション数が表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('2件のセッション')).toBeInTheDocument();
    });
  });

  describe('表示モード切り替え', () => {
    it('月表示ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('月表示')).toBeInTheDocument();
    });

    it('週表示ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('週表示')).toBeInTheDocument();
    });

    it('日表示ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('日表示')).toBeInTheDocument();
    });

    it('リスト表示ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('リスト表示')).toBeInTheDocument();
    });

    it('表示モードを切り替えられる', () => {
      render(<GenerationResultView {...defaultProps} />);

      const weekButton = screen.getByText('週表示');
      fireEvent.click(weekButton);

      expect(weekButton).toHaveClass('bg-blue-500', 'text-white');
    });

    describe('月表示ビュー', () => {
      it('月表示モードでカレンダーグリッドが表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const monthButton = screen.getByText('月表示');
        fireEvent.click(monthButton);
        
        expect(screen.getByTestId('month-calendar-grid')).toBeInTheDocument();
      });

      it('月表示でセッションが日付セルに表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const monthButton = screen.getByText('月表示');
        fireEvent.click(monthButton);
        
        expect(screen.getByTestId('calendar-session-session-1')).toBeInTheDocument();
        expect(screen.getByTestId('calendar-session-session-2')).toBeInTheDocument();
      });

      it('月表示で前月・次月ナビゲーションができる', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const monthButton = screen.getByText('月表示');
        fireEvent.click(monthButton);
        
        const prevButton = screen.getByLabelText('前の期間');
        const nextButton = screen.getByLabelText('次の期間');
        
        fireEvent.click(nextButton);
        fireEvent.click(prevButton);
        
        expect(screen.getByTestId('month-calendar-grid')).toBeInTheDocument();
      });
    });

    describe('週表示ビュー', () => {
      it('週表示モードで週グリッドが表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const weekButton = screen.getByText('週表示');
        fireEvent.click(weekButton);
        
        expect(screen.getByTestId('week-schedule-grid')).toBeInTheDocument();
      });

      it('週表示で7日分の曜日ヘッダーが表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const weekButton = screen.getByText('週表示');
        fireEvent.click(weekButton);
        
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        weekdays.forEach(day => {
          expect(screen.getByText(day)).toBeInTheDocument();
        });
      });

      it('週表示でセッションが時間軸に配置される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const weekButton = screen.getByText('週表示');
        fireEvent.click(weekButton);
        
        expect(screen.getByTestId('week-session-session-1')).toBeInTheDocument();
        expect(screen.getByTestId('week-session-session-2')).toBeInTheDocument();
      });
    });

    describe('日表示ビュー', () => {
      it('日表示モードで時間軸スケジュールが表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const dayButton = screen.getByText('日表示');
        fireEvent.click(dayButton);
        
        expect(screen.getByTestId('day-schedule-timeline')).toBeInTheDocument();
      });

      it('日表示で時間スロットが表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const dayButton = screen.getByText('日表示');
        fireEvent.click(dayButton);
        
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });

      it('日表示で選択日のセッションのみ表示される', () => {
        render(<GenerationResultView {...defaultProps} />);
        
        const dayButton = screen.getByText('日表示');
        fireEvent.click(dayButton);
        
        // 選択された日のセッションが表示される
        expect(screen.getByTestId('day-session-session-1')).toBeInTheDocument();
      });
    });
  });

  describe('フィルタリング機能', () => {
    it('会場フィルターが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('会場A')).toBeInTheDocument();
      expect(screen.getByText('会場B')).toBeInTheDocument();
    });

    it('パートフィルターが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('パートA')).toBeInTheDocument();
      expect(screen.getByText('パートB')).toBeInTheDocument();
    });

    it('会場フィルターを選択できる', () => {
      render(<GenerationResultView {...defaultProps} />);

      const venueFilter = screen.getByLabelText('会場A');
      fireEvent.click(venueFilter);

      expect(venueFilter).toBeChecked();
    });

    it('パートフィルターを選択できる', () => {
      render(<GenerationResultView {...defaultProps} />);

      const partFilter = screen.getByLabelText('パートA');
      fireEvent.click(partFilter);

      expect(partFilter).toBeChecked();
    });
  });

  describe('操作ボタン', () => {
    it('読み取り専用でない場合に確定ボタンが表示される', () => {
      render(<GenerationResultView {...defaultProps} readOnly={false} />);

      expect(screen.getByText('スケジュール確定')).toBeInTheDocument();
    });

    it('読み取り専用の場合に確定ボタンが表示されない', () => {
      render(<GenerationResultView {...defaultProps} readOnly={true} />);

      expect(screen.queryByText('スケジュール確定')).not.toBeInTheDocument();
    });

    it('再生成ボタンが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('再生成')).toBeInTheDocument();
    });

    it('確定ボタンクリックでonScheduleConfirmが呼ばれる', () => {
      const mockOnConfirm = jest.fn();
      render(
        <GenerationResultView
          {...defaultProps}
          onScheduleConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('スケジュール確定');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(mockSchedule);
    });

    it('再生成ボタンクリックでonRegenerateRequestが呼ばれる', () => {
      const mockOnRegenerate = jest.fn();
      render(
        <GenerationResultView
          {...defaultProps}
          onRegenerateRequest={mockOnRegenerate}
        />
      );

      const regenerateButton = screen.getByText('再生成');
      fireEvent.click(regenerateButton);

      expect(mockOnRegenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.any(Object),
          venueIds: expect.any(Array),
          partIds: expect.any(Array),
        })
      );
    });
  });

  describe('変更履歴操作', () => {
    it('Undoボタンが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByLabelText('元に戻す')).toBeInTheDocument();
    });

    it('Redoボタンが表示される', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByLabelText('やり直し')).toBeInTheDocument();
    });

    it('変更履歴パネルトグルボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('変更履歴')).toBeInTheDocument();
    });

    it('変更履歴パネルを開閉できる', () => {
      render(<GenerationResultView {...defaultProps} />);

      const historyButton = screen.getByText('変更履歴');
      fireEvent.click(historyButton);

      expect(screen.getByTestId('change-history-panel')).toBeInTheDocument();
    });
  });

  describe('セッション編集モーダル', () => {
    it('セッションクリックで編集モーダルが開く', async () => {
      render(<GenerationResultView {...defaultProps} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      await waitFor(() => {
        expect(screen.getByTestId('session-edit-modal')).toBeInTheDocument();
      });
    });

    it('読み取り専用の場合はモーダルが開かない', () => {
      render(<GenerationResultView {...defaultProps} readOnly={true} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      expect(screen.queryByTestId('session-edit-modal')).not.toBeInTheDocument();
    });

    it('編集モーダルにセッション情報が表示される', async () => {
      render(<GenerationResultView {...defaultProps} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      await waitFor(() => {
        expect(screen.getByTestId('session-edit-modal')).toBeInTheDocument();
        expect(screen.getByDisplayValue('セッション1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
      });
    });

    it('編集モーダルで保存ボタンをクリックできる', async () => {
      render(<GenerationResultView {...defaultProps} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      await waitFor(() => {
        const saveButton = screen.getByText('保存');
        expect(saveButton).toBeInTheDocument();
        fireEvent.click(saveButton);
      });
    });

    it('編集モーダルでキャンセルボタンをクリックするとモーダルが閉じる', async () => {
      render(<GenerationResultView {...defaultProps} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      await waitFor(() => {
        const cancelButton = screen.getByText('キャンセル');
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('session-edit-modal')).not.toBeInTheDocument();
      });
    });

    it('編集モーダルでセッション情報を変更できる', async () => {
      render(<GenerationResultView {...defaultProps} />);

      const session = screen.getByText('セッション1');
      fireEvent.click(session);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('セッション1');
        fireEvent.change(titleInput, { target: { value: '更新されたセッション1' } });
        
        const saveButton = screen.getByText('保存');
        fireEvent.click(saveButton);
      });
    });
  });

  describe('競合表示', () => {
    it('競合がない場合は警告が表示されない', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.queryByText('競合が検出されました')).not.toBeInTheDocument();
    });

    it('競合がある場合は警告が表示される', () => {
      const scheduleWithConflicts = {
        ...mockSchedule,
        conflicts: [
          {
            id: 'conflict-1',
            type: 'venue_overlap' as const,
            severity: 'error' as const,
            sessionIds: ['session-1', 'session-2'],
            message: '会場の重複があります',
            affectedDate: new Date('2024-01-15'),
            affectedVenueId: 1,
          },
        ],
      };

      render(
        <GenerationResultView
          {...defaultProps}
          generatedSchedule={scheduleWithConflicts}
        />
      );

      expect(screen.getByText('1件の競合が検出されました')).toBeInTheDocument();
    });
  });

  describe('日付ナビゲーション', () => {
    it('前の期間ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByLabelText('前の期間')).toBeInTheDocument();
    });

    it('次の期間ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByLabelText('次の期間')).toBeInTheDocument();
    });

    it('今日ボタンがある', () => {
      render(<GenerationResultView {...defaultProps} />);

      expect(screen.getByText('今日')).toBeInTheDocument();
    });

    it('日付ナビゲーションボタンをクリックできる', () => {
      render(<GenerationResultView {...defaultProps} />);

      const nextButton = screen.getByLabelText('次の期間');
      fireEvent.click(nextButton);

      // ビューが更新されることを確認（日付表示の変更など）
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('エラー処理', () => {
    it('無効なスケジュールデータでもエラーなく表示される', () => {
      const invalidSchedule = {
        ...mockSchedule,
        sessions: [],
      };

      expect(() => {
        render(
          <GenerationResultView
            {...defaultProps}
            generatedSchedule={invalidSchedule}
          />
        );
      }).not.toThrow();
    });

    it('コールバック関数が未定義でもエラーなく動作する', () => {
      expect(() => {
        render(
          <GenerationResultView
            {...defaultProps}
            onScheduleConfirm={undefined as any}
            onRegenerateRequest={undefined as any}
          />
        );
      }).not.toThrow();
    });
  });
});