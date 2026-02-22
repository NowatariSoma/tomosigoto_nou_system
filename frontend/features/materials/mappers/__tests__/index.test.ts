import { describe, it, expect } from 'vitest';
import {
  mapApiPlaylistToPlaylist,
  mapApiSubPlaylistToSubPlaylist,
  mapApiVideoToVideo,
  mapApiFavoriteToFavorite,
  mapApiFavoriteVideoDetailToFavoriteVideoDetail,
  mapPlaylistToApiRequest,
  mapUpdatePlaylistToApiRequest,
  mapSubPlaylistToApiRequest,
  mapUpdateSubPlaylistToApiRequest,
  mapVideoToApiRequest,
  mapUpdateVideoToApiRequest,
} from '@/features/materials/mappers';

describe('materials mappers', () => {
  describe('mapApiPlaylistToPlaylist', () => {
    it('APIレスポンスをPlaylist型に変換する', () => {
      const apiResponse = {
        id: 'playlist-1',
        title: 'テスト公演',
        name: '能舞台',
        year: 2024,
        thumbnail_url: 'https://example.com/thumb.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapApiPlaylistToPlaylist(apiResponse);

      expect(result).toEqual({
        id: 'playlist-1',
        title: 'テスト公演',
        stage: '能舞台',
        year: 2024,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
    });

    it('null値をフォールバックする', () => {
      const apiResponse = {
        id: 'playlist-1',
        title: 'テスト',
        name: '舞台',
        year: 2024,
        thumbnail_url: null,
        created_at: null,
        updated_at: null,
      };

      const result = mapApiPlaylistToPlaylist(apiResponse);

      expect(result.thumbnailUrl).toBe('');
      expect(result.createdAt).toBe('');
      expect(result.updatedAt).toBe('');
    });
  });

  describe('mapApiSubPlaylistToSubPlaylist', () => {
    it('APIレスポンスをSubPlaylist型に変換する', () => {
      const apiResponse = {
        id: 'sub-1',
        playlist_id: 'playlist-1',
        title: 'サブプレイリスト',
        recorded_date: '2024-03-15',
        phase: '本稽古',
        playlist_url: 'https://youtube.com/playlist?list=xxx',
        thumbnail_url: 'https://example.com/thumb.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapApiSubPlaylistToSubPlaylist(apiResponse);

      expect(result).toEqual({
        id: 'sub-1',
        playlistId: 'playlist-1',
        title: 'サブプレイリスト',
        recordedDate: '2024-03-15',
        phase: '本稽古',
        playlistUrl: 'https://youtube.com/playlist?list=xxx',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
    });

    it('null値をフォールバックする', () => {
      const apiResponse = {
        id: 'sub-1',
        playlist_id: 'playlist-1',
        title: 'サブ',
        recorded_date: '2024-03-15',
        phase: '本稽古',
        playlist_url: 'https://youtube.com/playlist',
        thumbnail_url: null,
        created_at: null,
        updated_at: null,
      };

      const result = mapApiSubPlaylistToSubPlaylist(apiResponse);

      expect(result.thumbnailUrl).toBe('');
      expect(result.createdAt).toBe('');
      expect(result.updatedAt).toBe('');
    });
  });

  describe('mapApiVideoToVideo', () => {
    it('APIレスポンスをVideo型に変換する', () => {
      const apiResponse = {
        id: 'video-1',
        sub_playlist_id: 'sub-1',
        title: '動画タイトル',
        video_url: 'https://youtube.com/watch?v=xxx',
        recorded_date: '2024-03-15',
        thumbnail_url: 'https://example.com/thumb.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapApiVideoToVideo(apiResponse);

      expect(result).toEqual({
        id: 'video-1',
        subPlaylistId: 'sub-1',
        title: '動画タイトル',
        videoUrl: 'https://youtube.com/watch?v=xxx',
        recordedDate: '2024-03-15',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
    });

    it('recorded_dateがnullの場合はundefinedを返す', () => {
      const apiResponse = {
        id: 'video-1',
        sub_playlist_id: 'sub-1',
        title: '動画',
        video_url: 'https://youtube.com/watch',
        recorded_date: null,
        thumbnail_url: null,
        created_at: null,
        updated_at: null,
      };

      const result = mapApiVideoToVideo(apiResponse);

      expect(result.recordedDate).toBeUndefined();
    });
  });

  describe('mapApiFavoriteToFavorite', () => {
    it('APIレスポンスをFavorite型に変換する', () => {
      const apiResponse = {
        id: 'fav-1',
        user_id: 'user-1',
        video_id: 'video-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapApiFavoriteToFavorite(apiResponse);

      expect(result).toEqual({
        id: 'fav-1',
        userId: 'user-1',
        videoId: 'video-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
    });
  });

  describe('mapApiFavoriteVideoDetailToFavoriteVideoDetail', () => {
    it('お気に入り動画詳細をフロントエンド型に変換する', () => {
      const apiResponse = {
        id: 'fav-1',
        user_id: 'user-1',
        video_id: 'video-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        video: {
          id: 'video-1',
          sub_playlist_id: 'sub-1',
          title: '動画タイトル',
          video_url: 'https://youtube.com/watch?v=xxx',
          recorded_date: '2024-03-15',
          thumbnail_url: 'https://example.com/thumb.jpg',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        sub_playlist: {
          id: 'sub-1',
          playlist_id: 'playlist-1',
          title: 'サブ',
          recorded_date: '2024-03-15',
          phase: '本稽古',
          playlist_url: 'https://youtube.com/playlist',
          thumbnail_url: null,
          created_at: null,
          updated_at: null,
        },
        playlist: {
          id: 'playlist-1',
          title: 'テスト公演',
          name: '能舞台',
          year: 2024,
          thumbnail_url: null,
          created_at: null,
          updated_at: null,
        },
      };

      const result = mapApiFavoriteVideoDetailToFavoriteVideoDetail(apiResponse);

      expect(result.id).toBe('fav-1');
      expect(result.video.title).toBe('動画タイトル');
      expect(result.subPlaylist.playlistId).toBe('playlist-1');
      expect(result.playlist.stage).toBe('能舞台');
    });
  });

  describe('mapPlaylistToApiRequest', () => {
    it('CreatePlaylistRequestをAPIリクエスト型に変換する', () => {
      const request = {
        title: 'テスト公演',
        stage: '能舞台',
        year: 2024,
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };

      const result = mapPlaylistToApiRequest(request);

      expect(result).toEqual({
        title: 'テスト公演',
        name: '能舞台',
        year: 2024,
        thumbnail_url: 'https://example.com/thumb.jpg',
      });
    });

    it('thumbnailUrlが空の場合はnullを設定する', () => {
      const request = {
        title: 'テスト',
        stage: '舞台',
        year: 2024,
        thumbnailUrl: '',
      };

      const result = mapPlaylistToApiRequest(request);

      expect(result.thumbnail_url).toBeNull();
    });
  });

  describe('mapUpdatePlaylistToApiRequest', () => {
    it('部分的な更新リクエストを変換する', () => {
      const request = { title: '新タイトル', stage: '新舞台' };
      const result = mapUpdatePlaylistToApiRequest(request);

      expect(result).toEqual({ title: '新タイトル', name: '新舞台' });
    });

    it('undefinedのフィールドは含めない', () => {
      const request = { title: '新タイトル' };
      const result = mapUpdatePlaylistToApiRequest(request);

      expect(result).toEqual({ title: '新タイトル' });
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('year');
    });
  });

  describe('mapSubPlaylistToApiRequest', () => {
    it('CreateSubPlaylistRequestをAPIリクエスト型に変換する', () => {
      const request = {
        title: 'サブプレイリスト',
        recordedDate: '2024-03-15',
        phase: '本稽古',
        playlistUrl: 'https://youtube.com/playlist',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };

      const result = mapSubPlaylistToApiRequest(request);

      expect(result).toEqual({
        title: 'サブプレイリスト',
        recorded_date: '2024-03-15',
        phase: '本稽古',
        playlist_url: 'https://youtube.com/playlist',
        thumbnail_url: 'https://example.com/thumb.jpg',
      });
    });
  });

  describe('mapUpdateSubPlaylistToApiRequest', () => {
    it('部分的な更新リクエストを変換する', () => {
      const request = { title: '新タイトル' };
      const result = mapUpdateSubPlaylistToApiRequest(request);

      expect(result).toEqual({ title: '新タイトル' });
      expect(result).not.toHaveProperty('recorded_date');
    });
  });

  describe('mapVideoToApiRequest', () => {
    it('CreateVideoRequestをAPIリクエスト型に変換する', () => {
      const request = {
        title: '動画タイトル',
        videoUrl: 'https://youtube.com/watch?v=xxx',
        recordedDate: '2024-03-15',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      };

      const result = mapVideoToApiRequest(request);

      expect(result).toEqual({
        title: '動画タイトル',
        video_url: 'https://youtube.com/watch?v=xxx',
        recorded_date: '2024-03-15',
        thumbnail_url: 'https://example.com/thumb.jpg',
      });
    });
  });

  describe('mapUpdateVideoToApiRequest', () => {
    it('部分的な更新リクエストを変換する', () => {
      const request = { title: '新タイトル' };
      const result = mapUpdateVideoToApiRequest(request);

      expect(result).toEqual({ title: '新タイトル' });
      expect(result).not.toHaveProperty('video_url');
    });
  });
});
