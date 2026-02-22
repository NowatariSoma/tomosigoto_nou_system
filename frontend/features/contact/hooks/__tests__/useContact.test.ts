import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContact } from '@/features/contact/hooks/useContact';
import { UI_TEXT } from '@/features/contact/constants';
import { CreateContactRequest } from '@/features/contact/types';

// contactServiceをモック
const mockCreateContact = vi.fn();

vi.mock('@/features/contact/services', () => ({
  contactService: {
    createContact: (...args: unknown[]) => mockCreateContact(...args),
  },
}));

const mockContactRequest: CreateContactRequest = {
  category: 'question',
  content: 'テスト問い合わせ内容',
};

const mockContactResponse = {
  id: 'contact-1',
  user_id: 'user-1',
  category: 'question' as const,
  content: 'テスト問い合わせ内容',
  status: 'pending' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => useContact());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.createContact).toBe('function');
  });

  it('createContactで問い合わせを正常に送信する', async () => {
    mockCreateContact.mockResolvedValue(mockContactResponse);

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await result.current.createContact(mockContactRequest);
    });

    expect(mockCreateContact).toHaveBeenCalledWith(mockContactRequest);
    expect(mockCreateContact).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createContact実行中にloadingがtrueになる', async () => {
    let resolvePromise: (value: unknown) => void;
    mockCreateContact.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useContact());

    let createPromise: Promise<void>;
    act(() => {
      createPromise = result.current.createContact(mockContactRequest);
    });

    // loading中の状態を確認
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Promiseを解決
    await act(async () => {
      resolvePromise!(mockContactResponse);
      await createPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('createContact失敗時にErrorインスタンスのメッセージをerrorに設定する', async () => {
    const errorMessage = '送信に失敗しました';
    mockCreateContact.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await expect(
        result.current.createContact(mockContactRequest)
      ).rejects.toThrow(errorMessage);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('createContact失敗時にError以外の例外の場合はUI_TEXT.ERROR_MESSAGEを設定する', async () => {
    mockCreateContact.mockRejectedValue('文字列エラー');

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await expect(
        result.current.createContact(mockContactRequest)
      ).rejects.toBe('文字列エラー');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(UI_TEXT.ERROR_MESSAGE);
  });

  it('createContact失敗後に再度成功するとerrorがクリアされる', async () => {
    // 1回目: 失敗
    mockCreateContact.mockRejectedValue(new Error('送信失敗'));

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await expect(
        result.current.createContact(mockContactRequest)
      ).rejects.toThrow('送信失敗');
    });

    expect(result.current.error).toBe('送信失敗');

    // 2回目: 成功
    mockCreateContact.mockResolvedValue(mockContactResponse);

    await act(async () => {
      await result.current.createContact(mockContactRequest);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('createContact呼び出し時に前回のエラーがクリアされる', async () => {
    // 1回目: 失敗してエラーを設定
    mockCreateContact.mockRejectedValue(new Error('エラー'));

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await expect(
        result.current.createContact(mockContactRequest)
      ).rejects.toThrow('エラー');
    });

    expect(result.current.error).toBe('エラー');

    // 2回目: 保留中のPromiseで呼び出し、エラーがクリアされることを確認
    let resolvePromise: (value: unknown) => void;
    mockCreateContact.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    let createPromise: Promise<void>;
    act(() => {
      createPromise = result.current.createContact(mockContactRequest);
    });

    // 呼び出し直後にエラーがクリアされている
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);

    // クリーンアップ
    await act(async () => {
      resolvePromise!(mockContactResponse);
      await createPromise!;
    });
  });

  it('createContactがエラー時に例外を再スローする', async () => {
    const error = new Error('ネットワークエラー');
    mockCreateContact.mockRejectedValue(error);

    const { result } = renderHook(() => useContact());

    await act(async () => {
      await expect(
        result.current.createContact(mockContactRequest)
      ).rejects.toThrow('ネットワークエラー');
    });
  });
});
