import {
  PartWithAssignments,
  StageWithPartsAndAssignments,
  MemberAssignmentWithDetails
} from '../types';
import { supabase } from '../../../lib/supabase';

export class PartAssignmentsService {
  async getStagesWithPartsAndAssignments(): Promise<StageWithPartsAndAssignments[]> {
    console.log('[DEBUG] Starting to fetch stages with parts and assignments...');

    const { data, error } = await supabase
      .from('stages')
      .select(`
        id,
        name,
        performance_date,
        description,
        parts (
          id,
          name,
          member_assignments (
            id,
            user_id,
            category,
            display_order,
            created_at,
            updated_at
          )
        )
      `)
      .eq('status', 'active')
      .order('performance_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stages with parts and assignments: ${error.message}`);
    }

    console.log(`[DEBUG] Fetched ${data?.length || 0} stages`);

    // すべてのユーザーIDを収集
    const allUserIds = new Set<string>();
    data?.forEach(stage => {
      stage.parts?.forEach((part: any) => {
        part.member_assignments?.forEach((assignment: any) => {
          if (assignment.user_id) {
            allUserIds.add(assignment.user_id);
          }
        });
      });
    });

    console.log(`[DEBUG] Found ${allUserIds.size} unique users`);

    // ユーザー情報を一括で取得（単一のクエリで全ユーザー情報を取得）
    const userMap = new Map<string, any>();
    if (allUserIds.size > 0) {
      const userIds = Array.from(allUserIds);

      // 単一のクエリで全てのユーザー情報を取得
      const { data: userData } = await supabase
        .from('account_setting_profile')
        .select('user_id, first_name_katakana, last_name_katakana, first_name_kanji, last_name_kanji, email')
        .in('user_id', userIds);

      userData?.forEach(user => {
        userMap.set(user.user_id, user);
      });
    }

    console.log(`[DEBUG] Fetched user data for ${userMap.size} users in single query`);

    // データをマッピング（ユーザー情報は事前取得したものを使用）
    return (data || []).map(stage => this.mapStageResponseToStageWithPartsAndAssignments(stage, userMap));
  }

  async getPartWithAssignments(partId: string): Promise<PartWithAssignments> {
    const { data, error } = await supabase
      .from('parts')
      .select(`
        id,
        name,
        stage_id,
        stage:stage_id (
          id,
          name,
          performance_date
        ),
        member_assignments (
          id,
          user_id,
          category,
          display_order,
          created_at,
          updated_at
        )
      `)
      .eq('id', partId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch part with assignments: ${error.message}`);
    }

    // このパートに関連するユーザー情報を一括取得
    const userIds = (data.member_assignments || []).map((a: any) => a.user_id).filter(Boolean);
    const userMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from('account_setting_profile')
        .select('user_id, first_name_katakana, last_name_katakana, first_name_kanji, last_name_kanji, email')
        .in('user_id', userIds);

      userData?.forEach(user => {
        userMap.set(user.user_id, user);
      });
    }

    return this.mapPartResponseToPartWithAssignments(data, userMap);
  }

  async getAssignmentsByStage(stageId: string): Promise<MemberAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from('member_assignments')
      .select(`
        id,
        user_id,
        part_id,
        category,
        display_order,
        created_at,
        updated_at,
        part:part_id (
          id,
          name,
          stage:stage_id (
            id,
            name,
            performance_date
          )
        )
      `)
      .eq('part.stage_id', stageId);

    if (error) {
      throw new Error(`Failed to fetch assignments by stage: ${error.message}`);
    }

    // ユーザー情報を一括取得
    const userIds = (data || []).map(a => a.user_id).filter(Boolean);
    const userMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from('account_setting_profile')
        .select('user_id, first_name_katakana, last_name_katakana, first_name_kanji, last_name_kanji, email')
        .in('user_id', userIds);

      userData?.forEach(user => {
        userMap.set(user.user_id, user);
      });
    }

    return (data || []).map(assignment =>
      this.mapAssignmentResponseToMemberAssignmentWithDetails(assignment, userMap)
    );
  }

  private mapStageResponseToStageWithPartsAndAssignments(stage: any, userMap: Map<string, any>): StageWithPartsAndAssignments {
    return {
      id: stage.id,
      name: stage.name,
      performance_date: stage.performance_date,
      description: stage.description,
      parts: (stage.parts || []).map((part: any) => this.mapPartResponseToPartWithAssignments(part, userMap)),
    };
  }

  private mapPartResponseToPartWithAssignments(part: any, userMap: Map<string, any>): PartWithAssignments {
    return {
      id: part.id,
      name: part.name,
      stage_id: part.stage_id || part.stage?.id,
      stage_name: part.stage?.name || '',
      performance_date: part.stage?.performance_date || '',
      member_assignments: (part.member_assignments || []).map((assignment: any) =>
        this.mapAssignmentResponseToMemberAssignmentWithDetails(assignment, userMap)
      ),
    };
  }

  private mapAssignmentResponseToMemberAssignmentWithDetails(
    assignment: any,
    userMap: Map<string, any>
  ): MemberAssignmentWithDetails {
    // 事前に取得したユーザー情報を使用
    const userData = userMap.get(assignment.user_id);

    // 名前を構築
    const userName = userData
      ? `${userData.last_name_katakana} ${userData.first_name_katakana}`
      : 'Unknown User';

    return {
      id: assignment.id,
      user_id: assignment.user_id,
      part_id: assignment.part_id,
      category: assignment.category,
      display_order: assignment.display_order,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      user: {
        id: userData?.user_id || assignment.user_id,
        name: userName,
        email: userData?.email || '',
        first_name_katakana: userData?.first_name_katakana || '',
        last_name_katakana: userData?.last_name_katakana || '',
        first_name_kanji: userData?.first_name_kanji || '',
        last_name_kanji: userData?.last_name_kanji || '',
      },
      part: {
        id: assignment.part?.id || '',
        name: assignment.part?.name || '',
        stage: {
          id: assignment.part?.stage?.id || '',
          name: assignment.part?.stage?.name || '',
          performance_date: assignment.part?.stage?.performance_date || '',
        },
      },
    };
  }
}

export const partAssignmentsService = new PartAssignmentsService();