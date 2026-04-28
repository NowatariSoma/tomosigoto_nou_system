import { fetchApi } from '../../../lib/api';
import {
  MemberAssignmentData,
  CreateMemberAssignmentRequest,
  UpdateMemberAssignmentRequest
} from '../types';

export class MemberAssignmentsService {
  async getMemberAssignments(): Promise<MemberAssignmentData[]> {
    const response = await fetchApi('/member-assignments/');
    const data = await response.json();
    return (data || []).map(this.mapMemberAssignmentResponseToMemberAssignmentData);
  }

  async getMemberAssignment(id: string): Promise<MemberAssignmentData> {
    const response = await fetchApi(`/member-assignments/${id}`);
    const data = await response.json();
    return this.mapMemberAssignmentResponseToMemberAssignmentData(data);
  }

  async createMemberAssignment(data: CreateMemberAssignmentRequest): Promise<MemberAssignmentData> {
    const response = await fetchApi('/member-assignments/', {
      method: 'POST',
      body: JSON.stringify({
        user_id: data.user_id,
        part_id: data.part_id,
        category: data.category,
        display_order: data.display_order || 0,
      }),
    });
    const result = await response.json();
    return this.mapMemberAssignmentResponseToMemberAssignmentData(result);
  }

  async updateMemberAssignment(id: string, data: UpdateMemberAssignmentRequest): Promise<MemberAssignmentData> {
    const updateData: Record<string, unknown> = {};
    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.part_id !== undefined) updateData.part_id = data.part_id;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    const response = await fetchApi(`/member-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const result = await response.json();
    return this.mapMemberAssignmentResponseToMemberAssignmentData(result);
  }

  async deleteMemberAssignment(id: string): Promise<void> {
    await fetchApi(`/member-assignments/${id}`, { method: 'DELETE' });
  }

  private mapMemberAssignmentResponseToMemberAssignmentData(assignment: any): MemberAssignmentData {
    const mapped = {
      id: assignment.id,
      user_id: assignment.user_id,
      part_id: assignment.part_id,
      category: assignment.category,
      display_order: assignment.display_order,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    };
    return mapped;
  }
}

export const memberAssignmentsService = new MemberAssignmentsService();
