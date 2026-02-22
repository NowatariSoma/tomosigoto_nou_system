import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMaterialListPage } from '@/features/materials/hooks/useMaterialListPage';

// materialsServiceをモック
const mockGetPlaylists = vi.fn();
const mockGetSubPlaylists = vi.fn();
const mockGetVideos = vi.fn();
const mockGetFavorites = vi.fn();
const mockToggleFavorite = vi.fn();

vi.mock('@/features/materials/services/materials-service', () => ({
  materialsService: {
    getPlaylists: (...args: unknown[]) => mockGetPlaylists(...args),
    getSubPlaylists: (...args: unknown[]) => mockGetSubPlaylists(...args),
    getVideos: (...args: unknown[]) => mockGetVideos(...args),
    getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
    toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
  },
}));

const mockPlaylists = [
  { id: 'pl-1', title: '公演A', stage: '能舞台A', year: 2024, thumbnailUrl: '', createdAt: '', updatedAt: '' },
  { id: 'pl-2', title: '公演B', stage: '能舞台B', year: 2023, thumbnailUrl: '', createdAt: '', updatedAt: '' },
];

const mockSubPlaylists = [
  { id: 'sub-1', playlistId: 'pl-1', title: 'サブ1', recordedDate: '2024-03-15', phase: '本稽古', playlistUrl: '', thumbnailUrl: '', createdAt: '', updatedAt: '' },
];

const mockVideos = [
  { id: 'vid-1', subPlaylistId: 'sub-1', title: '動画1', videoUrl: '', thumbnailUrl: '', createdAt: '', updatedAt: '' },
];

describe('useMaterialListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlaylists.mockResolvedValue(mockPlaylists);
    mockGetSubPlaylists.mockResolvedValue(mockSubPlaylists);
    mockGetVideos.mockResolvedValue(mockVideos);
    mockGetFavorites.mockResolvedValue([]);
    mockToggleFavorite.mockResolvedValue({ is_favorited: true });
  });

  it('初期状態ではisLoadingがtrueになる', () => {
    const { result } = renderHook(() => useMaterialListPage());
    expect(result.current.isLoading).toBe(true);
  });

  it('データ読み込み後にプレイリストが設定される', async () => {
    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.playlists).toHaveLength(2);
  });

  it('データ読み込み失敗時にエラーが設定される', async () => {
    mockGetPlaylists.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
  });

  it('検索クエリでプレイリストをフィルタリングできる', async () => {
    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('公演A');
    });

    expect(result.current.filteredPlaylists).toHaveLength(1);
    expect(result.current.filteredPlaylists[0].title).toBe('公演A');
  });

  it('フィルタリングされたプレイリストは年度降順でソートされる', async () => {
    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredPlaylists[0].year).toBe(2024);
    expect(result.current.filteredPlaylists[1].year).toBe(2023);
  });

  it('検索クエリが空の場合は動画を表示しない', async () => {
    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredVideos).toHaveLength(0);
  });

  it('filterConfigsが適切に生成される', async () => {
    const { result } = renderHook(() => useMaterialListPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filterConfigs).toHaveLength(3);
    expect(result.current.filterConfigs[0].id).toBe('year');
    expect(result.current.filterConfigs[1].id).toBe('stage');
    expect(result.current.filterConfigs[2].id).toBe('phase');
  });
});
