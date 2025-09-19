import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../types';

// モックデータ
const mockSchedules: PracticeSchedule[] = [
  {
    id: '1',
    date: '2024-09-20',
    startTime: '09:00',
    endTime: '11:00',
    venueId: 'venue-1',
    venueName: '体育館A',
    campus: '今出川',
    description: 'バスケットボール練習',
    createdAt: '2024-09-19T10:00:00Z',
    updatedAt: '2024-09-19T10:00:00Z',
  },
  {
    id: '2',
    date: '2024-09-21',
    startTime: '14:00',
    endTime: '16:00',
    venueId: 'venue-2',
    venueName: '体育館B',
    campus: '京田辺',
    description: 'サッカー練習',
    createdAt: '2024-09-19T10:00:00Z',
    updatedAt: '2024-09-19T10:00:00Z',
  },
];

// モック会場データ
const mockVenues = [
  { id: 'venue-1', name: '体育館A', campus: '今出川' as const },
  { id: 'venue-2', name: '体育館B', campus: '京田辺' as const },
  { id: 'venue-3', name: 'グラウンド', campus: '今出川' as const },
];

export class MockPracticeScheduleService {
  private schedules = [...mockSchedules];

  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    // ネットワーク遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.schedules];
  }

  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const schedule = this.schedules.find(s => s.id === id);
    if (!schedule) {
      throw new Error('Practice schedule not found');
    }
    return { ...schedule };
  }

  async createPracticeSchedule(data: CreatePracticeScheduleRequest): Promise<PracticeSchedule> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const venue = mockVenues.find(v => v.id === data.venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const newSchedule: PracticeSchedule = {
      id: Date.now().toString(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      venueId: data.venueId,
      venueName: venue.name,
      campus: venue.campus,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.schedules.push(newSchedule);
    return { ...newSchedule };
  }

  async updatePracticeSchedule(id: string, data: UpdatePracticeScheduleRequest): Promise<PracticeSchedule> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Practice schedule not found');
    }

    const venue = data.venueId ? mockVenues.find(v => v.id === data.venueId) : null;
    
    this.schedules[index] = {
      ...this.schedules[index],
      ...data,
      venueName: venue?.name || this.schedules[index].venueName,
      campus: venue?.campus || this.schedules[index].campus,
      updatedAt: new Date().toISOString(),
    };

    return { ...this.schedules[index] };
  }

  async deletePracticeSchedule(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Practice schedule not found');
    }

    this.schedules.splice(index, 1);
  }
}

export const mockPracticeScheduleService = new MockPracticeScheduleService();
