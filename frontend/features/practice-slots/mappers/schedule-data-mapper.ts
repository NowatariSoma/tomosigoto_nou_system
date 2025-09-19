/**
 * スケジュールデータのマッピング機能
 */

/**
 * スケジュールデータマッパー
 */
export const scheduleDataMapper = {
  /**
   * 日付をYYYY-MM-DD形式の文字列に変換する
   * @param date - 変換する日付
   * @returns YYYY-MM-DD形式の文字列
   */
  formatDateToString: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * YYYY-MM-DD形式の文字列を日付に変換する
   * @param dateString - YYYY-MM-DD形式の文字列
   * @returns 日付オブジェクト
   */
  parseStringToDate: (dateString: string): Date => {
    return new Date(dateString);
  },

  /**
   * 日付を日本語形式（YYYY年MM月DD日）に変換する
   * @param date - 変換する日付
   * @returns 日本語形式の日付文字列
   */
  formatDateToJapanese: (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  },

  /**
   * 曜日を日本語で取得する
   * @param date - 日付
   * @returns 日本語の曜日
   */
  getJapaneseWeekday: (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  }
};
