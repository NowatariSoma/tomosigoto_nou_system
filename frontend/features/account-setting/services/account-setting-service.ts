import { ApiError } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import {
  AccountSettingProfile,
  AccountSettingUpdateRequest,
  Department,
  ValidationResponse
} from '../types';
import { API_ENDPOINTS } from '../constants';

export class AccountSettingService {
  private readonly basePath = API_ENDPOINTS.ACCOUNT_SETTING;
  private readonly apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();

    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };
  }

  async getCurrentUserProfile(): Promise<AccountSettingProfile | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCurrentUserRole(): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}/users/me/role`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUserInfo(): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}/users/me`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createProfile(profileData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateProfile(updateData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteProfile(): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }
  }

  async getAllDepartments(): Promise<Department[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/departments`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getDepartmentByCode(departmentCode: string): Promise<Department> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/departments/${departmentCode}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async validateProfileData(profileData: Record<string, any>): Promise<ValidationResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getProfileHistory(limit: number = 50): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile/history?limit=${limit}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getFieldHistory(fieldName: string, limit: number = 20): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.apiBaseUrl}${this.basePath}/profile/history/${fieldName}?limit=${limit}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const accountSettingService = new AccountSettingService();
