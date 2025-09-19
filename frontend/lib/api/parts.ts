import { Part, PartCreate, PartUpdate } from '@/features/practice-slots/types/parts';

const API_BASE_URL = 'http://localhost:8000/api/v1/practice_slots';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class PartsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getAllParts(): Promise<ApiResponse<Part[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/parts/`);
      
      if (!response.ok) {
        console.error('Parts API error:', response.status, response.statusText);
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
      console.error('Error fetching parts:', error);
      return {
        success: false,
        error: 'Failed to fetch parts - Network error'
      };
    }
  }

  async getPartById(id: string): Promise<ApiResponse<Part>> {
    try {
      const response = await fetch(`${this.baseUrl}/parts/${id}`);
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
      console.error('Error fetching part:', error);
      return {
        success: false,
        error: 'Failed to fetch part'
      };
    }
  }

  async createPart(partData: PartCreate): Promise<ApiResponse<Part>> {
    try {
      const response = await fetch(`${this.baseUrl}/parts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating part:', error);
      return {
        success: false,
        error: 'Failed to create part'
      };
    }
  }

  async updatePart(id: string, partData: PartUpdate): Promise<ApiResponse<Part>> {
    try {
      const response = await fetch(`${this.baseUrl}/parts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating part:', error);
      return {
        success: false,
        error: 'Failed to update part'
      };
    }
  }

  async deletePart(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}/parts/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting part:', error);
      return {
        success: false,
        error: 'Failed to delete part'
      };
    }
  }
}

export const partsAPI = new PartsAPI();
