import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../types';
import { PracticeScheduleApiRequest, PracticeScheduleApiUpdateRequest } from '../types/api';
import { transformApiResponseToSchedule } from '../types/schemas';

// バックエンドのPracticeScheduleResponse型をフロントエンドのPracticeSchedule型にマッピング
// Zodスキーマを使用して検証・変換を行う
export const mapApiResponseToPracticeSchedule = (
  apiResponse: unknown,
  venueName?: string,
  campus?: string
): PracticeSchedule => {
  // Zodスキーマを使用してAPIレスポンスを検証・変換
  const schedule = transformApiResponseToSchedule(apiResponse);

  // 引数で渡された会場名・キャンパスがあれば上書き（後方互換性）
  if (venueName) {
    schedule.venueName = venueName;
  }
  if (campus) {
    schedule.campus = campus;
  }

  // 会場情報が空の場合、venuesから補完
  if (!schedule.venueName && schedule.venues && schedule.venues.length > 0) {
    schedule.venueName = schedule.venues[0].name;
    schedule.campus = schedule.venues[0].campus;
  }

  return schedule;
};

// フロントエンドのCreatePracticeScheduleRequest型をバックエンドのPracticeScheduleApiRequest型にマッピング
export const mapCreateRequestToApiRequest = (
  request: CreatePracticeScheduleRequest
): PracticeScheduleApiRequest => {
  return {
    schedule_date: request.date,
    start_time: request.startTime,
    end_time: request.endTime,
    division_count: request.divisionCount || 6,
    title: request.title || '',
    description: request.description || '',
    schedule_type: request.scheduleType || 'regular',
    status: request.status || 'active',
    // 複数部屋選択対応
    venue_ids: request.venueIds || (request.venueId ? [request.venueId] : []),
    // ステージ（舞台）選択対応
    stage_id: request.stageId || undefined,
  };
};

// フロントエンドのUpdatePracticeScheduleRequest型をバックエンドのPracticeScheduleApiUpdateRequest型にマッピング
export const mapUpdateRequestToApiRequest = (
  request: UpdatePracticeScheduleRequest
): PracticeScheduleApiUpdateRequest => {
  const apiRequest: PracticeScheduleApiUpdateRequest = {};

  if (request.date !== undefined) apiRequest.schedule_date = request.date;
  if (request.startTime !== undefined) apiRequest.start_time = request.startTime;
  if (request.endTime !== undefined) apiRequest.end_time = request.endTime;
  if (request.divisionCount !== undefined) apiRequest.division_count = request.divisionCount;
  if (request.title !== undefined) apiRequest.title = request.title;
  if (request.description !== undefined) apiRequest.description = request.description;
  if (request.scheduleType !== undefined) apiRequest.schedule_type = request.scheduleType;
  if (request.status !== undefined) apiRequest.status = request.status;
  // 複数部屋選択対応
  if (request.venueIds !== undefined) {
    apiRequest.venue_ids = request.venueIds;
  } else if (request.venueId !== undefined) {
    apiRequest.venue_ids = [request.venueId];
  }
  // ステージ（舞台）選択対応
  if (request.stageId !== undefined) apiRequest.stage_id = request.stageId;

  return apiRequest;
};
