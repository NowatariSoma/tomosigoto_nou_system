import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFavoriteVideos } from '@/features/materials/hooks/useFavoriteVideos';

// materialsServiceをモック
const mockGetFavorites = vi.fn();
const mockToggleFavorite = vi.fn();

vi.mock('@/features/materials/services/materials-service', () => ({
  materialsService: {
    getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
    toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
  },
}));

describe('useFavoriteVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFavorites.mockResolvedValue([]);
  });

  it('初期状態ではロード中になる', () => {
    const { result } = renderHook(() => useFavoriteVideos());
    expect(result.current.isLoading).toBe(true);
  });

  it('初期化時にAPIからお気に入りを読み込む', async () => {
    mockGetFavorites.mockResolvedValue([
      { id: 'fav-1', userId: 'user-1', videoId: 'vid-1', createdAt: '', updatedAt: '' },
      { id: 'fav-2', userId: 'user-1', videoId: 'vid-2', createdAt: '', updatedAt: '' },
    ]);

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFavorite('vid-1')).toBe(true);
    expect(result.current.isFavorite('vid-2')).toBe(true);
    expect(result.current.isFavorite('vid-3')).toBe(false);
    expect(result.current.getFavoriteCount()).toBe(2);
  });

  it('API取得失敗時は空のセットを設定する', async () => {
    mockGetFavorites.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getFavoriteCount()).toBe(0);
  });

  it('toggleFavoriteでお気に入りを追加できる', async () => {
    mockGetFavorites.mockResolvedValue([]);
    mockToggleFavorite.mockResolvedValue({ is_favorited: true, message: 'Added' });

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('vid-1');
    });

    expect(result.current.isFavorite('vid-1')).toBe(true);
  });

  it('toggleFavoriteでお気に入りを解除できる', async () => {
    mockGetFavorites.mockResolvedValue([
      { id: 'fav-1', userId: 'user-1', videoId: 'vid-1', createdAt: '', updatedAt: '' },
    ]);
    mockToggleFavorite.mockResolvedValue({ is_favorited: false, message: 'Removed' });

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('vid-1');
    });

    expect(result.current.isFavorite('vid-1')).toBe(false);
  });

  it('toggleFavorite失敗時にエラーをスローする', async () => {
    mockGetFavorites.mockResolvedValue([]);
    mockToggleFavorite.mockRejectedValue(new Error('Toggle failed'));

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.toggleFavorite('vid-1');
      })
    ).rejects.toThrow('Toggle failed');
  });

  it('getAllFavoriteIdsでお気に入りIDの配列を取得できる', async () => {
    mockGetFavorites.mockResolvedValue([
      { id: 'fav-1', userId: 'user-1', videoId: 'vid-1', createdAt: '', updatedAt: '' },
      { id: 'fav-2', userId: 'user-1', videoId: 'vid-2', createdAt: '', updatedAt: '' },
    ]);

    const { result } = renderHook(() => useFavoriteVideos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const ids = result.current.getAllFavoriteIds();
    expect(ids).toContain('vid-1');
    expect(ids).toContain('vid-2');
    expect(ids).toHaveLength(2);
  });
});
