import { useState, useMemo } from 'react';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, Video } from '../types/material_types';
import { mockData } from '../data/material_data';
import { playlistVideos } from '../data/playlist_data';
import { videos } from '../data/video_data';
import { useFavoriteVideos } from './useFavoriteVideos';

export const useMaterialListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite, getFavoriteCount } = useFavoriteVideos();

  // 年度・舞台のオプションを生成
  const years = Array.from(new Set(mockData.map((item: Playlist) => item.year))).sort(
    (a: number, b: number) => b - a
  );
  const stages = Array.from(new Set(mockData.map((item: Playlist) => item.stage))).sort();

  const yearOptions: FilterOption[] = [
    { value: 'all', label: 'すべての年度' },
    ...years.map((year: number) => ({ value: year.toString(), label: `${year}年` })),
  ];

  const stageOptions: FilterOption[] = [
    { value: 'all', label: 'すべての舞台' },
    ...stages.map((stage: string) => ({ value: stage, label: stage })),
  ];

  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' },
  ];

  const filterConfigs = [
    {
      id: 'year',
      placeholder: '年度を選択',
      options: yearOptions,
      value: selectedYear,
      onValueChange: setSelectedYear,
    },
    {
      id: 'stage',
      placeholder: '舞台を選択',
      options: stageOptions,
      value: selectedStage,
      onValueChange: setSelectedStage,
    },
    {
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase,
    },
  ];

  // 検索クエリが演目名を含むかチェック
  const isVideoSearch = useMemo(() => {
    return (
      searchQuery !== '' &&
      videos.some(video => video.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !mockData.some(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.stage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  // 動画検索の場合
  const filteredVideos = useMemo(() => {
    if (!isVideoSearch) return [];

    return videos.filter((video: Video) => {
      const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist) return false;

      const playlist = mockData.find(item => item.id === subPlaylist.playlistId);
      if (!playlist) return false;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        playlist.title.toLowerCase().includes(searchLower) ||
        playlist.stage.toLowerCase().includes(searchLower);
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || playlist.stage === selectedStage;
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);

      return matchesSearch && matchesYear && matchesStage && matchesPhase && matchesFavorite;
    });
  }, [searchQuery, isVideoSearch, selectedYear, selectedStage, selectedPhase, showFavoritesOnly, isFavorite]);

  // プレイリスト検索の場合
  const filteredData = useMemo(() => {
    return mockData.filter((item: Playlist) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchLower) ||
        (item.stage && item.stage.toLowerCase().includes(searchLower));
      const matchesYear = selectedYear === 'all' || item.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || (item.stage && item.stage === selectedStage);
      const matchesPhase = selectedPhase === 'all' || true; // プレイリスト検索ではフェーズフィルターは無視
      return matchesSearch && matchesYear && matchesStage && matchesPhase;
    });
  }, [searchQuery, selectedYear, selectedStage, selectedPhase]);

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedYear,
    selectedStage,
    selectedPhase,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filterConfigs,
    isVideoSearch,
    filteredVideos,
    filteredData,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    handleToggleFavorite,
  };
};

