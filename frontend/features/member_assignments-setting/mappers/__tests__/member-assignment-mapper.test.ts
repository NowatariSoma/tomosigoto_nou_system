import { describe, it, expect } from 'vitest';
import {
  mapMemberAssignmentResponseToMemberAssignmentData,
  mapMemberAssignmentResponseToMemberAssignmentWithDetails,
  mapCreateMemberAssignmentRequestToMemberAssignment,
} from '../member-assignment-mapper';

describe('member-assignment-mapper', () => {
  describe('mapMemberAssignmentResponseToMemberAssignmentData', () => {
    it('完全なレスポンスを正しくMemberAssignmentDataにマッピングする', () => {
      const response = {
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentData(response);

      expect(result).toEqual({
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
    });

    it('nullの場合はデフォルトの空MemberAssignmentDataを返す', () => {
      const result = mapMemberAssignmentResponseToMemberAssignmentData(null);

      expect(result).toEqual({
        id: '',
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
        created_at: '',
        updated_at: '',
      });
    });

    it('undefinedの場合はデフォルトの空MemberAssignmentDataを返す', () => {
      const result = mapMemberAssignmentResponseToMemberAssignmentData(undefined);

      expect(result).toEqual({
        id: '',
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
        created_at: '',
        updated_at: '',
      });
    });

    it('オプショナルフィールドが欠けている場合はデフォルト値にフォールバックする', () => {
      const response = {
        id: 'assignment-1',
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentData(response);

      expect(result).toEqual({
        id: 'assignment-1',
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
        created_at: '',
        updated_at: '',
      });
    });

    it('category=maiの場合はmaiを返す', () => {
      const response = {
        id: 'assignment-1',
        category: 'mai' as const,
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentData(response);

      expect(result.category).toBe('mai');
    });

    it('categoryが未指定の場合はデフォルトでutaiを返す', () => {
      const response = {
        id: 'assignment-1',
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentData(response);

      expect(result.category).toBe('utai');
    });
  });

  describe('mapMemberAssignmentResponseToMemberAssignmentWithDetails', () => {
    it('ネストされたuserとpartを含む完全なレスポンスを正しくマッピングする', () => {
      const response = {
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-1',
          name: '山田太郎',
          email: 'yamada@example.com',
          first_name_katakana: 'タロウ',
          last_name_katakana: 'ヤマダ',
          first_name_kanji: '太郎',
          last_name_kanji: '山田',
        },
        part: {
          id: 'part-1',
          name: 'シテ',
          stage: {
            id: 'stage-1',
            name: '高砂',
            performance_date: '2024-06-15',
          },
        },
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(response);

      expect(result).toEqual({
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-1',
          name: '山田太郎',
          email: 'yamada@example.com',
          first_name_katakana: 'タロウ',
          last_name_katakana: 'ヤマダ',
          first_name_kanji: '太郎',
          last_name_kanji: '山田',
        },
        part: {
          id: 'part-1',
          name: 'シテ',
          stage: {
            id: 'stage-1',
            name: '高砂',
            performance_date: '2024-06-15',
          },
        },
      });
    });

    it('nullの場合はデフォルトの空MemberAssignmentWithDetailsを返す', () => {
      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(null);

      expect(result).toEqual({
        id: '',
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
        created_at: '',
        updated_at: '',
        user: {
          id: '',
          name: '',
          email: '',
          first_name_katakana: '',
          last_name_katakana: '',
          first_name_kanji: '',
          last_name_kanji: '',
        },
        part: {
          id: '',
          name: '',
          stage: {
            id: '',
            name: '',
            performance_date: '',
          },
        },
      });
    });

    it('undefinedの場合はデフォルトの空MemberAssignmentWithDetailsを返す', () => {
      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(undefined);

      expect(result).toEqual({
        id: '',
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
        created_at: '',
        updated_at: '',
        user: {
          id: '',
          name: '',
          email: '',
          first_name_katakana: '',
          last_name_katakana: '',
          first_name_kanji: '',
          last_name_kanji: '',
        },
        part: {
          id: '',
          name: '',
          stage: {
            id: '',
            name: '',
            performance_date: '',
          },
        },
      });
    });

    it('userデータがない場合は空のuserフィールドを返す', () => {
      const response = {
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'mai' as const,
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        part: {
          id: 'part-1',
          name: 'ワキ',
          stage: {
            id: 'stage-1',
            name: '羽衣',
            performance_date: '2024-07-20',
          },
        },
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(response);

      expect(result.user).toEqual({
        id: '',
        name: '',
        email: '',
        first_name_katakana: '',
        last_name_katakana: '',
        first_name_kanji: '',
        last_name_kanji: '',
      });
    });

    it('partデータがない場合は空のpartフィールドを返す', () => {
      const response = {
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-1',
          name: '佐藤花子',
          email: 'sato@example.com',
          first_name_katakana: 'ハナコ',
          last_name_katakana: 'サトウ',
          first_name_kanji: '花子',
          last_name_kanji: '佐藤',
        },
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(response);

      expect(result.part).toEqual({
        id: '',
        name: '',
        stage: {
          id: '',
          name: '',
          performance_date: '',
        },
      });
    });

    it('part.stageがない場合は空のstageフィールドを返す', () => {
      const response = {
        id: 'assignment-1',
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        part: {
          id: 'part-1',
          name: 'シテ',
          stage: undefined as unknown as { id: string; name: string; performance_date: string },
        },
      };

      const result = mapMemberAssignmentResponseToMemberAssignmentWithDetails(response);

      expect(result.part.stage).toEqual({
        id: '',
        name: '',
        performance_date: '',
      });
    });
  });

  describe('mapCreateMemberAssignmentRequestToMemberAssignment', () => {
    it('完全なリクエストを正しくマッピングする', () => {
      const request = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 5,
      };

      const result = mapCreateMemberAssignmentRequestToMemberAssignment(request);

      expect(result).toEqual({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 5,
      });
    });

    it('display_orderが0の場合は0を返す', () => {
      const request = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'mai' as const,
        display_order: 0,
      };

      const result = mapCreateMemberAssignmentRequestToMemberAssignment(request);

      expect(result.display_order).toBe(0);
    });

    it('display_orderが未指定の場合はデフォルトで0を返す', () => {
      const request = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
      };

      const result = mapCreateMemberAssignmentRequestToMemberAssignment(request);

      expect(result.display_order).toBe(0);
    });
  });
});
