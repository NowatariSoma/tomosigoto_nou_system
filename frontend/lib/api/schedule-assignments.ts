import { 
  ScheduleAssignment, 
  ScheduleAssignmentCreate, 
  ScheduleAssignmentUpdate, 
  ScheduleAssignmentWithDetails,
  ApiResponse 
} from '@/features/practice-slots/types/schedule-assignments';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export class ScheduleAssignmentsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getAllAssignments(): Promise<ApiResponse<ScheduleAssignment[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/`);
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        return { success: true, data: data };
      }
      return data;
    } catch (error) {
      console.error('Error fetching schedule assignments:', error);
      return {
        success: false,
        error: 'Failed to fetch schedule assignments - Network error'
      };
    }
  }

  async getAssignmentsByPracticeSlot(practiceSlotId: string): Promise<ApiResponse<ScheduleAssignmentWithDetails[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/practice-slot/${practiceSlotId}`);
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        return { success: true, data: data };
      }
      return data;
    } catch (error) {
      console.error('Error fetching schedule assignments by practice slot:', error);
      return {
        success: false,
        error: 'Failed to fetch schedule assignments - Network error'
      };
    }
  }

  async getAssignmentByTimeAndGroup(
    practiceSlotId: string, 
    timeSlot: string, 
    groupId: string
  ): Promise<ApiResponse<ScheduleAssignmentWithDetails>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/schedule-assignments/practice-slot/${practiceSlotId}/time/${timeSlot}/group/${groupId}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Assignment not found' };
        }
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('Error fetching schedule assignment:', error);
      return {
        success: false,
        error: 'Failed to fetch schedule assignment - Network error'
      };
    }
  }

  async createAssignment(assignmentData: ScheduleAssignmentCreate): Promise<ApiResponse<ScheduleAssignment>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('Error creating schedule assignment:', error);
      return {
        success: false,
        error: 'Failed to create schedule assignment - Network error'
      };
    }
  }

  async updateAssignment(assignmentId: string, assignmentData: ScheduleAssignmentUpdate): Promise<ApiResponse<ScheduleAssignment>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('Error updating schedule assignment:', error);
      return {
        success: false,
        error: 'Failed to update schedule assignment - Network error'
      };
    }
  }

  async deleteAssignment(assignmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule assignment:', error);
      return {
        success: false,
        error: 'Failed to delete schedule assignment - Network error'
      };
    }
  }

  async upsertAssignment(assignmentData: ScheduleAssignmentCreate): Promise<ApiResponse<ScheduleAssignment>> {
    try {
      const response = await fetch(`${this.baseUrl}/schedule-assignments/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });
      
      if (!response.ok) {
        console.error('Schedule Assignments API error:', response.status, response.statusText);
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('Error upserting schedule assignment:', error);
      return {
        success: false,
        error: 'Failed to upsert schedule assignment - Network error'
      };
    }
  }
}

export const scheduleAssignmentsAPI = new ScheduleAssignmentsAPI();




