import { Contact, CreateContactRequest } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class ContactService {
  private readonly basePath = API_ENDPOINTS.CONTACTS;

  async createContact(data: CreateContactRequest): Promise<Contact> {
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }
}

export const contactService = new ContactService();

