import { supabase } from '@/lib/supabase';
import { MemberSummary, UpdateMemberRolePayload, UpdateInstructorFlagPayload } from '../types';

export class MemberManagementService {
  private readonly apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  private readonly basePath = '/admin/members/';

  private async getAuthHeaders(contentType: boolean = false): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      ...(contentType && { 'Content-Type': 'application/json' }),
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, init);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Failed to call ${path}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  }

  async listMembers(): Promise<MemberSummary[]> {
    const headers = await this.getAuthHeaders();
    const data = await this.request<MemberSummary[] | { data: MemberSummary[] }>(this.basePath, { headers });
    if (Array.isArray(data)) {
      return data;
    }
    return data.data;
  }

  async updateRole(memberId: string, payload: UpdateMemberRolePayload): Promise<MemberSummary> {
    const headers = await this.getAuthHeaders(true);
    return this.request<MemberSummary>(
      `${this.basePath}/${memberId}/role`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      }
    );
  }

  async updateInstructorFlag(memberId: string, payload: UpdateInstructorFlagPayload): Promise<MemberSummary> {
    const headers = await this.getAuthHeaders(true);
    return this.request<MemberSummary>(
      `${this.basePath}/${memberId}/instructor`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      }
    );
  }

  async deleteMember(memberId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await this.request<void>(
      `${this.basePath}/${memberId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
  }
}

export const memberManagementService = new MemberManagementService();

