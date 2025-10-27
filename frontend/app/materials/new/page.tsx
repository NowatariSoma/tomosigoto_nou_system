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

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating playlist:', playlistData);
    router.push('/materials');
  };

  const handleSubPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating sub-playlist:', subPlaylistData);
    router.push('/materials');
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating video:', videoData);
    router.push('/materials');
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

