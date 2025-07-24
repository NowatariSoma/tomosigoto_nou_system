import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionDragItem } from '../SessionDragItem';
import { Session, ScheduleConflict } from '../../types/generatedSchedule';

// モックデータ
const mockSession: Session = {
  id: 'session-1',
  title: 'Test Session',
  date: new Date('2024-01-15'),
  startTime: '09:00',
  endTime: '10:00',
  venueId: 1,
  partIds: [1, 2],
  description: 'Test description',
  status: 'confirmed',
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const mockConflicts: ScheduleConflict[] = [
  {
    id: 'conflict-1',
    type: 'venue_overlap',
    severity: 'error',
    sessionIds: ['session-1', 'session-2'],
    message: '会場の重複があります',
    affectedDate: new Date('2024-01-15'),
    affectedVenueId: 1,
  },
  {
    id: 'conflict-2',
    type: 'part_overlap',
    severity: 'warning',
    sessionIds: ['session-1'],
    message: 'パートの重複があります',
    affectedDate: new Date('2024-01-15'),
    affectedPartIds: [1],
  },
];

describe('SessionDragItem', () => {
  const defaultProps = {
    session: mockSession,
    conflicts: [],
    isDraggable: true,
    isSelected: false,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('セッション情報が正しく表示される', () => {
      render(<SessionDragItem {...defaultProps} />);

      expect(screen.getByText('Test Session')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
    });

    it('セッション説明が表示される', () => {
      render(<SessionDragItem {...defaultProps} />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('セッション説明がない場合は表示されない', () => {
      const sessionWithoutDescription = {
        ...mockSession,
        description: undefined,
      };

      render(
        <SessionDragItem
          {...defaultProps}
          session={sessionWithoutDescription}
        />
      );

      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });

  describe('選択状態', () => {
    it('選択されている場合に適切なスタイルが適用される', () => {
      render(<SessionDragItem {...defaultProps} isSelected={true} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('選択されていない場合は選択スタイルが適用されない', () => {
      render(<SessionDragItem {...defaultProps} isSelected={false} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).not.toHaveClass('ring-2', 'ring-blue-500');
    });
  });

  describe('ドラッグ機能', () => {
    it('ドラッグ可能な場合にdraggable属性がtrueになる', () => {
      render(<SessionDragItem {...defaultProps} isDraggable={true} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveAttribute('draggable', 'true');
    });

    it('ドラッグ不可の場合にdraggable属性がfalseになる', () => {
      render(<SessionDragItem {...defaultProps} isDraggable={false} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveAttribute('draggable', 'false');
    });

    it('ドラッグ開始時にdragstartイベントが発火する', () => {
      const mockDragStart = jest.fn();
      render(<SessionDragItem {...defaultProps} />);

      const sessionItem = screen.getByRole('button');
      sessionItem.addEventListener('dragstart', mockDragStart);

      fireEvent.dragStart(sessionItem);

      expect(mockDragStart).toHaveBeenCalled();
    });

    it('ドラッグ終了時にdragendイベントが発火する', () => {
      const mockDragEnd = jest.fn();
      render(<SessionDragItem {...defaultProps} />);

      const sessionItem = screen.getByRole('button');
      sessionItem.addEventListener('dragend', mockDragEnd);

      fireEvent.dragEnd(sessionItem);

      expect(mockDragEnd).toHaveBeenCalled();
    });
  });

  describe('クリック処理', () => {
    it('クリック時にonClickが呼ばれる', () => {
      const mockOnClick = jest.fn();
      render(<SessionDragItem {...defaultProps} onClick={mockOnClick} />);

      const sessionItem = screen.getByRole('button');
      fireEvent.click(sessionItem);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('ドラッグ中でなければクリックが発火する', () => {
      const mockOnClick = jest.fn();
      render(<SessionDragItem {...defaultProps} onClick={mockOnClick} />);

      const sessionItem = screen.getByRole('button');
      
      // 通常のクリック
      fireEvent.click(sessionItem);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('競合表示', () => {
    it('エラー競合がある場合に赤い境界線が表示される', () => {
      const errorConflicts = [
        {
          ...mockConflicts[0],
          severity: 'error' as const,
        },
      ];

      render(
        <SessionDragItem
          {...defaultProps}
          conflicts={errorConflicts}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('border-red-500');
    });

    it('警告競合がある場合に黄色い境界線が表示される', () => {
      const warningConflicts = [
        {
          ...mockConflicts[1],
          severity: 'warning' as const,
        },
      ];

      render(
        <SessionDragItem
          {...defaultProps}
          conflicts={warningConflicts}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('border-yellow-500');
    });

    it('情報レベル競合がある場合に青い境界線が表示される', () => {
      const infoConflicts = [
        {
          ...mockConflicts[0],
          severity: 'info' as const,
        },
      ];

      render(
        <SessionDragItem
          {...defaultProps}
          conflicts={infoConflicts}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('border-blue-500');
    });

    it('複数の競合がある場合は最も重大なものが優先される', () => {
      const mixedConflicts = [
        { ...mockConflicts[1], severity: 'warning' as const },
        { ...mockConflicts[0], severity: 'error' as const },
      ];

      render(
        <SessionDragItem
          {...defaultProps}
          conflicts={mixedConflicts}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('border-red-500'); // errorが優先
    });

    it('競合がない場合は通常の境界線が表示される', () => {
      render(<SessionDragItem {...defaultProps} conflicts={[]} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('border-gray-200');
    });
  });

  describe('セッション状態表示', () => {
    it('確定状態のセッションは通常のスタイル', () => {
      render(<SessionDragItem {...defaultProps} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('bg-white');
    });

    it('仮予約状態のセッションは薄いスタイル', () => {
      const tentativeSession = {
        ...mockSession,
        status: 'tentative' as const,
      };

      render(
        <SessionDragItem
          {...defaultProps}
          session={tentativeSession}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('bg-gray-50', 'opacity-75');
    });

    it('キャンセル状態のセッションは無効化されたスタイル', () => {
      const cancelledSession = {
        ...mockSession,
        status: 'cancelled' as const,
      };

      render(
        <SessionDragItem
          {...defaultProps}
          session={cancelledSession}
        />
      );

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveClass('bg-gray-100', 'opacity-50');
    });
  });

  describe('カスタムスタイル', () => {
    it('カスタムスタイルが適用される', () => {
      const customStyle = {
        backgroundColor: 'red',
        width: '200px',
      };

      render(<SessionDragItem {...defaultProps} style={customStyle} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveStyle({
        backgroundColor: 'red',
        width: '200px',
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定される', () => {
      render(<SessionDragItem {...defaultProps} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveAttribute('aria-label', 
        expect.stringContaining('Test Session')
      );
    });

    it('選択状態がaria-selectedで示される', () => {
      render(<SessionDragItem {...defaultProps} isSelected={true} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveAttribute('aria-selected', 'true');
    });

    it('ドラッグ可能状態がaria-grabbedで示される', () => {
      render(<SessionDragItem {...defaultProps} isDraggable={true} />);

      const sessionItem = screen.getByRole('button');
      expect(sessionItem).toHaveAttribute('aria-grabbed', 'false');
    });
  });
});