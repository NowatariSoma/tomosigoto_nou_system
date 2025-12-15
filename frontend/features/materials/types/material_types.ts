export interface Playlist {
  id: string;
  title: string;
  year: number;
  stage: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubPlaylist {
  id: string;
  playlistId: string;
  title: string;
  recordedDate: string;
  phase: string;
  playlistUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  subPlaylistId: string;
  title: string;
  videoUrl: string;
  recordedDate?: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 作成・更新用の型
export interface CreatePlaylistRequest {
  title: string;
  stage: string;
  year: number;
  thumbnailUrl?: string;
}

export interface UpdatePlaylistRequest {
  title?: string;
  stage?: string;
  year?: number;
  thumbnailUrl?: string;
}

export interface CreateSubPlaylistRequest {
  title: string;
  recordedDate: string;
  phase: string;
  playlistUrl: string;
  thumbnailUrl?: string;
}

export interface UpdateSubPlaylistRequest {
  title?: string;
  recordedDate?: string;
  phase?: string;
  playlistUrl?: string;
  thumbnailUrl?: string;
}

export interface CreateVideoRequest {
  title: string;
  videoUrl: string;
  recordedDate: string;
  thumbnailUrl?: string;
}

export interface UpdateVideoRequest {
  title?: string;
  videoUrl?: string;
  recordedDate?: string;
  thumbnailUrl?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  videoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteVideoDetail {
  id: string;
  userId: string;
  videoId: string;
  createdAt: string;
  updatedAt: string;
  video: Video;
  subPlaylist: SubPlaylist;
  playlist: Playlist;
}