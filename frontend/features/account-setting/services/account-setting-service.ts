import { fetchApi, ApiError } from '../../../lib/api';
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
    const testUserId = this.getTestUserId();
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const response = await fetch(`${apiBaseUrl}${this.basePath}/profile-public?user_id=${testUserId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private getTestUserId(): string {
    let userId = sessionStorage.getItem('test-user-id');
    if (!userId) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      userId = `test-user-${timestamp}-${randomStr}`;
      sessionStorage.setItem('test-user-id', userId);
    }
    return userId;
  }

  async createProfile(profileData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const testUserId = this.getTestUserId();
    const response = await fetchApi(`${this.basePath}/profile-public?user_id=${testUserId}`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return response.json();
  }

  async updateProfile(updateData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const testUserId = this.getTestUserId();
    const response = await fetchApi(`${this.basePath}/profile-public?user_id=${testUserId}`, {
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
    const response = await fetchApi(`${this.basePath}/validate-public`, {
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
