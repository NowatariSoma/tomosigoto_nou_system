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
    try {
      // テスト用のユーザーIDを生成（実際の実装では認証から取得）
      const testUserId = this.getTestUserId();
      console.log('Fetching profile for user ID:', testUserId);
      const response = await fetchApi(`${this.basePath}/profile-public?user_id=${testUserId}`);
      const result = await response.json();
      console.log('Profile found:', result);
      return result;
    } catch (error: any) {
      // 404エラーの場合はnullを返す（プロフィールが存在しない）
      if (error.status === 404) {
        console.log('Profile not found (404), returning null');
        return null;
      }
      // その他のエラーは再発生
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  private getTestUserId(): string {
    // テスト用のユーザーIDを生成（実際の実装では認証から取得）
    // セッションストレージから取得、なければ新しく生成
    let userId = sessionStorage.getItem('test-user-id');
    if (!userId) {
      // より一意性の高いユーザーIDを生成（タイムスタンプ + ランダム文字列）
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      userId = `test-user-${timestamp}-${randomStr}`;
      sessionStorage.setItem('test-user-id', userId);
    }
    console.log('Generated test user ID:', userId);
    return userId;
  }

  async createProfile(profileData: AccountSettingUpdateRequest): Promise<AccountSettingProfile> {
    const testUserId = this.getTestUserId();
    
    console.log('Creating profile with user ID:', testUserId, 'and data:', profileData);
    const response = await fetchApi(`${this.basePath}/profile-public?user_id=${testUserId}`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    const result = await response.json();
    console.log('Profile creation response:', result);
    return result;
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
