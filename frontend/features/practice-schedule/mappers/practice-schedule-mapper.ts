import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../types';
import { PracticeScheduleApiResponse, PracticeScheduleApiRequest, PracticeScheduleApiUpdateRequest } from '../types/api';

// バックエンドのPracticeScheduleResponse型をフロントエンドのPracticeSchedule型にマッピング
export const mapApiResponseToPracticeSchedule = (
  apiResponse: PracticeScheduleApiResponse | null | undefined,
  venueName?: string,
  campus?: string
): PracticeSchedule => {
  if (!apiResponse) {
    return {
      id: '',
      date: '',
      startTime: '',
      endTime: '',
      venueId: '',
      venueName: '',
      campus: '',
      title: '',
      description: '',
      createdAt: '',
      updatedAt: '',
    };
  }
  
  return {
    id: apiResponse.id || '',
    date: apiResponse.schedule_date || '',
    startTime: apiResponse.start_time || '',
    endTime: apiResponse.end_time || '',
    venueId: '', // 会場IDは別途取得が必要
    venueName: venueName || '',
    campus: campus || '',
    title: apiResponse.title || '',
    description: apiResponse.description || '',
    createdAt: apiResponse.created_at || '',
    updatedAt: apiResponse.updated_at || '',
  };
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
  
  return apiRequest;
};
