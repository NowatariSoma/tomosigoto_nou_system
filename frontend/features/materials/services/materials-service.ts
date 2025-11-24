import { fetchApi, buildApiUrl } from '../../../lib/api';
import { API_ENDPOINTS } from '../constants';
import {
  Playlist,
  SubPlaylist,
  Video,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  CreateSubPlaylistRequest,
  UpdateSubPlaylistRequest,
  CreateVideoRequest,
  UpdateVideoRequest,
} from '../types/material_types';
import {
  mapApiPlaylistToPlaylist,
  mapApiSubPlaylistToSubPlaylist,
  mapApiVideoToVideo,
  mapPlaylistToApiRequest,
  mapSubPlaylistToApiRequest,
  mapVideoToApiRequest,
} from '../mappers';

export class MaterialsService {
  private readonly basePath = API_ENDPOINTS.MATERIALS_YOUTUBE;

  // プレイリスト関連
  async getPlaylists(): Promise<Playlist[]> {
    const response = await fetchApi(buildApiUrl(this.basePath));
    const apiPlaylists = await response.json();
    return apiPlaylists.map(mapApiPlaylistToPlaylist);
  }

  async getPlaylist(playlistId: string): Promise<Playlist> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}`));
    const apiPlaylist = await response.json();
    return mapApiPlaylistToPlaylist(apiPlaylist);
  }

  async createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
    const apiData = mapPlaylistToApiRequest(data);
    const response = await fetchApi(buildApiUrl(this.basePath), {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
    const apiPlaylist = await response.json();
    return mapApiPlaylistToPlaylist(apiPlaylist);
  }

  async updatePlaylist(playlistId: string, data: UpdatePlaylistRequest): Promise<Playlist> {
    const apiData = mapPlaylistToApiRequest(data);
    const response = await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}`), {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
    const apiPlaylist = await response.json();
    return mapApiPlaylistToPlaylist(apiPlaylist);
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}`), {
      method: 'DELETE',
    });
  }

  // サブプレイリスト関連
  async getSubPlaylists(playlistId: string): Promise<SubPlaylist[]> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists`));
    const apiSubPlaylists = await response.json();
    return apiSubPlaylists.map(mapApiSubPlaylistToSubPlaylist);
  }

  async getSubPlaylist(playlistId: string, subPlaylistId: string): Promise<SubPlaylist> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}`));
    const apiSubPlaylist = await response.json();
    return mapApiSubPlaylistToSubPlaylist(apiSubPlaylist);
  }

  async createSubPlaylist(playlistId: string, data: CreateSubPlaylistRequest): Promise<SubPlaylist> {
    const apiData = mapSubPlaylistToApiRequest(data);
    const response = await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists`), {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
    const apiSubPlaylist = await response.json();
    return mapApiSubPlaylistToSubPlaylist(apiSubPlaylist);
  }

  async updateSubPlaylist(
    playlistId: string,
    subPlaylistId: string,
    data: UpdateSubPlaylistRequest
  ): Promise<SubPlaylist> {
    const apiData = mapSubPlaylistToApiRequest(data);
    const response = await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}`),
      {
        method: 'PUT',
        body: JSON.stringify(apiData),
      }
    );
    const apiSubPlaylist = await response.json();
    return mapApiSubPlaylistToSubPlaylist(apiSubPlaylist);
  }

  async deleteSubPlaylist(playlistId: string, subPlaylistId: string): Promise<void> {
    await fetchApi(buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}`), {
      method: 'DELETE',
    });
  }

  // 動画関連
  async getVideos(playlistId: string, subPlaylistId: string): Promise<Video[]> {
    const response = await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}/videos`)
    );
    const apiVideos = await response.json();
    return apiVideos.map(mapApiVideoToVideo);
  }

  async getVideo(playlistId: string, subPlaylistId: string, videoId: string): Promise<Video> {
    const response = await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}/videos/${videoId}`)
    );
    const apiVideo = await response.json();
    return mapApiVideoToVideo(apiVideo);
  }

  async createVideo(playlistId: string, subPlaylistId: string, data: CreateVideoRequest): Promise<Video> {
    const apiData = mapVideoToApiRequest(data);
    const response = await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}/videos`),
      {
        method: 'POST',
        body: JSON.stringify(apiData),
      }
    );
    const apiVideo = await response.json();
    return mapApiVideoToVideo(apiVideo);
  }

  async updateVideo(
    playlistId: string,
    subPlaylistId: string,
    videoId: string,
    data: UpdateVideoRequest
  ): Promise<Video> {
    const apiData = mapVideoToApiRequest(data);
    const response = await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}/videos/${videoId}`),
      {
        method: 'PUT',
        body: JSON.stringify(apiData),
      }
    );
    const apiVideo = await response.json();
    return mapApiVideoToVideo(apiVideo);
  }

  async deleteVideo(playlistId: string, subPlaylistId: string, videoId: string): Promise<void> {
    await fetchApi(
      buildApiUrl(`${this.basePath}/${playlistId}/sub-playlists/${subPlaylistId}/videos/${videoId}`),
      {
        method: 'DELETE',
      }
    );
  }

  // お気に入り関連
  async getFavorites(): Promise<Array<{ id: string; user_id: string; video_id: string; created_at?: string; updated_at?: string }>> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/favorites`));
    return await response.json();
  }

  async getFavoriteStatus(videoId: string): Promise<{ is_favorited: boolean; video_id: string; user_id: string }> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/videos/${videoId}/favorites/status`));
    return await response.json();
  }

  async createFavorite(videoId: string): Promise<{ id: string; user_id: string; video_id: string; created_at?: string; updated_at?: string }> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/videos/${videoId}/favorites`), {
      method: 'POST',
    });
    return await response.json();
  }

  async deleteFavorite(videoId: string): Promise<void> {
    await fetchApi(buildApiUrl(`${this.basePath}/videos/${videoId}/favorites`), {
      method: 'DELETE',
    });
  }

  async toggleFavorite(videoId: string): Promise<{ is_favorited: boolean; message: string; favorite?: any }> {
    const response = await fetchApi(buildApiUrl(`${this.basePath}/videos/${videoId}/favorites/toggle`), {
      method: 'POST',
    });
    return await response.json();
  }
}

export const materialsService = new MaterialsService();

