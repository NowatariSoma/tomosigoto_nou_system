import { fetchApi, buildApiUrl } from '@/lib/api';
import { AbsentMember } from '../types/schedule';

export interface AttendanceUpdate {
  status?: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
}

export class AttendanceService {
  private readonly basePath = '/attendance';
  private readonly MAX_NOTES_LENGTH = 500;

  /**
   * 出欠記録を更新（管理者用）
   * @param attendanceId 出欠記録ID
   * @param updateData 更新データ
   * @returns 更新された出欠記録
   * @throws Error バリデーションエラーまたはAPIエラー
   */
  async updateAttendance(
    attendanceId: string,
    updateData: AttendanceUpdate
  ): Promise<any> {
    // バリデーション
    if (updateData.notes && updateData.notes.length > this.MAX_NOTES_LENGTH) {
      throw new Error(`備考は${this.MAX_NOTES_LENGTH}文字以内で入力してください`);
    }

    if (updateData.status && !['present', 'absent', 'late', 'no_show'].includes(updateData.status)) {
      throw new Error('無効なステータス値です');
    }

    try {
      const response = await fetchApi(
        buildApiUrl(`${this.basePath}/${attendanceId}`),
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || '出欠記録の更新に失敗しました');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('出欠記録の更新中にエラーが発生しました');
    }
  }
}

export const attendanceService = new AttendanceService();

