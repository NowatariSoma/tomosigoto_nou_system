import { useState } from 'react';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { mockData } from '../data/material_data';
import { playlistVideos } from '../data/playlist_data';
import { videos } from '../data/video_data';
import { useFavoriteVideos } from './useFavoriteVideos';

export const useSubPlaylistPage = (playlistId: string, videoId: string) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteVideos();

  // 年度+舞台データを取得
  const stageData = mockData.find((item: Playlist) => item.id === playlistId);

  // プレイリストデータを取得（videoIdは実際にはプレイリストID）
  const playlistData = playlistVideos.find((playlist: SubPlaylist) => playlist.id === videoId);

  // そのプレイリストの動画一覧を取得
  const playlistVideosList = videos.filter((video: Video) => video.subPlaylistId === videoId);

  // 検索・フィルタリング
  const filteredVideos = playlistVideosList.filter((video: Video) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || video.title.toLowerCase().includes(searchLower);
    const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);
    return matchesSearch && matchesFavorite;
  });

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  return {
    stageData,
    playlistData,
    playlistVideosList,
    filteredVideos,
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isFavorite,
    toggleFavorite,
    handleToggleFavorite,
  };
};

