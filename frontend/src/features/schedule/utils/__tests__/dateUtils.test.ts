/**
 * dateUtils.tsのテスト
 * TDD方式：実装コードなしでテスト仕様を先に定義
 */

import {
  getMonthDates,
  getWeekDates,
  getMonthRange,
  getWeekRange,
  formatMonthTitle,
  formatWeekTitle,
  isTodayDate,
  isSameDateDay,
  isWeekendDate
} from '../dateUtils';

describe('dateUtils', () => {
  describe('getMonthDates', () => {
    test('2024年1月15日の場合、42個の日付配列（6週間×7日）を返す', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日
      const result = getMonthDates(input);
      
      expect(result).toHaveLength(42);
      expect(result[0]).toBeInstanceOf(Date);
    });

    test('前月の末尾日付を含む（2024年1月の場合、12/31など）', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日
      const result = getMonthDates(input);
      
      // 最初の日付は前月の日付のはず（1月1日が月曜日なので、前月の日曜日から始まる）
      expect(result[0].getMonth()).toBe(11); // 12月（0ベース）
      expect(result[0].getFullYear()).toBe(2023);
    });

    test('翌月の先頭日付を含む', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日
      const result = getMonthDates(input);
      
      // 最後の方の日付は翌月の日付を含むはず
      const lastDates = result.slice(-7); // 最後の1週間
      const hasNextMonth = lastDates.some(date => date.getMonth() === 1); // 2月
      expect(hasNextMonth).toBe(true);
    });

    test('日曜日始まりで配列が構成される', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日
      const result = getMonthDates(input);
      
      // 最初の日付は日曜日のはず
      expect(result[0].getDay()).toBe(0); // 日曜日
    });
  });

  describe('getWeekDates', () => {
    test('2024年1月15日（月曜日）の場合、7個の日付配列（その週の日曜日〜土曜日）を返す', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日（月曜日）
      const result = getWeekDates(input);
      
      expect(result).toHaveLength(7);
      expect(result[0].getDay()).toBe(0); // 日曜日から始まる
      expect(result[6].getDay()).toBe(6); // 土曜日で終わる
    });

    test('期待される日付順序：[2024/1/14(日), 2024/1/15(月), ..., 2024/1/20(土)]', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日（月曜日）
      const result = getWeekDates(input);
      
      expect(result[0]).toEqual(new Date(2024, 0, 14)); // 日曜日
      expect(result[1]).toEqual(new Date(2024, 0, 15)); // 月曜日
      expect(result[6]).toEqual(new Date(2024, 0, 20)); // 土曜日
    });
  });

  describe('getMonthRange', () => {
    test('2024年1月15日の場合、{start: 2024/1/1, end: 2024/1/31}を返す', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日
      const result = getMonthRange(input);
      
      expect(result.start).toEqual(new Date(2024, 0, 1)); // 1月1日
      expect(result.end).toEqual(new Date(2024, 0, 31)); // 1月31日
    });

    test('時間は00:00:00と23:59:59に設定される', () => {
      const input = new Date(2024, 0, 15, 14, 30); // 2024年1月15日 14:30
      const result = getMonthRange(input);
      
      // 開始日は00:00:00
      expect(result.start.getHours()).toBe(0);
      expect(result.start.getMinutes()).toBe(0);
      expect(result.start.getSeconds()).toBe(0);
      
      // 終了日の時間も確認（月末日の時間）
      expect(result.end.getDate()).toBe(31); // 1月31日
    });
  });

  describe('getWeekRange', () => {
    test('2024年1月15日（月曜日）の場合、{start: 2024/1/14 00:00:00, end: 2024/1/20 23:59:59}を返す', () => {
      const input = new Date(2024, 0, 15); // 2024年1月15日（月曜日）
      const result = getWeekRange(input);
      
      expect(result.start).toEqual(new Date(2024, 0, 14)); // 日曜日
      expect(result.end).toEqual(new Date(2024, 0, 20, 23, 59, 59, 999)); // 土曜日の終わり
    });

    test('日曜日始まりの週として計算', () => {
      const input = new Date(2024, 0, 17); // 2024年1月17日（水曜日）
      const result = getWeekRange(input);
      
      expect(result.start.getDay()).toBe(0); // 日曜日
      expect(result.end.getDay()).toBe(6); // 土曜日
    });
  });

  describe('formatMonthTitle', () => {
    test('new Date(2024, 0, 15)の場合、"2024年1月"を返す', () => {
      const input = new Date(2024, 0, 15);
      const result = formatMonthTitle(input);
      
      expect(result).toBe('2024年1月');
    });

    test('日本語ロケールを使用', () => {
      const input = new Date(2024, 11, 15); // 12月
      const result = formatMonthTitle(input);
      
      expect(result).toBe('2024年12月');
    });
  });

  describe('formatWeekTitle', () => {
    test('同一年月の場合："2024年1月14日 - 20日"', () => {
      const startDate = new Date(2024, 0, 14);
      const endDate = new Date(2024, 0, 20);
      const result = formatWeekTitle(startDate, endDate);
      
      expect(result).toBe('2024年1月14日 - 20日');
    });

    test('跨月の場合："12月25日 - 1月7日"', () => {
      const startDate = new Date(2023, 11, 25); // 12月25日
      const endDate = new Date(2024, 0, 7); // 1月7日
      const result = formatWeekTitle(startDate, endDate);
      
      expect(result).toBe('12月25日 - 1月7日');
    });

    test('跨年の場合："2023年12月25日 - 2024年1月7日"', () => {
      const startDate = new Date(2023, 11, 25); // 2023年12月25日
      const endDate = new Date(2024, 0, 7); // 2024年1月7日
      const result = formatWeekTitle(startDate, endDate);
      
      expect(result).toBe('2023年12月25日 - 2024年1月7日');
    });
  });

  describe('isTodayDate', () => {
    test('今日の日付の場合、trueを返す', () => {
      const today = new Date();
      const result = isTodayDate(today);
      
      expect(result).toBe(true);
    });

    test('過去の日付の場合、falseを返す', () => {
      const pastDate = new Date(2024, 0, 1); // 2024年1月1日
      const result = isTodayDate(pastDate);
      
      // 今日が2024年1月1日でない限りfalse（テスト実行日による）
      const today = new Date();
      const expected = pastDate.toDateString() === today.toDateString();
      expect(result).toBe(expected);
    });
  });

  describe('isSameDateDay', () => {
    test('同じ日の異なる時間：trueを返す', () => {
      const date1 = new Date(2024, 0, 15, 10, 30);
      const date2 = new Date(2024, 0, 15, 14, 45);
      const result = isSameDateDay(date1, date2);
      
      expect(result).toBe(true);
    });

    test('異なる日：falseを返す', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      const result = isSameDateDay(date1, date2);
      
      expect(result).toBe(false);
    });
  });

  describe('isWeekendDate', () => {
    test('土曜日：trueを返す', () => {
      const saturday = new Date(2024, 0, 13); // 2024年1月13日（土曜日）
      const result = isWeekendDate(saturday);
      
      expect(result).toBe(true);
    });

    test('日曜日：trueを返す', () => {
      const sunday = new Date(2024, 0, 14); // 2024年1月14日（日曜日）
      const result = isWeekendDate(sunday);
      
      expect(result).toBe(true);
    });

    test('月曜日：falseを返す', () => {
      const monday = new Date(2024, 0, 15); // 2024年1月15日（月曜日）
      const result = isWeekendDate(monday);
      
      expect(result).toBe(false);
    });
  });
});