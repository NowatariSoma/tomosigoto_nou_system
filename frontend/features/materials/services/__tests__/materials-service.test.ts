import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialsService } from '@/features/materials/services/materials-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('MaterialsService', () => {
  let service: MaterialsService;

  beforeEach(() => {
    service = new MaterialsService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getPlaylists', () => {
    it('プレイリスト一覧を取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'pl-1',
          title: '公演A',
          name: '能舞台',
          year: 2024,
          thumbnail_url: 'https://example.com/thumb.jpg',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]));

      const result = await service.getPlaylists();
      expect(result).toHaveLength(1);
      expect(result[0].stage).toBe('能舞台');
      expect(result[0].title).toBe('公演A');
      expect(result[0].thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('getPlaylist', () => {
    it('単一のプレイリストを取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        id: 'pl-1',
        title: '公演A',
        name: '能舞台',
        year: 2024,
        thumbnail_url: null,
        created_at: null,
        updated_at: null,
      }));

      const result = await service.getPlaylist('pl-1');
      expect(result.id).toBe('pl-1');
      expect(result.stage).toBe('能舞台');
      expect(result.thumbnailUrl).toBe('');
      expect(mockFetchApi).toHaveBeenCalledWith('/materials-youtube/pl-1');
    });
  });

  describe('createPlaylist', () => {
    it('プレイリストを作成しマッピングされた結果を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        id: 'new-pl',
        title: '新公演',
        name: '新舞台',
        year: 2024,
        thumbnail_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      const result = await service.createPlaylist({
        title: '新公演',
        stage: '新舞台',
        year: 2024,
      });
      expect(result.id).toBe('new-pl');
      expect(result.stage).toBe('新舞台');
      // POSTメソッドとbodyが正しく渡されることを確認
      expect(mockFetchApi).toHaveBeenCalledWith('/materials-youtube', {
        method: 'POST',
        body: expect.stringContaining('"name":"新舞台"'),
      });
    });
  });

  describe('deletePlaylist', () => {
    it('プレイリストを削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deletePlaylist('pl-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/materials-youtube/pl-1', {
        method: 'DELETE',
      });
    });
  });

  describe('getSubPlaylists', () => {
    it('サブプレイリスト一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'sub-1',
          playlist_id: 'pl-1',
          title: 'サブ1',
          recorded_date: '2024-03-15',
          phase: '本稽古',
          playlist_url: 'https://youtube.com/playlist',
          thumbnail_url: null,
          created_at: null,
          updated_at: null,
        },
      ]));

      const result = await service.getSubPlaylists('pl-1');
      expect(result).toHaveLength(1);
      expect(result[0].playlistId).toBe('pl-1');
      expect(result[0].phase).toBe('本稽古');
    });
  });

  describe('getVideos', () => {
    it('動画一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'vid-1',
          sub_playlist_id: 'sub-1',
          title: '動画1',
          video_url: 'https://youtube.com/watch?v=xxx',
          recorded_date: '2024-03-15',
          thumbnail_url: null,
          created_at: null,
          updated_at: null,
        },
      ]));

      const result = await service.getVideos('pl-1', 'sub-1');
      expect(result).toHaveLength(1);
      expect(result[0].subPlaylistId).toBe('sub-1');
    });
  });

  describe('toggleFavorite', () => {
    it('お気に入りを切り替える', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        is_favorited: true,
        message: 'Favorited',
      }));

      const result = await service.toggleFavorite('vid-1');
      expect(result.is_favorited).toBe(true);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/materials-youtube/videos/vid-1/favorites/toggle',
        { method: 'POST' }
      );
    });
  });

  describe('getFavorites', () => {
    it('お気に入り一覧を取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'fav-1',
          user_id: 'user-1',
          video_id: 'vid-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]));

      const result = await service.getFavorites();
      expect(result).toHaveLength(1);
      expect(result[0].videoId).toBe('vid-1');
      expect(result[0].userId).toBe('user-1');
    });
  });

  describe('getFavoriteVideosWithDetails', () => {
    it('お気に入り動画の詳細を取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'fav-1',
          user_id: 'user-1',
          video_id: 'vid-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          video: {
            id: 'vid-1',
            sub_playlist_id: 'sub-1',
            title: '動画1',
            video_url: 'https://youtube.com',
            recorded_date: null,
            thumbnail_url: null,
            created_at: null,
            updated_at: null,
          },
          sub_playlist: {
            id: 'sub-1',
            playlist_id: 'pl-1',
            title: 'サブ1',
            recorded_date: '2024-03-15',
            phase: '本稽古',
            playlist_url: 'https://youtube.com',
            thumbnail_url: null,
            created_at: null,
            updated_at: null,
          },
          playlist: {
            id: 'pl-1',
            title: '公演A',
            name: '能舞台',
            year: 2024,
            thumbnail_url: null,
            created_at: null,
            updated_at: null,
          },
        },
      ]));

      const result = await service.getFavoriteVideosWithDetails();
      expect(result).toHaveLength(1);
      expect(result[0].video.title).toBe('動画1');
      expect(result[0].playlist.stage).toBe('能舞台');
    });
  });
});
