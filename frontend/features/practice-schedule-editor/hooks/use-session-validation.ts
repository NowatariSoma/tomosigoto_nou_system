/**
 * セッション検証用のカスタムフック
 */

import { useMemo } from 'react';
import { SessionFormData, VenueInfo } from '../types/session-editor';
import { VALIDATION } from '../constants';

/**
 * セッション検証用のカスタムフック
 */
export const useSessionValidation = (venues: VenueInfo[]) => {
  /**
   * セッションフォームの検証
   */
  const validateSessionForm = useMemo(() => {
    return (formData: SessionFormData): { isValid: boolean; errors: Partial<SessionFormData> } => {
      const errors: Partial<SessionFormData> = {};

      // タイトルの検証
      if (!formData.title || formData.title.trim().length < VALIDATION.MIN_TITLE_LENGTH) {
        errors.title = 'タイトルは必須です';
      } else if (formData.title.length > VALIDATION.MAX_TITLE_LENGTH) {
        errors.title = `タイトルは${VALIDATION.MAX_TITLE_LENGTH}文字以内で入力してください`;
      }

      // パート名の検証
      if (!formData.part_name || formData.part_name.trim().length < VALIDATION.MIN_PART_NAME_LENGTH) {
        errors.part_name = 'パート名は必須です';
      } else if (formData.part_name.length > VALIDATION.MAX_PART_NAME_LENGTH) {
        errors.part_name = `パート名は${VALIDATION.MAX_PART_NAME_LENGTH}文字以内で入力してください`;
      }

      // 会場の検証
      if (!formData.venue_id) {
        errors.venue_id = '会場は必須です';
      } else if (!venues.find(v => v.id === formData.venue_id)) {
        errors.venue_id = '選択された会場が無効です';
      }

      // 時間スロットの検証
      if (!formData.time_slot) {
        errors.time_slot = '時間は必須です';
      }

      // 備考の検証
      if (formData.notes && formData.notes.length > VALIDATION.MAX_NOTES_LENGTH) {
        errors.notes = `備考は${VALIDATION.MAX_NOTES_LENGTH}文字以内で入力してください`;
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    };
  }, [venues]);

  /**
   * 会場の重複チェック
   */
  const checkVenueConflict = useMemo(() => {
    return (
      venueId: string, 
      timeSlot: string, 
      excludeSessionId?: string
    ): boolean => {
      // 実装は後で追加（既存のセッションとの重複チェック）
      return false;
    };
  }, []);

  /**
   * 時間の妥当性チェック
   */
  const validateTimeSlot = useMemo(() => {
    return (timeSlot: string): boolean => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(timeSlot);
    };
  }, []);

  /**
   * 優先度の妥当性チェック
   */
  const validatePriority = useMemo(() => {
    return (priority: number): boolean => {
      return priority >= 0 && priority <= 10;
    };
  }, []);

  return {
    validateSessionForm,
    checkVenueConflict,
    validateTimeSlot,
    validatePriority,
  };
};
