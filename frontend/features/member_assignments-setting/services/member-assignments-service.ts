import { supabase } from '../../../lib/supabase';
import { 
  MemberAssignmentData, 
  CreateMemberAssignmentRequest, 
  UpdateMemberAssignmentRequest 
} from '../types';

export class MemberAssignmentsService {
  private readonly tableName = 'member_assignments';

  async getMemberAssignments(): Promise<MemberAssignmentData[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch member assignments: ${error.message}`);
    }

    console.log('Fetched member assignments from DB:', data);
    return (data || []).map(this.mapMemberAssignmentResponseToMemberAssignmentData);
  }

  async getMemberAssignment(id: string): Promise<MemberAssignmentData> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch member assignment: ${error.message}`);
    }

    return this.mapMemberAssignmentResponseToMemberAssignmentData(data);
  }

  async createMemberAssignment(data: CreateMemberAssignmentRequest): Promise<MemberAssignmentData> {
    const assignmentData = {
      user_id: data.user_id,
      part_id: data.part_id,
      category: data.category,
      display_order: data.display_order || 0,
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(assignmentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create member assignment: ${error.message}`);
    }

    return this.mapMemberAssignmentResponseToMemberAssignmentData(result);
  }

  async updateMemberAssignment(id: string, data: UpdateMemberAssignmentRequest): Promise<MemberAssignmentData> {
    const updateData: any = {};
    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.part_id !== undefined) updateData.part_id = data.part_id;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    console.log('Updating member assignment with data:', updateData);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member assignment: ${error.message}`);
    }

    console.log('Updated member assignment result:', result);
    return this.mapMemberAssignmentResponseToMemberAssignmentData(result);
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

  private mapMemberAssignmentResponseToMemberAssignmentData(assignment: any): MemberAssignmentData {
    console.log('Mapping member assignment data:', assignment);
    const mapped = {
      id: assignment.id,
      user_id: assignment.user_id,
      part_id: assignment.part_id,
      category: assignment.category,
      display_order: assignment.display_order,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    };
    console.log('Mapped member assignment data:', mapped);
    return mapped;
  }
}

export const memberAssignmentsService = new MemberAssignmentsService();
