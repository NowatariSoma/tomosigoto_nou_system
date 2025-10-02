import { 
  MemberAssignmentData, 
  CreateMemberAssignmentRequest, 
  UpdateMemberAssignmentRequest,
  MemberAssignmentWithDetails 
} from '../types';
import { supabase } from '../../../lib/supabase';

export class MemberAssignmentService {
  private readonly tableName = 'member_assignments';

  async getMemberAssignments(): Promise<MemberAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from(this.tableName)
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
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch member assignments: ${error.message}`);
    }

    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async getMemberAssignment(id: string): Promise<MemberAssignmentWithDetails> {
    const { data, error } = await supabase
      .from(this.tableName)
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
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch member assignment: ${error.message}`);
    }

    return this.mapResponseToMemberAssignmentWithDetails(data);
  }

  async getMemberAssignmentsByPart(partId: string): Promise<MemberAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from(this.tableName)
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
      .eq('part_id', partId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch member assignments by part: ${error.message}`);
    }

    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async getMemberAssignmentsByUser(userId: string): Promise<MemberAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from(this.tableName)
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
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch member assignments by user: ${error.message}`);
    }

    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async createMemberAssignment(data: CreateMemberAssignmentRequest): Promise<MemberAssignmentWithDetails> {
    const assignmentData = {
      user_id: data.user_id,
      part_id: data.part_id,
      category: data.category,
      display_order: data.display_order || 0,
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(assignmentData)
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
      .single();

    if (error) {
      throw new Error(`Failed to create member assignment: ${error.message}`);
    }

    return this.mapResponseToMemberAssignmentWithDetails(result);
  }

  async updateMemberAssignment(id: string, data: UpdateMemberAssignmentRequest): Promise<MemberAssignmentWithDetails> {
    const updateData: any = {};
    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.part_id !== undefined) updateData.part_id = data.part_id;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (error) {
      throw new Error(`Failed to update member assignment: ${error.message}`);
    }

    return this.mapResponseToMemberAssignmentWithDetails(result);
  }

  async deleteMemberAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete member assignment: ${error.message}`);
    }
  }

  private mapResponseToMemberAssignmentWithDetails(assignment: any): MemberAssignmentWithDetails {
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

export const memberAssignmentService = new MemberAssignmentService();
