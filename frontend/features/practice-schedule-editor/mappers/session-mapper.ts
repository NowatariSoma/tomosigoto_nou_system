/**
 * セッション関連のマッパー
 */

import { 
  Session, 
  SessionDisplayInfo, 
  VenueInfo, 
  InstructorInfo 
} from '../types/session-editor';
import { 
  SessionApiResponse, 
  VenueApiResponse 
} from '../types/api';

/**
 * セッションを表示用情報にマッピング
 * @param session - セッション情報
 * @param venues - 会場一覧
 * @param instructors - 指導者一覧
 * @returns 表示用セッション情報
 */
export const mapSessionToDisplayInfo = (
  session: Session,
  venues: VenueInfo[],
  instructors: InstructorInfo[] = []
): SessionDisplayInfo => {
  const venue = venues.find(v => v.id === session.schedule_available_venue_id);
  const sessionInstructors = instructors.filter(i => 
    // ここでは仮の実装。実際の指導者との関連は別途実装が必要
    false
  );

  return {
    id: session.id,
    // title: session.title, // Session型にtitleプロパティは存在しない
    part_name: '', // パート名は別途取得が必要
    instructor_names: sessionInstructors.map(i => i.name),
    venue_name: venue?.name,
    time_slot: '', // 時間スロットは別途計算が必要
    priority: session.priority,
    notes: '', // 備考は別途取得が必要
  } as SessionDisplayInfo;
};

/**
 * セッション一覧を表示用情報にマッピング
 * @param sessions - セッション一覧
 * @param venues - 会場一覧
 * @param instructors - 指導者一覧
 * @returns 表示用セッション情報一覧
 */
export const mapSessionsToDisplayInfo = (
  sessions: Session[],
  venues: VenueInfo[],
  instructors: InstructorInfo[] = []
): SessionDisplayInfo[] => {
  return sessions.map(session => 
    mapSessionToDisplayInfo(session, venues, instructors)
  );
};

/**
 * APIレスポンスをセッションにマッピング
 * @param apiResponse - APIレスポンス
 * @returns セッション情報
 */
export const mapApiResponseToSession = (apiResponse: SessionApiResponse): Session => {
  return {
    id: apiResponse.id,
    schedule_id: apiResponse.schedule_id,
    part_id: apiResponse.part_id,
    // title: apiResponse.title, // Session型にtitleプロパティは存在しない
    slot_order: apiResponse.slot_order,
    schedule_available_venue_id: apiResponse.schedule_available_venue_id,
    priority: apiResponse.priority,
    created_at: apiResponse.created_at,
    updated_at: apiResponse.updated_at,
  };
};

/**
 * 会場APIレスポンスを会場情報にマッピング
 * @param apiResponse - 会場APIレスポンス
 * @returns 会場情報
 */
export const mapApiResponseToVenue = (apiResponse: VenueApiResponse): VenueInfo => {
  return {
    id: apiResponse.id,
    name: apiResponse.name,
    is_preferred: apiResponse.is_preferred,
    priority: apiResponse.priority,
    notes: apiResponse.notes,
  };
};

/**
 * セッションをテーブルセル用にグループ化
 * @param sessions - セッション一覧
 * @param venues - 会場一覧
 * @param timeSlots - 時間スロット一覧
 * @returns テーブルセル情報
 */
export const groupSessionsByVenueAndTime = (
  sessions: SessionDisplayInfo[],
  venues: VenueInfo[],
  timeSlots: string[]
): Record<string, Record<string, SessionDisplayInfo[]>> => {
  const cells: Record<string, Record<string, SessionDisplayInfo[]>> = {};

  // 会場ごとに初期化
  venues.forEach(venue => {
    cells[venue.id] = {};
    timeSlots.forEach(timeSlot => {
      cells[venue.id][timeSlot] = [];
    });
  });

  // セッションを配置
  sessions.forEach(session => {
    if (session.venue_name) {
      const venue = venues.find(v => v.name === session.venue_name);
      if (venue && session.time_slot) {
        if (!cells[venue.id][session.time_slot]) {
          cells[venue.id][session.time_slot] = [];
        }
        cells[venue.id][session.time_slot].push(session);
      }
    }
  });

  return cells;
};
