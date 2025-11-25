/**
 * 会場関連のマッパー
 */

import { VenueInfo } from '../types/session-editor';
import { VenueApiResponse } from '../types/api';

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
 * 会場一覧を優先度でソート
 * @param venues - 会場一覧
 * @returns ソートされた会場一覧
 */
export const sortVenuesByPriority = (venues: VenueInfo[]): VenueInfo[] => {
  return [...venues].sort((a, b) => {
    // 優先会場を先に、その後優先度順
    if (a.is_preferred && !b.is_preferred) return -1;
    if (!a.is_preferred && b.is_preferred) return 1;
    return (a.priority ?? 0) - (b.priority ?? 0);
  });
};

/**
 * 会場の表示名を生成
 * @param venue - 会場情報
 * @returns 表示名
 */
export const formatVenueDisplay = (venue: VenueInfo): string => {
  let display = venue.name;
  if (venue.is_preferred) {
    display += ' ⭐';
  }
  if (venue.priority && venue.priority > 0) {
    display += ` (優先度: ${venue.priority})`;
  }
  return display;
};

/**
 * 会場の色を取得（優先度に基づく）
 * @param venue - 会場情報
 * @returns 色コード
 */
export const getVenueColor = (venue: VenueInfo): string => {
  if (venue.is_preferred) {
    return '#3B82F6'; // 青
  }
  
  const colors = [
    '#10B981', // 緑
    '#F59E0B', // 黄
    '#EF4444', // 赤
    '#8B5CF6', // 紫
    '#06B6D4', // シアン
  ];
  
  return colors[(venue.priority ?? 0) % colors.length];
};
