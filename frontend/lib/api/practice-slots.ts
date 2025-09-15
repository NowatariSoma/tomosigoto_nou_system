// API client for practice slots endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ScheduleItem {
  id?: string;
  practice_slot_id?: string;
  time: string;
  duration: string;
  activity: string;
  columns: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PracticeSlot {
  id?: string;
  date: string;
  title?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  schedule_items?: ScheduleItem[];
}

export interface PracticeSlotCreate {
  date: string;
  title?: string;
  description?: string;
  is_active?: boolean;
}

export interface PracticeSlotUpdate {
  date?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
}

export interface ScheduleItemCreate {
  practice_slot_id: string;
  time: string;
  duration: string;
  activity: string;
  columns: string[];
}

export interface ScheduleItemUpdate {
  time?: string;
  duration?: string;
  activity?: string;
  columns?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export class PracticeSlotsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    return response.json();
  }

  // 練習表関連のメソッド

  async getAllPracticeSlots(): Promise<ApiResponse<PracticeSlot[]>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/`);
    return this.handleResponse<PracticeSlot[]>(response);
  }

  async getPracticeSlotById(practiceSlotId: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/${practiceSlotId}`);
    return this.handleResponse<PracticeSlot>(response);
  }

  async getPracticeSlotByDate(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const url = `${this.baseUrl}/practice-slots/date/${targetDate}`;
    console.log('API Call - getPracticeSlotByDate:', url);
    const response = await fetch(url);
    console.log('API Response status:', response.status);
    return this.handleResponse<PracticeSlot>(response);
  }

  async getPracticeSlotWithScheduleItems(practiceSlotId: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/${practiceSlotId}/with-items`);
    return this.handleResponse<PracticeSlot>(response);
  }

  async createPracticeSlot(practiceSlotData: PracticeSlotCreate): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(practiceSlotData),
    });
    return this.handleResponse<PracticeSlot>(response);
  }

  async createPracticeSlotWithSampleData(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/with-sample-data?target_date=${targetDate}`, {
      method: 'POST',
    });
    return this.handleResponse<PracticeSlot>(response);
  }

  async updatePracticeSlot(practiceSlotId: string, practiceSlotData: PracticeSlotUpdate): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/${practiceSlotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(practiceSlotData),
    });
    return this.handleResponse<PracticeSlot>(response);
  }

  async deletePracticeSlot(practiceSlotId: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/${practiceSlotId}`, {
      method: 'DELETE',
    });
    return this.handleResponse<null>(response);
  }

  // スケジュールアイテム関連のメソッド

  async createScheduleItem(practiceSlotId: string, scheduleItemData: ScheduleItemCreate): Promise<ApiResponse<ScheduleItem>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/${practiceSlotId}/schedule-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleItemData),
    });
    return this.handleResponse<ScheduleItem>(response);
  }

  async updateScheduleItem(scheduleItemId: string, scheduleItemData: ScheduleItemUpdate): Promise<ApiResponse<ScheduleItem>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/schedule-items/${scheduleItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleItemData),
    });
    return this.handleResponse<ScheduleItem>(response);
  }

  async deleteScheduleItem(scheduleItemId: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${this.baseUrl}/practice-slots/schedule-items/${scheduleItemId}`, {
      method: 'DELETE',
    });
    return this.handleResponse<null>(response);
  }
}

// Export a default instance
export const practiceSlotsAPI = new PracticeSlotsAPI();
