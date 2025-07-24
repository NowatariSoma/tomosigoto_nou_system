import { Session, ScheduleConflict, GeneratedSchedule } from '../types/generatedSchedule';

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 時刻文字列 (HH:MM) を時間の数値に変換
 */
export const timeStringToHour = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
};

/**
 * 時間の数値を時刻文字列 (HH:MM) に変換
 */
export const hourToTimeString = (hour: number): string => {
  const hours = Math.floor(hour);
  const minutes = Math.round((hour - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * 2つのセッションが時間的に重複するかチェック
 */
export const sessionsTimeOverlap = (session1: Session, session2: Session): boolean => {
  // 日付が異なる場合は重複しない
  if (formatDate(session1.date) !== formatDate(session2.date)) {
    return false;
  }

  const start1 = timeStringToHour(session1.startTime);
  const end1 = timeStringToHour(session1.endTime);
  const start2 = timeStringToHour(session2.startTime);
  const end2 = timeStringToHour(session2.endTime);

  // 重複判定: session1の終了時刻 > session2の開始時刻 && session1の開始時刻 < session2の終了時刻
  return end1 > start2 && start1 < end2;
};

/**
 * セッションの競合を検出
 */
export const detectScheduleConflicts = (sessions: Session[]): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const session1 = sessions[i];
      const session2 = sessions[j];

      // 時間重複チェック
      if (sessionsTimeOverlap(session1, session2)) {
        // 会場の重複
        if (session1.venueId === session2.venueId) {
          conflicts.push({
            id: `venue-conflict-${session1.id}-${session2.id}`,
            type: 'venue_overlap',
            severity: 'error',
            sessionIds: [session1.id, session2.id],
            message: `会場「${session1.venueId}」で時間が重複しています`,
            affectedDate: session1.date,
            affectedVenueId: session1.venueId,
          });
        }

        // パートの重複
        const overlappingParts = session1.partIds.filter(partId =>
          session2.partIds.includes(partId)
        );
        if (overlappingParts.length > 0) {
          conflicts.push({
            id: `part-conflict-${session1.id}-${session2.id}`,
            type: 'part_overlap',
            severity: 'warning',
            sessionIds: [session1.id, session2.id],
            message: `パート「${overlappingParts.join(', ')}」で時間が重複しています`,
            affectedDate: session1.date,
            affectedPartIds: overlappingParts,
          });
        }
      }
    }
  }

  return conflicts;
};

/**
 * セッションの日付範囲を取得
 */
export const getSessionDateRange = (sessions: Session[]): { start: Date; end: Date } | null => {
  if (sessions.length === 0) return null;

  const dates = sessions.map(s => new Date(s.date));
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  return { start, end };
};

/**
 * 特定の日付のセッションをフィルタリング
 */
export const getSessionsByDate = (sessions: Session[], date: Date): Session[] => {
  const targetDateString = formatDate(date);
  return sessions.filter(session => formatDate(session.date) === targetDateString);
};

/**
 * 特定の週のセッションをフィルタリング
 */
export const getSessionsByWeek = (sessions: Session[], date: Date): Session[] => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });
};

/**
 * 特定の月のセッションをフィルタリング
 */
export const getSessionsByMonth = (sessions: Session[], date: Date): Session[] => {
  return sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return (
      sessionDate.getFullYear() === date.getFullYear() &&
      sessionDate.getMonth() === date.getMonth()
    );
  });
};

/**
 * 会場の利用率を計算
 */
export const calculateVenueUtilization = (
  sessions: Session[],
  venue: { id: number; capacity: number },
  dateRange: { start: Date; end: Date }
): number => {
  const venueSessions = sessions.filter(s => s.venueId === venue.id);
  
  if (venueSessions.length === 0) return 0;

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const totalHours = venueSessions.reduce((acc, session) => {
    const duration = timeStringToHour(session.endTime) - timeStringToHour(session.startTime);
    return acc + duration;
  }, 0);

  // 1日8時間稼働として計算
  const maxHours = totalDays * 8;
  return Math.min((totalHours / maxHours) * 100, 100);
};

/**
 * パートのバランスを計算
 */
export const calculatePartBalance = (sessions: Session[], parts: { id: number }[]): number => {
  if (parts.length === 0) return 100;

  const partCounts = parts.map(part => {
    return sessions.filter(session => session.partIds.includes(part.id)).length;
  });

  if (partCounts.length === 0) return 100;

  const maxCount = Math.max(...partCounts);
  const minCount = Math.min(...partCounts);

  if (maxCount === 0) return 100;

  // バランススコア: 最小と最大の差が小さいほど高いスコア
  return Math.max(0, 100 - ((maxCount - minCount) / maxCount) * 100);
};

/**
 * 時間効率を計算
 */
export const calculateTimeEfficiency = (sessions: Session[]): number => {
  if (sessions.length === 0) return 100;

  let totalGaps = 0;
  let totalSessions = 0;

  // 日付ごとにグループ化
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = formatDate(session.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  Object.values(sessionsByDate).forEach(daySessions => {
    // 開始時刻でソート
    const sortedSessions = daySessions.sort((a, b) => 
      timeStringToHour(a.startTime) - timeStringToHour(b.startTime)
    );

    // セッション間のギャップを計算
    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const currentEnd = timeStringToHour(sortedSessions[i].endTime);
      const nextStart = timeStringToHour(sortedSessions[i + 1].startTime);
      const gap = nextStart - currentEnd;
      
      if (gap > 0) {
        totalGaps += gap;
      }
    }
    
    totalSessions += sortedSessions.length;
  });

  if (totalSessions <= 1) return 100;

  // 平均ギャップが小さいほど効率が良い
  const averageGap = totalGaps / Math.max(1, totalSessions - Object.keys(sessionsByDate).length);
  return Math.max(0, 100 - averageGap * 10); // ギャップ1時間につき10点減点
};

/**
 * 最適化スコアを計算
 */
export const calculateOptimizationScore = (
  schedule: GeneratedSchedule
): GeneratedSchedule['optimizationScore'] => {
  const dateRange = getSessionDateRange(schedule.sessions);
  
  if (!dateRange) {
    return {
      total: 0,
      breakdown: {
        venueUtilization: 0,
        partBalance: 0,
        timeEfficiency: 0,
        conflictPenalty: 0,
      },
      suggestions: ['セッションがありません'],
    };
  }

  // 各指標を計算
  const venueUtilizations = schedule.venues.map(venue =>
    calculateVenueUtilization(schedule.sessions, venue, dateRange)
  );
  const venueUtilization = venueUtilizations.length > 0 
    ? venueUtilizations.reduce((a, b) => a + b, 0) / venueUtilizations.length 
    : 0;

  const partBalance = calculatePartBalance(schedule.sessions, schedule.parts);
  const timeEfficiency = calculateTimeEfficiency(schedule.sessions);
  
  // 競合ペナルティ
  const errorConflicts = schedule.conflicts.filter(c => c.severity === 'error').length;
  const warningConflicts = schedule.conflicts.filter(c => c.severity === 'warning').length;
  const conflictPenalty = Math.max(0, 100 - errorConflicts * 20 - warningConflicts * 10);

  // 総合スコア（重み付き平均）
  const total = Math.round(
    venueUtilization * 0.3 +
    partBalance * 0.25 +
    timeEfficiency * 0.25 +
    conflictPenalty * 0.2
  );

  // 改善提案を生成
  const suggestions: string[] = [];
  if (venueUtilization < 70) suggestions.push('会場の利用率を向上させる余地があります');
  if (partBalance < 80) suggestions.push('パート間のバランスを改善できます');
  if (timeEfficiency < 80) suggestions.push('セッション間のギャップを最適化できます');
  if (errorConflicts > 0) suggestions.push('重大な競合を解決してください');
  if (warningConflicts > 0) suggestions.push('軽微な競合を確認してください');

  return {
    total,
    breakdown: {
      venueUtilization: Math.round(venueUtilization),
      partBalance: Math.round(partBalance),
      timeEfficiency: Math.round(timeEfficiency),
      conflictPenalty: Math.round(conflictPenalty),
    },
    suggestions,
  };
};