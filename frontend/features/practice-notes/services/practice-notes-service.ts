import { PracticeNote, PracticeNoteCreate, PracticeNoteUpdate } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeNotesService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_NOTES;

  async getAllNotes(): Promise<PracticeNote[]> {
    const response = await fetchApi(this.basePath);
    return await response.json();
  }

  async getNote(id: string): Promise<PracticeNote> {
    const response = await fetchApi(`${this.basePath}${id}`);
    return await response.json();
  }

  async getNotesByPractice(practiceScheduleId: string): Promise<PracticeNote[]> {
    const response = await fetchApi(`${this.basePath}practice/${practiceScheduleId}`);
    return await response.json();
  }

  async createNote(data: PracticeNoteCreate): Promise<PracticeNote> {
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  async updateNote(id: string, data: PracticeNoteUpdate): Promise<PracticeNote> {
    const response = await fetchApi(`${this.basePath}${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  async deleteNote(id: string): Promise<void> {
    await fetchApi(`${this.basePath}${id}`, {
      method: 'DELETE',
    });
  }
}

export const practiceNotesService = new PracticeNotesService();
