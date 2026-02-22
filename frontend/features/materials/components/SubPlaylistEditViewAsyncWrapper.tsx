'use client';

import { useState, useEffect } from 'react';
import { Playlist, SubPlaylist, Video } from '../types/material_types';
import { materialsService } from '../services/materials-service';
import { SubPlaylistEditView } from './SubPlaylistEditView';

interface SubPlaylistEditViewAsyncWrapperProps {
  subPlaylist: SubPlaylist;
  playlist: Playlist;
  onBack: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onVideoDelete: (id: string) => void;
  formatDate: (dateString?: string) => string;
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onSubPlaylistUpdate?: (id: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onVideoAdd?: (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => Promise<void>;
}

export function SubPlaylistEditViewAsyncWrapper({
  subPlaylist,
  playlist,
  onBack,
  onDelete,
  onMove,
  onVideoDelete,
  formatDate,
  onSubPlaylistCreate,
  onSubPlaylistUpdate,
  onVideoAdd,
}: SubPlaylistEditViewAsyncWrapperProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getVideos(playlist.id, subPlaylist.id);
        setVideos(data);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, [playlist.id, subPlaylist.id]);

  const handleVideoAdd = async (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => {
    try {
      await materialsService.createVideo(playlistId, subPlaylistId, {
        title: data.title,
        videoUrl: data.videoUrl,
        recordedDate: data.recordedDate,
        thumbnailUrl: data.thumbnailUrl,
      });
      alert('動画を追加しました');
      const updatedVideos = await materialsService.getVideos(playlistId, subPlaylistId);
      setVideos(updatedVideos);
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('動画の追加に失敗しました');
      throw error;
    }
  };

  const handleVideoDelete = async (videoId: string) => {
    try {
      await materialsService.deleteVideo(playlist.id, subPlaylist.id, videoId);
      alert('動画を削除しました');
      const updatedVideos = await materialsService.getVideos(playlist.id, subPlaylist.id);
      setVideos(updatedVideos);
    } catch (error) {
      console.error(`Failed to delete video ${videoId}:`, error);
      alert('動画の削除に失敗しました');
      throw error;
    }
  };

  const handleUpdateSubPlaylist = async (subPlaylistId: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    try {
      const updatedSubPlaylist = await materialsService.updateSubPlaylist(playlist.id, subPlaylistId, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });

      const importResult = (updatedSubPlaylist as any).import_result;
      const importWarnings = (updatedSubPlaylist as any).import_warnings;

      if (importResult || importWarnings) {
        const resultData = importResult || {
          imported_count: 0,
          skipped_count: 0,
          total_count: 0,
          warnings: importWarnings || []
        };

        if (resultData.warnings && resultData.warnings.length > 0) {
          const warningMsg = resultData.warnings.join('\n');
          alert(`サブプレイリストを更新しましたが、動画のインポートで問題が発生しました:\n\n${warningMsg}`);
        } else if (resultData.imported_count > 0) {
          alert(`サブプレイリストを更新しました。${resultData.imported_count}件の動画をインポートしました。`);
        } else if (resultData.total_count === 0 && data.playlistUrl) {
          alert('サブプレイリストを更新しましたが、動画が見つかりませんでした。URLを確認してください。');
        } else {
          alert('サブプレイリストを更新しました');
        }
      } else {
        alert('サブプレイリストを更新しました');
      }

      if (onSubPlaylistUpdate) {
        await onSubPlaylistUpdate(subPlaylistId, data);
      }
    } catch (error) {
      console.error(`Failed to update sub-playlist ${subPlaylistId}:`, error);
      alert('サブプレイリストの更新に失敗しました');
      throw error;
    }
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <SubPlaylistEditView
      subPlaylist={subPlaylist}
      playlist={playlist}
      videos={videos}
      onBack={onBack}
      onDelete={onDelete}
      onMove={onMove}
      onVideoDelete={handleVideoDelete}
      formatDate={formatDate}
      onSubPlaylistCreate={onSubPlaylistCreate}
      onSubPlaylistUpdate={handleUpdateSubPlaylist}
      onVideoAdd={handleVideoAdd}
    />
  );
}
