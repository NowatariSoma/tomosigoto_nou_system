export interface VideoPlaylist {
    id: string;
    playlistId: string;
    year: number;
    title: string;
    stage: string;
    thumbnailUrl: string;
  }

export interface Video {
    id: string;
    title: string;
    url: string;
    playlistId: string;
    recorded_date: string;
    stage: string;
    phase: '稽古' | '本番';
    thumbnailUrl: string;
  }

export interface PlaylistVideo {
    id: string;
    title: string;
    playlistId: string;
    stage: string;
    thumbnailUrl: string;
    phase: '稽古' | '本番';
    youtubeUrl: string;
    recorded_date: string;
  }