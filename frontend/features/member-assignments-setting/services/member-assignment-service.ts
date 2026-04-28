import {
  MemberAssignmentData,
  CreateMemberAssignmentRequest,
  UpdateMemberAssignmentRequest,
  MemberAssignmentWithDetails
} from '../types';
import { fetchApi } from '../../../lib/api';

export class MemberAssignmentService {
  async getMemberAssignments(): Promise<MemberAssignmentWithDetails[]> {
    const response = await fetchApi('/member-assignments/?include_details=true');
    const data = await response.json();
    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async getMemberAssignment(id: string): Promise<MemberAssignmentWithDetails> {
    const response = await fetchApi(`/member-assignments/${id}?include_details=true`);
    const data = await response.json();
    return this.mapResponseToMemberAssignmentWithDetails(data);
  }

  async getMemberAssignmentsByPart(partId: string): Promise<MemberAssignmentWithDetails[]> {
    const response = await fetchApi(`/member-assignments/?part_id=${partId}&include_details=true`);
    const data = await response.json();
    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async getMemberAssignmentsByUser(userId: string): Promise<MemberAssignmentWithDetails[]> {
    const response = await fetchApi(`/member-assignments/?user_id=${userId}&include_details=true`);
    const data = await response.json();
    return (data || []).map(this.mapResponseToMemberAssignmentWithDetails);
  }

  async createMemberAssignment(data: CreateMemberAssignmentRequest): Promise<MemberAssignmentWithDetails> {
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
    return this.mapResponseToMemberAssignmentWithDetails(result);
  }

  async updateMemberAssignment(id: string, data: UpdateMemberAssignmentRequest): Promise<MemberAssignmentWithDetails> {
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
    return this.mapResponseToMemberAssignmentWithDetails(result);
  }

  async deleteMemberAssignment(id: string): Promise<void> {
    await fetchApi(`/member-assignments/${id}`, { method: 'DELETE' });
  }

  private mapResponseToMemberAssignmentWithDetails(assignment: any): MemberAssignmentWithDetails {
    // 名前を構築
    const userName = assignment.user
      ? `${assignment.user.last_name_katakana} ${assignment.user.first_name_katakana}`
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
        id: assignment.user?.id || assignment.user_id,
        name: userName,
        email: assignment.user?.email || '',
        first_name_katakana: assignment.user?.first_name_katakana || '',
        last_name_katakana: assignment.user?.last_name_katakana || '',
        first_name_kanji: assignment.user?.first_name_kanji || '',
        last_name_kanji: assignment.user?.last_name_kanji || '',
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

export const memberAssignmentService = new MemberAssignmentService();
