export type ContactCategory = 'bug' | 'feature' | 'question' | 'other';

export interface Contact {
  id: string;
  user_id: string;
  name?: string;
  category: ContactCategory;
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface CreateContactRequest {
  category: ContactCategory;
  content: string;
}

