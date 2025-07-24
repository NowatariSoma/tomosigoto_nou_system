import { GeneratedSchedule, RegenerationParams, SessionEditData } from '../types/generatedSchedule';

const API_BASE_URL = '/api/schedule-generator';

/**
 * スケジュール調整結果を検証するAPI
 */
export const validateScheduleAdjustment = async (
  schedule: GeneratedSchedule
): Promise<{
  isValid: boolean;
  conflicts: GeneratedSchedule['conflicts'];
  optimizationScore: GeneratedSchedule['optimizationScore'];
}> => {
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    throw new Error(`Validation failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * スケジュールを確定するAPI
 */
export const confirmSchedule = async (
  schedule: GeneratedSchedule
): Promise<{ success: boolean; confirmedScheduleId: string }> => {
  const response = await fetch(`${API_BASE_URL}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    throw new Error(`Schedule confirmation failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 部分的な再最適化を要求するAPI
 */
export const requestPartialOptimization = async (
  schedule: GeneratedSchedule,
  sessionIds: string[],
  constraints?: Record<string, any>
): Promise<GeneratedSchedule> => {
  const response = await fetch(`${API_BASE_URL}/optimize-partial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schedule,
      sessionIds,
      constraints,
    }),
  });

  if (!response.ok) {
    throw new Error(`Partial optimization failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 完全な再生成を要求するAPI
 */
export const requestRegeneration = async (
  params: RegenerationParams
): Promise<GeneratedSchedule> => {
  const response = await fetch(`${API_BASE_URL}/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Regeneration failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * セッション編集の妥当性をチェックするAPI
 */
export const validateSessionEdit = async (
  sessionId: string,
  editData: SessionEditData,
  currentSchedule: GeneratedSchedule
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/validate-session-edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      editData,
      currentSchedule,
    }),
  });

  if (!response.ok) {
    throw new Error(`Session edit validation failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * セッション移動の妥当性をチェックするAPI
 */
export const validateSessionMove = async (
  sessionId: string,
  newDate: Date,
  newStartTime: string,
  newEndTime: string,
  newVenueId: number,
  currentSchedule: GeneratedSchedule
): Promise<{
  isValid: boolean;
  conflicts: GeneratedSchedule['conflicts'];
  suggestions: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/validate-session-move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      newDate: newDate.toISOString(),
      newStartTime,
      newEndTime,
      newVenueId,
      currentSchedule,
    }),
  });

  if (!response.ok) {
    throw new Error(`Session move validation failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 競合解決の候補を取得するAPI
 */
export const getConflictResolutionSuggestions = async (
  conflictId: string,
  schedule: GeneratedSchedule
): Promise<{
  suggestions: Array<{
    id: string;
    description: string;
    changes: Array<{
      sessionId: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    impactScore: number;
  }>;
}> => {
  const response = await fetch(`${API_BASE_URL}/conflict-resolution-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conflictId,
      schedule,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get conflict resolution suggestions: ${response.statusText}`);
  }

  return response.json();
};

/**
 * 最適化スコアの詳細を取得するAPI
 */
export const getOptimizationScoreDetails = async (
  schedule: GeneratedSchedule
): Promise<{
  score: GeneratedSchedule['optimizationScore'];
  details: {
    venueUtilizationDetails: Array<{
      venueId: number;
      venueName: string;
      utilizationRate: number;
      totalHours: number;
      maxPossibleHours: number;
    }>;
    partBalanceDetails: Array<{
      partId: number;
      partName: string;
      sessionCount: number;
      averageSessionCount: number;
    }>;
    timeEfficiencyDetails: Array<{
      date: string;
      sessions: number;
      totalGapHours: number;
      efficiencyScore: number;
    }>;
    conflictDetails: Array<{
      conflictId: string;
      type: string;
      severity: string;
      affectedSessions: number;
      impactScore: number;
    }>;
  };
}> => {
  const response = await fetch(`${API_BASE_URL}/optimization-score-details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get optimization score details: ${response.statusText}`);
  }

  return response.json();
};

/**
 * スケジュールのエクスポート（PDF等）
 */
export const exportSchedule = async (
  schedule: GeneratedSchedule,
  format: 'pdf' | 'excel' | 'csv',
  options?: {
    includeConflicts?: boolean;
    includeOptimizationScore?: boolean;
    dateRange?: { start: Date; end: Date };
    venueIds?: number[];
    partIds?: number[];
  }
): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schedule,
      format,
      options: {
        ...options,
        dateRange: options?.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString(),
        } : undefined,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
};

/**
 * エラーハンドリング用のヘルパー関数
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Unknown API error occurred';
};

/**
 * API リクエストの共通設定
 */
export const getApiHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    // 必要に応じて認証ヘッダーなどを追加
  };
};