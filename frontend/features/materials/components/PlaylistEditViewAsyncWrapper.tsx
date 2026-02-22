'use client';

import { useState, useEffect } from 'react';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { materialsService } from '../services/materials-service';
import { PlaylistEditView } from './PlaylistEditView';

interface PlaylistEditViewAsyncWrapperProps {
  playlist: Playlist;
  onBack: () => void;
  onSavePlaylist: (data: { title: string; year: number; stage: string }) => void;
  onDeletePlaylist: (id: string) => void;
  onDeleteSubPlaylist: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onMoveSubPlaylist: (id: string) => void;
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onVideoAdd?: (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => Promise<void>;
  formatDate: (dateString?: string) => string;
  onSubPlaylistClick?: (subPlaylist: SubPlaylist) => void;
}

export function PlaylistEditViewAsyncWrapper({
  playlist,
  onBack,
  onSavePlaylist,
  onDeletePlaylist,
  onDeleteSubPlaylist,
  onDeleteVideo,
  onMoveSubPlaylist,
  onSubPlaylistCreate,
  onVideoAdd,
  formatDate,
  onSubPlaylistClick,
}: PlaylistEditViewAsyncWrapperProps) {
  const [subPlaylists, setSubPlaylists] = useState<SubPlaylist[]>([]);
  const [videosBySubPlaylist, setVideosBySubPlaylist] = useState<Record<string, Video[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getSubPlaylists(playlist.id);
        setSubPlaylists(data);

        // 各サブプレイリストの動画を取得
        const videosMap: Record<string, Video[]> = {};
        for (const subPlaylist of data) {
          try {
            const videos = await materialsService.getVideos(playlist.id, subPlaylist.id);
            videosMap[subPlaylist.id] = videos;
          } catch (err) {
            console.error(`Failed to load videos for sub-playlist ${subPlaylist.id}:`, err);
            videosMap[subPlaylist.id] = [];
          }
        }
        setVideosBySubPlaylist(videosMap);
      } catch (error) {
        console.error('Failed to load sub-playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [playlist.id]);

  const getVideosForSubPlaylist = (subPlaylistId: string): Video[] => {
    return videosBySubPlaylist[subPlaylistId] || [];
  };

  const handleSavePlaylist = async (data: { title: string; year: number; stage: string }) => {
    try {
      await materialsService.updatePlaylist(playlist.id, {
        title: data.title,
        year: data.year,
        stage: data.stage,
      });
      onSavePlaylist(data);
    } catch (error) {
      console.error('Failed to save playlist:', error);
      alert('プレイリストの保存に失敗しました');
      throw error;
    }
  };

  const handleCreateSubPlaylist = async (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    try {
      const newSubPlaylist = await materialsService.createSubPlaylist(playlist.id, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });
      alert('サブプレイリストを作成しました');
      const updatedSubPlaylists = await materialsService.getSubPlaylists(playlist.id);
      setSubPlaylists(updatedSubPlaylists);
      try {
        const videos = await materialsService.getVideos(playlist.id, newSubPlaylist.id);
        setVideosBySubPlaylist(prev => ({ ...prev, [newSubPlaylist.id]: videos }));
      } catch (err) {
        console.error(`Failed to load videos for new sub-playlist ${newSubPlaylist.id}:`, err);
        setVideosBySubPlaylist(prev => ({ ...prev, [newSubPlaylist.id]: [] }));
      }
    } catch (error) {
      console.error('Failed to create sub-playlist:', error);
      alert('サブプレイリストの作成に失敗しました');
      throw error;
    }
  };

  const handleUpdateSubPlaylist = (updatedSubPlaylist: SubPlaylist) => {
    setSubPlaylists(prev => prev.map(sp => sp.id === updatedSubPlaylist.id ? updatedSubPlaylist : sp));
  };

  const handleDeleteSubPlaylist = async (subPlaylistId: string) => {
    try {
      await materialsService.deleteSubPlaylist(playlist.id, subPlaylistId);
      alert('サブプレイリストを削除しました');
      const updatedSubPlaylists = await materialsService.getSubPlaylists(playlist.id);
      setSubPlaylists(updatedSubPlaylists);
      setVideosBySubPlaylist(prev => {
        const updated = { ...prev };
        delete updated[subPlaylistId];
        return updated;
      });
    } catch (error) {
      console.error(`Failed to delete sub-playlist ${subPlaylistId}:`, error);
      alert('サブプレイリストの削除に失敗しました');
      throw error;
    }
  };

  const handleVideoAdd = async (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => {
    try {
      await materialsService.createVideo(playlistId, subPlaylistId, {
        title: data.title,
        videoUrl: data.videoUrl,
        recordedDate: data.recordedDate,
        thumbnailUrl: data.thumbnailUrl,
      });
      alert('動画を追加しました');
      const videos = await materialsService.getVideos(playlistId, subPlaylistId);
      setVideosBySubPlaylist(prev => ({ ...prev, [subPlaylistId]: videos }));
    } catch (error) {
      console.error(`Failed to add video to sub-playlist ${subPlaylistId}:`, error);
      alert('動画の追加に失敗しました');
      throw error;
    }
  };

  const handleVideoDelete = async (videoId: string) => {
    try {
      let targetSubPlaylistId: string | null = null;
      for (const subPlaylist of subPlaylists) {
        const videos = videosBySubPlaylist[subPlaylist.id] || [];
        if (videos.some(v => v.id === videoId)) {
          targetSubPlaylistId = subPlaylist.id;
          break;
        }
      }

      if (!targetSubPlaylistId) {
        await onDeleteVideo(videoId);
        const videosMap: Record<string, Video[]> = {};
        for (const subPlaylist of subPlaylists) {
          try {
            const videos = await materialsService.getVideos(playlist.id, subPlaylist.id);
            videosMap[subPlaylist.id] = videos;
          } catch (err) {
            console.error(`Failed to reload videos for sub-playlist ${subPlaylist.id}:`, err);
            videosMap[subPlaylist.id] = videosBySubPlaylist[subPlaylist.id] || [];
          }
        }
        setVideosBySubPlaylist(videosMap);
        return;
      }

      const subPlaylistIdToUpdate = targetSubPlaylistId;
      await materialsService.deleteVideo(playlist.id, subPlaylistIdToUpdate, videoId);
      alert('動画を削除しました');
      const updatedVideos = await materialsService.getVideos(playlist.id, subPlaylistIdToUpdate);
      setVideosBySubPlaylist(prev => ({ ...prev, [subPlaylistIdToUpdate]: updatedVideos }));
    } catch (error) {
      console.error(`Failed to delete video ${videoId}:`, error);
      alert('動画の削除に失敗しました');
      throw error;
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <PlaylistEditView
      playlist={playlist}
      subPlaylists={subPlaylists}
      getVideosForSubPlaylist={getVideosForSubPlaylist}
      onBack={onBack}
      onSavePlaylist={handleSavePlaylist}
      onDeletePlaylist={onDeletePlaylist}
      onDeleteSubPlaylist={handleDeleteSubPlaylist}
      onDeleteVideo={handleVideoDelete}
      onMoveSubPlaylist={onMoveSubPlaylist}
      onSubPlaylistCreate={handleCreateSubPlaylist}
      onVideoAdd={handleVideoAdd}
      formatDate={formatDate}
      onSubPlaylistClick={onSubPlaylistClick}
      onSubPlaylistUpdate={handleUpdateSubPlaylist}
    />
  );
}
