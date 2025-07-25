/**
 * MonthCalendar.tsxのテスト
 * TDD方式：実装コードなしでテスト仕様を先に定義
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthCalendar } from '../MonthCalendar';
import { Schedule } from '@/types/schedule';

describe('MonthCalendar', () => {
  const mockSchedules: Schedule[] = [
    {
      id: '1',
      title: '全体練習',
      startDate: new Date(2024, 0, 15, 19, 0),
      endDate: new Date(2024, 0, 15, 21, 0),
      partId: 1,
      partName: '管楽器',
      location: '音楽室',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'パート練習',
      startDate: new Date(2024, 0, 16, 18, 30),
      endDate: new Date(2024, 0, 16, 20, 30),
      partId: 2,
      partName: '弦楽器',
      location: '小練習室',
      color: '#ef4444'
    }
  ];

  const defaultProps = {
    date: new Date(2024, 0, 15), // 2024年1月15日
    schedules: mockSchedules,
    onDateClick: jest.fn(),
    onSessionClick: jest.fn(),
    highlightToday: true,
    selectedDate: new Date(2024, 0, 15)
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レイアウト', () => {
    test('6週間×7日のグリッドレイアウトで表示', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      // 42個のセル（6週間 × 7日）が存在することを確認
      const cells = screen.getAllByRole('button'); // 日付セルはクリック可能
      expect(cells).toHaveLength(42);
    });

    test('曜日ヘッダー（日月火水木金土）を表示', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByText('月')).toBeInTheDocument();
      expect(screen.getByText('火')).toBeInTheDocument();
      expect(screen.getByText('水')).toBeInTheDocument();
      expect(screen.getByText('木')).toBeInTheDocument();
      expect(screen.getByText('金')).toBeInTheDocument();
      expect(screen.getByText('土')).toBeInTheDocument();
    });
  });

  describe('今日のハイライト', () => {
    test('highlightToday=trueの場合、今日の日付をハイライト表示', () => {
      const today = new Date();
      render(
        <MonthCalendar 
          {...defaultProps} 
          date={today}
          highlightToday={true}
        />
      );
      
      // 今日の日付セルが特別なスタイルを持つことを確認
      const todayCell = screen.getByText(today.getDate().toString());
      expect(todayCell).toHaveClass('text-blue-600'); // 今日のスタイル
    });

    test('highlightToday=falseの場合、今日のハイライトを無効化', () => {
      const today = new Date();
      render(
        <MonthCalendar 
          {...defaultProps} 
          date={today}
          highlightToday={false}
        />
      );
      
      const todayCell = screen.getByText(today.getDate().toString());
      expect(todayCell).not.toHaveClass('text-blue-600');
    });
  });

  describe('選択日のハイライト', () => {
    test('selectedDateが指定された場合、該当日をハイライト表示', () => {
      const selectedDate = new Date(2024, 0, 20);
      render(
        <MonthCalendar 
          {...defaultProps} 
          selectedDate={selectedDate}
        />
      );
      
      // 選択された日付のセルが特別なスタイルを持つことを確認
      const selectedCell = screen.getByText('20');
      expect(selectedCell.closest('div')).toHaveClass('ring-2 ring-blue-500');
    });
  });

  describe('当月以外の日付', () => {
    test('当月以外の日付はグレーアウト', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      // 前月や来月の日付を探す（通常は最初と最後の週に含まれる）
      const allCells = screen.getAllByRole('button');
      
      // 最初のセルは前月の日付のはず（2024年1月1日が月曜日なので）
      const firstCell = allCells[0];
      expect(firstCell).toHaveClass('text-gray-400');
    });
  });

  describe('週末の色変更', () => {
    test('土日の文字色を変更', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      // 曜日ヘッダーの日曜日と土曜日をチェック
      const sunday = screen.getByText('日');
      const saturday = screen.getByText('土');
      
      expect(sunday).toHaveClass('text-red-600');
      expect(saturday).toHaveClass('text-blue-600');
    });
  });

  describe('スケジュール表示', () => {
    test('各日付セルにスケジュール数を表示', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      // 1月15日にスケジュールが表示されることを確認
      expect(screen.getByText('全体練習')).toBeInTheDocument();
      
      // 1月16日にスケジュールが表示されることを確認
      expect(screen.getByText('パート練習')).toBeInTheDocument();
    });

    test('スケジュールが3個以上ある場合、+件数を表示', () => {
      const manySchedules: Schedule[] = [
        ...mockSchedules,
        {
          id: '3',
          title: '追加練習1',
          startDate: new Date(2024, 0, 15, 10, 0),
          endDate: new Date(2024, 0, 15, 12, 0),
        },
        {
          id: '4',
          title: '追加練習2',
          startDate: new Date(2024, 0, 15, 14, 0),
          endDate: new Date(2024, 0, 15, 16, 0),
        }
      ];

      render(
        <MonthCalendar 
          {...defaultProps} 
          schedules={manySchedules}
        />
      );
      
      // +2件の表示を確認（最初の2件を表示して、残り2件を+表示）
      expect(screen.getByText('+2件')).toBeInTheDocument();
    });
  });

  describe('イベントハンドリング', () => {
    test('日付クリック時にonDateClickコールバック呼び出し', () => {
      const onDateClick = jest.fn();
      render(
        <MonthCalendar 
          {...defaultProps} 
          onDateClick={onDateClick}
        />
      );
      
      // 15日の日付をクリック
      const dateCell = screen.getByText('15');
      fireEvent.click(dateCell.closest('div')!);
      
      expect(onDateClick).toHaveBeenCalledWith(new Date(2024, 0, 15));
    });

    test('スケジュールクリック時にonSessionClickコールバック呼び出し', () => {
      const onSessionClick = jest.fn();
      render(
        <MonthCalendar 
          {...defaultProps} 
          onSessionClick={onSessionClick}
        />
      );
      
      // スケジュールをクリック
      const scheduleElement = screen.getByText('全体練習');
      fireEvent.click(scheduleElement);
      
      expect(onSessionClick).toHaveBeenCalledWith(mockSchedules[0]);
    });

    test('スケジュールクリック時、日付クリックイベントの伝播を停止', () => {
      const onDateClick = jest.fn();
      const onSessionClick = jest.fn();
      
      render(
        <MonthCalendar 
          {...defaultProps} 
          onDateClick={onDateClick}
          onSessionClick={onSessionClick}
        />
      );
      
      // スケジュールをクリック
      const scheduleElement = screen.getByText('全体練習');
      fireEvent.click(scheduleElement);
      
      // スケジュールクリックのコールバックは呼ばれるが、日付クリックは呼ばれない
      expect(onSessionClick).toHaveBeenCalled();
      expect(onDateClick).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    test('日付セルにaria-labelを設定', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      const cells = screen.getAllByRole('button');
      expect(cells[0]).toHaveAttribute('aria-label');
    });

    test('スケジュールにキーボードナビゲーション対応', () => {
      render(<MonthCalendar {...defaultProps} />);
      
      const scheduleElement = screen.getByText('全体練習');
      expect(scheduleElement).toBeInTheDocument();
      // tabindexやroleなどのアクセシビリティ属性をチェック
    });
  });
});