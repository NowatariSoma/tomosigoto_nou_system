'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive } from 'lucide-react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { NewMaterialTypeSelector } from '@/features/materials/components/NewMaterialTypeSelector';
import { CreatePlaylistForm } from '@/features/materials/components/CreatePlaylistForm';
import { CreateSubPlaylistForm } from '@/features/materials/components/CreateSubPlaylistForm';
import { CreateVideoForm } from '@/features/materials/components/CreateVideoForm';

type FormType = 'playlist' | 'subPlaylist' | 'video' | null;

export default function NewMaterialPage() {
  const router = useRouter();
  const [formType, setFormType] = useState<FormType>(null);
  const [playlistData, setPlaylistData] = useState({
    title: '',
    year: '',
    stage: '',
    thumbnailUrl: '',
  });
  const [subPlaylistData, setSubPlaylistData] = useState({
    playlistId: '',
    title: '',
    recordedDate: '',
    phase: '',
    playlistUrl: '',
    thumbnailUrl: '',
  });
  const [videoData, setVideoData] = useState({
    subPlaylistId: '',
    title: '',
    videoUrl: '',
    recordedDate: '',
    thumbnailUrl: '',
  });

  const handlePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { materialsService } = await import('@/features/materials/services/materials-service');
      await materialsService.createPlaylist({
        title: playlistData.title,
        stage: playlistData.stage,
        year: parseInt(playlistData.year, 10),
        thumbnailUrl: playlistData.thumbnailUrl || undefined,
      });
      router.push('/materials');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('プレイリストの作成に失敗しました');
    }
  };

  const handleSubPlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { materialsService } = await import('@/features/materials/services/materials-service');
      const result = await materialsService.createSubPlaylist(subPlaylistData.playlistId, {
        title: subPlaylistData.title,
        recordedDate: subPlaylistData.recordedDate,
        phase: subPlaylistData.phase,
        playlistUrl: subPlaylistData.playlistUrl,
        thumbnailUrl: subPlaylistData.thumbnailUrl || undefined,
      });
      
      // インポート結果を確認（型安全でないため、anyでアクセス）
      const importResult = (result as any).import_result;
      const importWarnings = (result as any).import_warnings;
      
      if (importResult || importWarnings) {
        const resultData = importResult || {
          imported_count: 0,
          skipped_count: 0,
          total_count: 0,
          warnings: importWarnings || []
        };
        
        if (resultData.warnings && resultData.warnings.length > 0) {
          // エラーや警告がある場合
          const warningMsg = resultData.warnings.join('\n');
          alert(`サブプレイリストを作成しましたが、動画のインポートで問題が発生しました:\n\n${warningMsg}`);
        } else if (resultData.imported_count > 0) {
          // 成功した場合
          alert(`サブプレイリストを作成しました。${resultData.imported_count}件の動画をインポートしました。`);
        } else if (resultData.total_count === 0 && subPlaylistData.playlistUrl) {
          // 動画が見つからなかった場合
          alert('サブプレイリストを作成しましたが、動画が見つかりませんでした。URLを確認してください。');
        }
      } else if (subPlaylistData.playlistUrl) {
        // playlist_urlが指定されているが、import_resultが返されていない場合
        console.warn('playlist_url was provided but no import_result in response');
        alert('サブプレイリストを作成しました。動画のインポート状況は確認できませんでした。');
      }
      
      router.push('/materials');
    } catch (error) {
      console.error('Failed to create sub-playlist:', error);
      alert('サブプレイリストの作成に失敗しました');
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { materialsService } = await import('@/features/materials/services/materials-service');
      const subPlaylistId = videoData.subPlaylistId;
      
      // すべてのプレイリストからサブプレイリストを探してプレイリストIDを取得
      const playlists = await materialsService.getPlaylists();
      let playlistId = '';
      for (const playlist of playlists) {
        try {
          const subPlaylists = await materialsService.getSubPlaylists(playlist.id);
          const subPlaylist = subPlaylists.find(sp => sp.id === subPlaylistId);
          if (subPlaylist) {
            playlistId = playlist.id;
            break;
          }
        } catch (err) {
          // エラーを無視して続行
        }
      }
      
      if (!playlistId) {
        alert('サブプレイリストが見つかりませんでした');
        return;
      }
      
      await materialsService.createVideo(playlistId, subPlaylistId, {
        title: videoData.title,
        videoUrl: videoData.videoUrl,
        recordedDate: videoData.recordedDate,
        thumbnailUrl: videoData.thumbnailUrl || undefined,
      });
      router.push('/materials');
    } catch (error) {
      console.error('Failed to create video:', error);
      alert('動画の作成に失敗しました');
    }
  };

  const handleCancel = () => {
    if (formType) {
      // フォームタイプをリセットしてカード選択画面に戻る
      setFormType(null);
    } else {
      // カード選択画面からは材料一覧に戻る
      router.push('/materials');
    }
  };

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="新しい資料を追加"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      maxWidth="7xl"
    >
      <main className="container mx-auto px-4 py-8">
        {!formType ? (
          <NewMaterialTypeSelector onSelectType={setFormType} />
        ) : formType === 'playlist' ? (
          <CreatePlaylistForm
            playlistData={playlistData}
            setPlaylistData={setPlaylistData}
            onSubmit={handlePlaylistSubmit}
            onCancel={handleCancel}
          />
        ) : formType === 'subPlaylist' ? (
          <CreateSubPlaylistForm
            subPlaylistData={subPlaylistData}
            setSubPlaylistData={setSubPlaylistData}
            onSubmit={handleSubPlaylistSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <CreateVideoForm
            videoData={videoData}
            setVideoData={setVideoData}
            onSubmit={handleVideoSubmit}
            onCancel={handleCancel}
          />
        )}
      </main>
    </AppTemplate>
  );
}

