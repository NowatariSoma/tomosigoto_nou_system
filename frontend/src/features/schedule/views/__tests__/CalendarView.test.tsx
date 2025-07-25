/**
 * CalendarView.tsxのテスト
 * TDD方式：実装コードなしでテスト仕様を先に定義
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarView } from '../CalendarView';

// 子コンポーネントをモック
jest.mock('../../components/MonthCalendar', () => ({
  MonthCalendar: ({ onDateClick, onSessionClick }: any) => (
    <div data-testid="month-calendar">
      <button onClick={() => onDateClick(new Date(2024, 0, 15))}>
        Mock Month Calendar
      </button>
      <button onClick={() => onSessionClick({ id: '1', title: 'Test Session' })}>
        Test Session
      </button>
    </div>
  )
}));

jest.mock('../../components/WeekCalendar', () => ({
  WeekCalendar: ({ onSessionClick }: any) => (
    <div data-testid="week-calendar">
      <button onClick={() => onSessionClick({ id: '1', title: 'Test Session' })}>
        Mock Week Calendar
      </button>
    </div>
  )
}));

jest.mock('../../hooks/useCalendarData', () => ({
  useCalendarData: jest.fn()
}));

describe('CalendarView', () => {
  const mockUseCalendarData = require('../../hooks/useCalendarData').useCalendarData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCalendarData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  describe('初期表示', () => {
    test('デフォルトで月間カレンダーを表示', () => {
      render(<CalendarView />);
      
      expect(screen.getByTestId('month-calendar')).toBeInTheDocument();
      expect(screen.queryByTestId('week-calendar')).not.toBeInTheDocument();
    });

    test('月間/週間の切り替えボタンを表示', () => {
      render(<CalendarView />);
      
      expect(screen.getByRole('button', { name: /月/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /週/ })).toBeInTheDocument();
    });

    test('前後ナビゲーションボタンを表示', () => {
      render(<CalendarView />);
      
      const prevButton = screen.getByRole('button', { name: /前/ });
      const nextButton = screen.getByRole('button', { name: /次/ });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    test('今日ボタンを表示', () => {
      render(<CalendarView />);
      
      expect(screen.getByRole('button', { name: '今日' })).toBeInTheDocument();
    });

    test('現在の表示範囲をタイトルに表示', () => {
      render(<CalendarView />);
      
      // 現在月のタイトルが表示されることを確認
      const currentDate = new Date();
      const expectedTitle = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    });
  });

  describe('ビューモード切り替え', () => {
    test('週間ボタンクリック時に週間カレンダーに切り替え', () => {
      render(<CalendarView />);
      
      const weekButton = screen.getByRole('button', { name: /週/ });
      fireEvent.click(weekButton);
      
      expect(screen.getByTestId('week-calendar')).toBeInTheDocument();
      expect(screen.queryByTestId('month-calendar')).not.toBeInTheDocument();
    });

    test('月間ボタンクリック時に月間カレンダーに切り替え', () => {
      render(<CalendarView initialViewMode="week" />);
      
      const monthButton = screen.getByRole('button', { name: /月/ });
      fireEvent.click(monthButton);
      
      expect(screen.getByTestId('month-calendar')).toBeInTheDocument();
      expect(screen.queryByTestId('week-calendar')).not.toBeInTheDocument();
    });

    test('アクティブなビューモードボタンが強調表示される', () => {
      render(<CalendarView />);
      
      const monthButton = screen.getByRole('button', { name: /月/ });
      const weekButton = screen.getByRole('button', { name: /週/ });
      
      // 月間ボタンがアクティブ
      expect(monthButton).toHaveClass('variant-default');
      expect(weekButton).toHaveClass('variant-ghost');
    });
  });

  describe('ナビゲーション', () => {
    test('月間ビューで前のボタンクリック時、前月に移動', () => {
      render(<CalendarView initialDate={new Date(2024, 1, 15)} />);
      
      const prevButton = screen.getByRole('button', { name: /前/ });
      fireEvent.click(prevButton);
      
      // 1月のタイトルが表示されることを確認
      expect(screen.getByText('2024年1月')).toBeInTheDocument();
    });

    test('月間ビューで次のボタンクリック時、翌月に移動', () => {
      render(<CalendarView initialDate={new Date(2024, 0, 15)} />);
      
      const nextButton = screen.getByRole('button', { name: /次/ });
      fireEvent.click(nextButton);
      
      // 2月のタイトルが表示されることを確認
      expect(screen.getByText('2024年2月')).toBeInTheDocument();
    });

    test('週間ビューで前のボタンクリック時、前週に移動', () => {
      render(<CalendarView initialViewMode="week" initialDate={new Date(2024, 0, 15)} />);
      
      const prevButton = screen.getByRole('button', { name: /前/ });
      fireEvent.click(prevButton);
      
      // 週のタイトルが変更されることを確認
      const weekTitle = screen.getByRole('heading');
      expect(weekTitle).toBeInTheDocument();
    });

    test('週間ビューで次のボタンクリック時、翌週に移動', () => {
      render(<CalendarView initialViewMode="week" initialDate={new Date(2024, 0, 15)} />);
      
      const nextButton = screen.getByRole('button', { name: /次/ });
      fireEvent.click(nextButton);
      
      // 週のタイトルが変更されることを確認
      const weekTitle = screen.getByRole('heading');
      expect(weekTitle).toBeInTheDocument();
    });

    test('今日ボタンクリック時、カレンダーを今日の月/週に移動', () => {
      render(<CalendarView initialDate={new Date(2024, 0, 15)} />);
      
      const todayButton = screen.getByRole('button', { name: '今日' });
      fireEvent.click(todayButton);
      
      // 現在の月が表示されることを確認
      const currentDate = new Date();
      const expectedTitle = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
    });
  });

  describe('データ取得中の表示', () => {
    test('ローディング表示', () => {
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      render(<CalendarView />);
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('ローディング中はナビゲーションボタンが無効化', () => {
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      render(<CalendarView />);
      
      const prevButton = screen.getByRole('button', { name: /前/ });
      const nextButton = screen.getByRole('button', { name: /次/ });
      const todayButton = screen.getByRole('button', { name: '今日' });
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(todayButton).toBeDisabled();
    });
  });

  describe('エラー時の表示', () => {
    test('エラーメッセージ表示', () => {
      const mockError = new Error('Network error');
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: mockError,
        refetch: jest.fn()
      });

      render(<CalendarView />);
      
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    test('再試行ボタンを表示', () => {
      const mockRefetch = jest.fn();
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch
      });

      render(<CalendarView />);
      
      const retryButton = screen.getByRole('button', { name: '再試行' });
      fireEvent.click(retryButton);
      
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('セッションクリック時の詳細表示', () => {
    test('セッションクリック時にアラートで詳細表示', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CalendarView />);
      
      const sessionButton = screen.getByText('Test Session');
      fireEvent.click(sessionButton);
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('セッション詳細:')
      );
      
      alertSpy.mockRestore();
    });
  });

  describe('日付クリック時の選択', () => {
    test('日付クリック時に該当日を選択', () => {
      render(<CalendarView />);
      
      const dateButton = screen.getByText('Mock Month Calendar');
      fireEvent.click(dateButton);
      
      // 選択された日付がカレンダーに反映されることを確認
      // （この場合は、選択状態の変更を確認する必要がある）
      expect(screen.getByTestId('month-calendar')).toBeInTheDocument();
    });
  });

  describe('スケジュール統計', () => {
    test('スケジュールがある場合、統計を表示', () => {
      const mockSchedules = [
        { id: '1', title: 'Practice 1', partName: '管楽器' },
        { id: '2', title: 'Practice 2', partName: '弦楽器' }
      ];

      mockUseCalendarData.mockReturnValue({
        data: mockSchedules,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<CalendarView />);
      
      expect(screen.getByText('表示期間内のスケジュール: 2件')).toBeInTheDocument();
    });

    test('partIdが指定されている場合、パート情報を表示', () => {
      const mockSchedules = [
        { id: '1', title: 'Practice 1', partName: '管楽器' }
      ];

      mockUseCalendarData.mockReturnValue({
        data: mockSchedules,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<CalendarView partId={1} />);
      
      expect(screen.getByText(/パート: 管楽器/)).toBeInTheDocument();
    });

    test('スケジュールがない場合、統計を非表示', () => {
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<CalendarView />);
      
      expect(screen.queryByText(/表示期間内のスケジュール/)).not.toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    test('小画面でのレイアウト調整', () => {
      render(<CalendarView />);
      
      // flex-wrap クラスが適用されていることを確認
      const headerElement = document.querySelector('.flex-wrap');
      expect(headerElement).toBeInTheDocument();
    });
  });
});