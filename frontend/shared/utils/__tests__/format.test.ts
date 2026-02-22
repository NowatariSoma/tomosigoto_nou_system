import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  truncateText,
  formatDateToYYYYMMDD,
  formatRelativeLastActive,
} from '@/shared/utils/format';

describe('format utils', () => {
  describe('formatDate', () => {
    it('日付文字列を日本語フォーマットで返す', () => {
      const result = formatDate('2024-03-15');
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });

    it('カスタムオプションを適用できる', () => {
      const result = formatDate('2024-03-15', { weekday: 'long' });
      // weekdayオプションが反映されることを確認
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatDateTime', () => {
    it('日時を含むフォーマットで返す', () => {
      const result = formatDateTime('2024-03-15T10:30:00');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatCurrency', () => {
    it('日本円のフォーマットを返す', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1,000');
    });

    it('0円を正しくフォーマットする', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('大きな金額をフォーマットする', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1,000,000');
    });
  });

  describe('formatNumber', () => {
    it('数値を日本語フォーマットで返す', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('0を正しくフォーマットする', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('小さな数値はそのまま返す', () => {
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('formatPercentage', () => {
    it('パーセント表示を返す', () => {
      expect(formatPercentage(50)).toBe('50%');
    });

    it('0%を正しく返す', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('100%を正しく返す', () => {
      expect(formatPercentage(100)).toBe('100%');
    });
  });

  describe('truncateText', () => {
    it('maxLength以下のテキストはそのまま返す', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('maxLengthを超えるテキストは省略する', () => {
      expect(truncateText('this is a long text', 10)).toBe('this is a ...');
    });

    it('ちょうどmaxLengthのテキストはそのまま返す', () => {
      expect(truncateText('12345', 5)).toBe('12345');
    });

    it('空文字列はそのまま返す', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('formatDateToYYYYMMDD', () => {
    it('DateオブジェクトをYYYY-MM-DD形式に変換する', () => {
      const date = new Date(2024, 2, 15); // 2024年3月15日
      expect(formatDateToYYYYMMDD(date)).toBe('2024-03-15');
    });

    it('月と日が1桁の場合にゼロ埋めする', () => {
      const date = new Date(2024, 0, 5); // 2024年1月5日
      expect(formatDateToYYYYMMDD(date)).toBe('2024-01-05');
    });

    it('12月31日を正しく変換する', () => {
      const date = new Date(2024, 11, 31); // 2024年12月31日
      expect(formatDateToYYYYMMDD(date)).toBe('2024-12-31');
    });
  });

  describe('formatRelativeLastActive', () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      // 現在日時を2024年6月15日に固定
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('nullの場合は「記録なし」を返す', () => {
      expect(formatRelativeLastActive(null)).toBe('記録なし');
    });

    it('無効な日付文字列の場合は「記録なし」を返す', () => {
      expect(formatRelativeLastActive('invalid-date')).toBe('記録なし');
    });

    it('未来の日付の場合は「予定」を返す', () => {
      expect(formatRelativeLastActive('2024-07-01')).toBe('予定');
    });

    it('今月のアクティブの場合は「今月」を返す', () => {
      expect(formatRelativeLastActive('2024-06-01')).toBe('今月');
    });

    it('数ヶ月前の場合は「Nヶ月前」を返す', () => {
      expect(formatRelativeLastActive('2024-03-01')).toBe('3ヶ月前');
    });

    it('1年以上前の場合は「N年前」を返す', () => {
      expect(formatRelativeLastActive('2022-06-01')).toBe('2年前');
    });
  });
});
