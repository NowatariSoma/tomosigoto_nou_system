import { PracticeScheduleDisplay } from '../types';
import { ScheduleItem } from '../types/schedule';

// ユーティリティ関数: 時間の差分を計算
export const calculateDuration = (startTime: string, endTime: string): string => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return Math.round(diffMinutes).toString();
};

// 新しいAPIデータを既存のScheduleItem形式に変換
export const convertDisplayScheduleToScheduleItems = (schedule: PracticeScheduleDisplay): ScheduleItem[] => {
  const timeSlots = new Map<string, ScheduleItem>();

  // セッションを時間スロットごとにグループ化
  schedule.sessions.forEach(session => {
    const startTime = session.start_time.slice(0, 5);
    const endTime = session.end_time.slice(0, 5);

    if (!timeSlots.has(startTime)) {
      timeSlots.set(startTime, {
        id: startTime,
        time: startTime,
        duration: `(${calculateDuration(session.start_time, session.end_time)})`,
        activity: session.title,
        columns: ['', '', '', '', '']
      });
    }

    const item = timeSlots.get(startTime)!;
    // セッション情報を追加
    if (session.part_name) {
      const info = `${session.part_name}${session.instructors.length > 0 ? `\n指導: ${session.instructors.map(i => i.name).join(', ')}` : ''}`;
      // 適当なカラムに追加（実際の配置ロジックは要調整）
      const emptyIndex = item.columns.findIndex(col => col === '');
      if (emptyIndex !== -1) {
        item.columns[emptyIndex] = info;
      }
    }
  });

  return Array.from(timeSlots.values()).sort((a, b) => a.time.localeCompare(b.time));
};