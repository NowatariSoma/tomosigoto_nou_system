import { useState, useEffect } from 'react';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { useFavoriteVideos } from './useFavoriteVideos';
import { materialsService } from '../services/materials-service';

export const useSubPlaylistPage = (playlistId: string, subPlaylistId: string) => {
  const [stageData, setStageData] = useState<Playlist | null>(null);
  const [playlistData, setPlaylistData] = useState<SubPlaylist | null>(null);
  const [playlistVideosList, setPlaylistVideosList] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteVideos();

  // データ取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // プレイリスト詳細を取得
        const playlist = await materialsService.getPlaylist(playlistId);
        setStageData(playlist);

        // サブプレイリスト詳細を取得
        const subPlaylist = await materialsService.getSubPlaylist(playlistId, subPlaylistId);
        setPlaylistData(subPlaylist);

        // 動画一覧を取得
        const videos = await materialsService.getVideos(playlistId, subPlaylistId);
        setPlaylistVideosList(videos);
      } catch (err) {
        console.error('Failed to load sub-playlist data:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (playlistId && subPlaylistId) {
      loadData();
    }
  }, [playlistId, subPlaylistId]);

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
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isFavorite,
    toggleFavorite,
    handleToggleFavorite,
  };
};

