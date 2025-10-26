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