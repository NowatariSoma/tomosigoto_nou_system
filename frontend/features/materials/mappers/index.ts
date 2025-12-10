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

// バックエンドのAPIレスポンス型
interface PlaylistApiResponse {
  id: string;
  title: string;
  name: string; // バックエンドでは "name" (舞台名)
  year: number;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SubPlaylistApiResponse {
  id: string;
  playlist_id: string;
  title: string;
  recorded_date: string;
  phase: string;
  playlist_url: string;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VideoApiResponse {
  id: string;
  sub_playlist_id: string;
  title: string;
  video_url: string;
  recorded_date: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// バックエンドのAPIリクエスト型
interface PlaylistApiRequest {
  title: string;
  name: string; // バックエンドでは "name" (舞台名)
  year: number;
  thumbnail_url?: string | null;
}

interface SubPlaylistApiRequest {
  title: string;
  recorded_date: string;
  phase: string;
  playlist_url: string;
  thumbnail_url?: string | null;
}

interface VideoApiRequest {
  title: string;
  video_url: string;
  recorded_date: string;
  thumbnail_url?: string | null;
}

// APIレスポンス → フロントエンド型
export const mapApiPlaylistToPlaylist = (api: PlaylistApiResponse): Playlist => {
  return {
    id: api.id,
    title: api.title,
    stage: api.name, // name → stage に変換
    year: api.year,
    thumbnailUrl: api.thumbnail_url || '',
    createdAt: api.created_at || '',
    updatedAt: api.updated_at || '',
  };
};

export const mapApiSubPlaylistToSubPlaylist = (api: SubPlaylistApiResponse): SubPlaylist => {
  return {
    id: api.id,
    playlistId: api.playlist_id,
    title: api.title,
    recordedDate: api.recorded_date,
    phase: api.phase,
    playlistUrl: api.playlist_url,
    thumbnailUrl: api.thumbnail_url || '',
    createdAt: api.created_at || '',
    updatedAt: api.updated_at || '',
  };
};

export const mapApiVideoToVideo = (api: VideoApiResponse): Video => {
  return {
    id: api.id,
    subPlaylistId: api.sub_playlist_id,
    title: api.title,
    videoUrl: api.video_url,
    recordedDate: api.recorded_date || undefined,
    thumbnailUrl: api.thumbnail_url || '',
    createdAt: api.created_at || '',
    updatedAt: api.updated_at || '',
  };
};

// フロントエンド型 → APIリクエスト型
export const mapPlaylistToApiRequest = (playlist: CreatePlaylistRequest): PlaylistApiRequest => {
  return {
    title: playlist.title,
    name: playlist.stage, // stage → name に変換
    year: playlist.year,
    thumbnail_url: playlist.thumbnailUrl || null,
  };
};

export const mapUpdatePlaylistToApiRequest = (playlist: UpdatePlaylistRequest): Partial<PlaylistApiRequest> => {
  const result: Partial<PlaylistApiRequest> = {};
  if (playlist.title !== undefined) result.title = playlist.title;
  if (playlist.stage !== undefined) result.name = playlist.stage;
  if (playlist.year !== undefined) result.year = playlist.year;
  if (playlist.thumbnailUrl !== undefined) result.thumbnail_url = playlist.thumbnailUrl || null;
  return result;
};

export const mapSubPlaylistToApiRequest = (
  subPlaylist: CreateSubPlaylistRequest
): SubPlaylistApiRequest => {
  return {
    title: subPlaylist.title,
    recorded_date: subPlaylist.recordedDate,
    phase: subPlaylist.phase,
    playlist_url: subPlaylist.playlistUrl,
    thumbnail_url: subPlaylist.thumbnailUrl || null,
  };
};

export const mapUpdateSubPlaylistToApiRequest = (
  subPlaylist: UpdateSubPlaylistRequest
): Partial<SubPlaylistApiRequest> => {
  const result: Partial<SubPlaylistApiRequest> = {};
  if (subPlaylist.title !== undefined) result.title = subPlaylist.title;
  if (subPlaylist.recordedDate !== undefined) result.recorded_date = subPlaylist.recordedDate;
  if (subPlaylist.phase !== undefined) result.phase = subPlaylist.phase;
  if (subPlaylist.playlistUrl !== undefined) result.playlist_url = subPlaylist.playlistUrl;
  if (subPlaylist.thumbnailUrl !== undefined) result.thumbnail_url = subPlaylist.thumbnailUrl || null;
  return result;
};

export const mapVideoToApiRequest = (video: CreateVideoRequest): VideoApiRequest => {
  return {
    title: video.title,
    video_url: video.videoUrl,
    recorded_date: video.recordedDate,
    thumbnail_url: video.thumbnailUrl || null,
  };
};

export const mapUpdateVideoToApiRequest = (video: UpdateVideoRequest): Partial<VideoApiRequest> => {
  const result: Partial<VideoApiRequest> = {};
  if (video.title !== undefined) result.title = video.title;
  if (video.videoUrl !== undefined) result.video_url = video.videoUrl;
  if (video.recordedDate !== undefined) result.recorded_date = video.recordedDate;
  if (video.thumbnailUrl !== undefined) result.thumbnail_url = video.thumbnailUrl || null;
  return result;
};

