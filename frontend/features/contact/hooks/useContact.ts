import { useState, useCallback } from 'react';
import { contactService } from '../services';
import { CreateContactRequest } from '../types';
import { UI_TEXT } from '../constants';

interface UseContactState {
  loading: boolean;
  error: string | null;
}

export const useContact = () => {
  const [state, setState] = useState<UseContactState>({
    loading: false,
    error: null,
  });

  const createContact = useCallback(async (data: CreateContactRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await contactService.createContact(data);
      setState({
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : UI_TEXT.ERROR_MESSAGE,
      });
      throw error;
    }
  }, []);

  return {
    ...state,
    createContact,
  };
};

