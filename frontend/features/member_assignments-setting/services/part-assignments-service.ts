import { 
  PartWithAssignments, 
  StageWithPartsAndAssignments,
  MemberAssignmentWithDetails 
} from '../types';
import { supabase } from '../../../lib/supabase';

export class PartAssignmentsService {
  async getStagesWithPartsAndAssignments(): Promise<StageWithPartsAndAssignments[]> {
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
            updated_at,
            user:user_id (
              id,
              name,
              email
            )
          )
        )
      `)
      .eq('status', 'active')
      .order('performance_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stages with parts and assignments: ${error.message}`);
    }

    return (data || []).map((stage) => this.mapStageResponseToStageWithPartsAndAssignments(stage));
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
          updated_at,
          user:user_id (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', partId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch part with assignments: ${error.message}`);
    }

    return this.mapPartResponseToPartWithAssignments(data);
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
        user:user_id (
          id,
          name,
          email
        ),
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
      .eq('part.stage_id', stageId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch assignments by stage: ${error.message}`);
    }

    return (data || []).map((assignment) => this.mapAssignmentResponseToMemberAssignmentWithDetails(assignment));
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
    return {
      id: assignment.id,
      user_id: assignment.user_id,
      part_id: assignment.part_id,
      category: assignment.category,
      display_order: assignment.display_order,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      user: {
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
      },
      part: {
        id: assignment.part.id,
        name: assignment.part.name,
        stage: {
          id: assignment.part.stage.id,
          name: assignment.part.stage.name,
          performance_date: assignment.part.stage.performance_date,
        },
      },
    };
  }
}

export const partAssignmentsService = new PartAssignmentsService();
