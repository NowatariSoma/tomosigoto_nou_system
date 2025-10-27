import { useState } from 'react';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { mockData } from '../data/material_data';
import { playlistVideos } from '../data/playlist_data';
import { videos } from '../data/video_data';
import { useFavoriteVideos } from './useFavoriteVideos';

export const usePlaylistDetailPage = (playlistId: string) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteVideos();

  // 年度+舞台データを取得
  const stageData = mockData.find((item: Playlist) => item.id === playlistId);

  // その年度+舞台のプレイリスト一覧を取得
  const stagePlaylists = playlistVideos.filter((playlist: SubPlaylist) =>
    playlist.playlistId === stageData?.id
  );

  // フェーズオプションの定義
  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' },
  ];

  // 検索クエリが演目名を含むかチェック
  const isVideoSearch =
    searchQuery !== '' &&
    videos.some(video => video.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !stagePlaylists.some(
      playlist =>
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.phase.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // 動画検索の場合
  let filteredVideos: Video[] = [];
  if (isVideoSearch) {
    filteredVideos = videos.filter((video: Video) => {
      const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist || subPlaylist.playlistId !== playlistId) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        stageData?.title.toLowerCase().includes(searchLower) ||
        stageData?.stage.toLowerCase().includes(searchLower);
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);

      return matchesSearch && matchesPhase && matchesFavorite;
    });
  }

  // プレイリスト検索の場合
  const filteredPlaylists = stagePlaylists.filter((playlist: SubPlaylist) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      playlist.title.toLowerCase().includes(searchLower) ||
      playlist.phase.toLowerCase().includes(searchLower);
    const matchesPhase = selectedPhase === 'all' || playlist.phase === selectedPhase;

    return matchesSearch && matchesPhase;
  });

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  // フィルター設定
  const filterConfigs = [
    {
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase,
    },
  ];

  return {
    stageData,
    stagePlaylists,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isVideoSearch,
    filteredVideos,
    filteredPlaylists,
    isFavorite,
    toggleFavorite,
    handleToggleFavorite,
    filterConfigs,
  };
};

