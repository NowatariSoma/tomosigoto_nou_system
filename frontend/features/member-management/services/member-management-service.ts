import { fetchApi } from '@/lib/api';
import { MemberSummary, UpdateMemberRolePayload, UpdateInstructorFlagPayload } from '../types';

export class MemberManagementService {
  private readonly basePath = '/admin/members';

  async listMembers(): Promise<MemberSummary[]> {
    const response = await fetchApi(`${this.basePath}/`);
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return data.data;
  }

  async updateRole(memberId: string, payload: UpdateMemberRolePayload): Promise<MemberSummary> {
    const response = await fetchApi(`${this.basePath}/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  async updateInstructorFlag(memberId: string, payload: UpdateInstructorFlagPayload): Promise<MemberSummary> {
    const response = await fetchApi(`${this.basePath}/${memberId}/instructor`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  async deleteMember(memberId: string): Promise<void> {
    await fetchApi(`${this.basePath}/${memberId}`, {
      method: 'DELETE',
    });
  }
}

export const memberManagementService = new MemberManagementService();
