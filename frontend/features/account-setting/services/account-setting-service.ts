import { fetchApi, ApiError } from '@/lib/api';
import {
  AccountSettingProfile,
  AccountSettingUpdateRequest,
  Department,
  ValidationResponse
} from '../types';
import { API_ENDPOINTS } from '../constants';

export class AccountSettingService {
  private readonly basePath = API_ENDPOINTS.ACCOUNT_SETTING;

  async getCurrentUserProfile(): Promise<AccountSettingProfile | null> {
    try {
      const response = await fetchApi(`${this.basePath}/profile`);
      return response.json();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCurrentUserRole(): Promise<any> {
    const response = await fetchApi('/users/me/role');
    return response.json();
  }

  async getCurrentUserInfo(): Promise<any> {
    const response = await fetchApi('/users/me');
    return response.json();
  }

  async createProfile(profileData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const response = await fetchApi(`${this.basePath}/profile`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return response.json();
  }

  async updateProfile(updateData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const response = await fetchApi(`${this.basePath}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.json();
  }

  async deleteProfile(): Promise<void> {
    await fetchApi(`${this.basePath}/profile`, {
      method: 'DELETE',
    });
  }

  async getAllDepartments(): Promise<Department[]> {
    const response = await fetchApi(`${this.basePath}/departments`);
    return response.json();
  }

  async getDepartmentByCode(departmentCode: string): Promise<Department> {
    const response = await fetchApi(`${this.basePath}/departments/${departmentCode}`);
    return response.json();
  }

  async validateProfileData(profileData: Record<string, any>): Promise<ValidationResponse> {
    const response = await fetchApi(`${this.basePath}/validate`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return response.json();
  }

  async getProfileHistory(limit: number = 50): Promise<any[]> {
    const response = await fetchApi(`${this.basePath}/profile/history?limit=${limit}`);
    return response.json();
  }

  async getFieldHistory(fieldName: string, limit: number = 20): Promise<any[]> {
    const response = await fetchApi(`${this.basePath}/profile/history/${fieldName}?limit=${limit}`);
    return response.json();
  }
}

export const accountSettingService = new AccountSettingService();
