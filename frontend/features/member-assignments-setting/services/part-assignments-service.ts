import {
  PartWithAssignments,
  StageWithPartsAndAssignments,
  MemberAssignmentWithDetails
} from '../types';
import { fetchApi } from '../../../lib/api';

export class PartAssignmentsService {
  async getStagesWithPartsAndAssignments(): Promise<StageWithPartsAndAssignments[]> {
    const response = await fetchApi('/member-assignments/stages-with-parts');
    const data = await response.json();
    return (data || []).map(this.mapStageResponseToStageWithPartsAndAssignments.bind(this));
  }

  async getPartWithAssignments(partId: string): Promise<PartWithAssignments> {
    const response = await fetchApi(`/member-assignments/parts/${partId}`);
    const data = await response.json();
    return this.mapPartResponseToPartWithAssignments(data);
  }

  async getAssignmentsByStage(stageId: string): Promise<MemberAssignmentWithDetails[]> {
    const response = await fetchApi(`/member-assignments?stage_id=${stageId}&include_details=true`);
    const data = await response.json();
    return (data || []).map(this.mapAssignmentResponseToMemberAssignmentWithDetails.bind(this));
  }

  private mapStageResponseToStageWithPartsAndAssignments(stage: any): StageWithPartsAndAssignments {
    return {
      id: stage.id,
      name: stage.name,
      performance_date: stage.performance_date,
      description: stage.description,
      parts: (stage.parts || []).map((part: any) => this.mapPartResponseToPartWithAssignments(part)),
    };
  }

  private mapPartResponseToPartWithAssignments(part: any): PartWithAssignments {
    return {
      id: part.id,
      name: part.name,
      stage_id: part.stage_id || part.stage?.id,
      stage_name: part.stage?.name || '',
      performance_date: part.stage?.performance_date || '',
      member_assignments: (part.member_assignments || []).map((assignment: any) =>
        this.mapAssignmentResponseToMemberAssignmentWithDetails(assignment)
      ),
    };
  }

  private mapAssignmentResponseToMemberAssignmentWithDetails(assignment: any): MemberAssignmentWithDetails {
    const userData = assignment.user;

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
        id: userData?.id || userData?.user_id || assignment.user_id,
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
