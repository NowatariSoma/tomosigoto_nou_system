import { Group, GroupCreate, GroupUpdate, ApiResponse } from '@/features/practice-slots/types/groups';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export class GroupsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getAllGroups(): Promise<ApiResponse<Group[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/`);
      
      if (!response.ok) {
        console.error('Groups API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      // 直接配列が返される場合の対応
      if (Array.isArray(data)) {
        return { success: true, data: data };
      }
      return data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return {
        success: false,
        error: 'Failed to fetch groups - Network error'
      };
    }
  }

  async getGroupById(id: string): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}`);
      if (!response.ok) {
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      const data = await response.json();
      // 直接オブジェクトが返される場合の対応
      if (data && typeof data === 'object' && !data.success) {
        return { success: true, data: data };
      }
      return data;
    } catch (error) {
      console.error('Error fetching group:', error);
      return {
        success: false,
        error: 'Failed to fetch group'
      };
    }
  }

  async createGroup(groupData: GroupCreate): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      return {
        success: false,
        error: 'Failed to create group'
      };
    }
  }

  async updateGroup(id: string, groupData: GroupUpdate): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating group:', error);
      return {
        success: false,
        error: 'Failed to update group'
      };
    }
  }

  async deleteGroup(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting group:', error);
      return {
        success: false,
        error: 'Failed to delete group'
      };
    }
  }
}

export const groupsAPI = new GroupsAPI();
