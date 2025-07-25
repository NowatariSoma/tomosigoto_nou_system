/**
 * WeekCalendar.tsxのテスト
 * TDD方式：実装コードなしでテスト仕様を先に定義
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekCalendar } from '../WeekCalendar';
import { Schedule } from '@/types/schedule';

describe('WeekCalendar', () => {
  const mockSchedules: Schedule[] = [
    {
      id: '1',
      title: '全体練習',
      startDate: new Date(2024, 0, 15, 19, 0), // 月曜日 19:00
      endDate: new Date(2024, 0, 15, 21, 0),   // 月曜日 21:00
      partId: 1,
      partName: '管楽器',
      location: '音楽室',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'パート練習',
      startDate: new Date(2024, 0, 16, 18, 30), // 火曜日 18:30
      endDate: new Date(2024, 0, 16, 20, 30),   // 火曜日 20:30
      partId: 2,
      partName: '弦楽器',
      location: '小練習室',
      color: '#ef4444'
    }
  ];

  const defaultProps = {
    startDate: new Date(2024, 0, 14), // 2024年1月14日（日曜日）
    schedules: mockSchedules,
    onSessionClick: jest.fn(),
    hourRange: { start: 8, end: 21 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レイアウト', () => {
    test('7日×時間軸のグリッドレイアウトで表示', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // 7日分の列が表示されることを確認
      // 時間軸ラベル + 7日 = 8列のグリッド
      const gridContainer = screen.getByRole('grid') || document.querySelector('.grid-cols-8');
      expect(gridContainer).toBeInTheDocument();
    });

    test('日付ヘッダー（日付と曜日）を表示', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // 1月14日(日) から 1月20日(土) まで表示
      expect(screen.getByText(/1\/14\(日\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/15\(月\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/16\(火\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/17\(水\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/18\(木\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/19\(金\)/)).toBeInTheDocument();
      expect(screen.getByText(/1\/20\(土\)/)).toBeInTheDocument();
    });

    test('時間軸ラベル（8:00, 9:00など）を表示', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // 8:00から21:00まで表示
      expect(screen.getByText('8:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('21:00')).toBeInTheDocument();
    });
  });

  describe('今日のハイライト', () => {
    test('今日の列をハイライト表示', () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // その週の日曜日
      
      render(
        <WeekCalendar 
          {...defaultProps} 
          startDate={startOfWeek}
        />
      );
      
      // 今日の列が特別なスタイルを持つことを確認
      const todayColumn = document.querySelector('.bg-blue-50\\/30');
      expect(todayColumn).toBeInTheDocument();
    });
  });

  describe('セッション表示', () => {
    test('セッションを時間軸上に配置', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // スケジュールタイトルが表示されることを確認
      expect(screen.getByText('全体練習')).toBeInTheDocument();
      expect(screen.getByText('パート練習')).toBeInTheDocument();
    });

    test('セッションの長さに応じて高さを調整', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // セッションブロックが適切な高さを持つことを確認
      const sessionBlock = screen.getByText('全体練習').closest('div');
      expect(sessionBlock).toHaveStyle({ height: expect.stringMatching(/\d+%/) });
    });

    test('セッション情報（時間、場所）を表示', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // 時間が表示されることを確認
      expect(screen.getByText(/19:00.*21:00/)).toBeInTheDocument();
      
      // 場所が表示されることを確認
      expect(screen.getByText('音楽室')).toBeInTheDocument();
    });

    test('複数セッションが重なる場合は幅を調整', () => {
      const overlappingSchedules: Schedule[] = [
        {
          id: '1',
          title: 'セッション1',
          startDate: new Date(2024, 0, 15, 19, 0),
          endDate: new Date(2024, 0, 15, 20, 0),
          color: '#3b82f6'
        },
        {
          id: '2',
          title: 'セッション2',
          startDate: new Date(2024, 0, 15, 19, 30), // 重複する時間
          endDate: new Date(2024, 0, 15, 20, 30),
          color: '#ef4444'
        }
      ];

      render(
        <WeekCalendar 
          {...defaultProps} 
          schedules={overlappingSchedules}
        />
      );
      
      // 重複するセッションが適切に表示されることを確認
      expect(screen.getByText('セッション1')).toBeInTheDocument();
      expect(screen.getByText('セッション2')).toBeInTheDocument();
    });
  });

  describe('時間範囲フィルタリング', () => {
    test('表示範囲外のセッションは除外', () => {
      const outOfRangeSchedules: Schedule[] = [
        {
          id: '1',
          title: '早朝練習',
          startDate: new Date(2024, 0, 15, 6, 0), // 8:00より前
          endDate: new Date(2024, 0, 15, 7, 0),
        },
        {
          id: '2',
          title: '深夜練習',
          startDate: new Date(2024, 0, 15, 22, 0), // 21:00より後
          endDate: new Date(2024, 0, 15, 23, 0),
        },
        {
          id: '3',
          title: '通常練習',
          startDate: new Date(2024, 0, 15, 19, 0), // 範囲内
          endDate: new Date(2024, 0, 15, 21, 0),
        }
      ];

      render(
        <WeekCalendar 
          {...defaultProps} 
          schedules={outOfRangeSchedules}
        />
      );
      
      // 範囲外のセッションは表示されない
      expect(screen.queryByText('早朝練習')).not.toBeInTheDocument();
      expect(screen.queryByText('深夜練習')).not.toBeInTheDocument();
      
      // 範囲内のセッションは表示される
      expect(screen.getByText('通常練習')).toBeInTheDocument();
    });
  });

  describe('イベントハンドリング', () => {
    test('セッションクリック時にonSessionClickコールバック呼び出し', () => {
      const onSessionClick = jest.fn();
      render(
        <WeekCalendar 
          {...defaultProps} 
          onSessionClick={onSessionClick}
        />
      );
      
      // セッションをクリック
      const sessionElement = screen.getByText('全体練習');
      fireEvent.click(sessionElement);
      
      expect(onSessionClick).toHaveBeenCalledWith(mockSchedules[0]);
    });
  });

  describe('レスポンシブ対応', () => {
    test('最小幅を設定してスクロール可能', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      // 横スクロール可能なコンテナが存在することを確認
      const scrollContainer = document.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
      
      // 最小幅が設定されていることを確認
      const minWidthElement = document.querySelector('.min-w-\\[800px\\]');
      expect(minWidthElement).toBeInTheDocument();
    });
  });

  describe('カスタマイズ可能な時間範囲', () => {
    test('デフォルトの時間範囲（8:00-21:00）', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      expect(screen.getByText('8:00')).toBeInTheDocument();
      expect(screen.getByText('21:00')).toBeInTheDocument();
      expect(screen.queryByText('7:00')).not.toBeInTheDocument();
      expect(screen.queryByText('22:00')).not.toBeInTheDocument();
    });

    test('カスタム時間範囲（10:00-18:00）', () => {
      render(
        <WeekCalendar 
          {...defaultProps} 
          hourRange={{ start: 10, end: 18 }}
        />
      );
      
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
      expect(screen.queryByText('8:00')).not.toBeInTheDocument();
      expect(screen.queryByText('21:00')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    test('セッションにaria-labelを設定', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      const sessionElement = screen.getByText('全体練習');
      expect(sessionElement.closest('div')).toHaveAttribute('aria-label');
    });

    test('時間軸ラベルにrole属性を設定', () => {
      render(<WeekCalendar {...defaultProps} />);
      
      const timeLabel = screen.getByText('8:00');
      expect(timeLabel.closest('div')).toHaveAttribute('role');
    });
  });
});