import { PlaylistVideo } from '../types/material_types';

// 各年度+舞台のプレイリスト情報（本番・稽古）
const playlistVideos: PlaylistVideo[] = [
  // 2025年EVE能のプレイリスト
  {
    id: '1',
    title: '2025年1月20日 - 本番',
    playlistId: 'eve-nou-2025-honban',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2025_honban',
    recorded_date: '2025-01-20'
  },
  {
    id: '2',
    title: '2025年1月10日 - 稽古',
    playlistId: 'eve-nou-2025-keiko',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2025_keiko',
    recorded_date: '2025-01-10'
  },
  
  // 2025年同観能のプレイリスト
  {
    id: '3',
    title: '2025年11月20日 - 本番',
    playlistId: 'dokan-nou-2025-honban',
    stage: '同観能',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=dokan2025_honban',
    recorded_date: '2025-02-20'
  },
  {
    id: '4',
    title: '2025年11月10日 - 稽古',
    playlistId: 'dokan-nou-2025-keiko',
    stage: '同観能',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=dokan2025_keiko',
    recorded_date: '2025-02-10'
  },
  
  // 2025年翡翠の会のプレイリスト
  {
    id: '5',
    title: '2025年3月15日 - 本番',
    playlistId: 'hisui-no-kai-2025-honban',
    stage: '翡翠の会',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=hisui2025_honban',
    recorded_date: '2025-03-20'
  },
  {
    id: '6',
    title: '2025年3月10日 - 稽古',
    playlistId: 'hisui-no-kai-2025-keiko',
    stage: '翡翠の会',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=hisui2025_keiko',
    recorded_date: '2025-03-10'
  },
  
  // 2024年EVE能のプレイリスト
  {
    id: '7',
    title: '2024年12月20日 - 本番',
    playlistId: 'eve-nou-2024-honban',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2024_honban',
    recorded_date: '2024-12-20'
  },
  {
    id: '8',
    title: '2024年12月10日 - 稽古',
    playlistId: 'eve-nou-2024-keiko',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2024_keiko',
    recorded_date: '2024-12-10'
  },
  
  // 2024年同観能のプレイリスト
  {
    id: '9',
    title: '2024年11月20日 - 本番',
    playlistId: 'dokan-nou-2024-honban',
    stage: '同観能',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=dokan2024_honban',
    recorded_date: '2024-11-20'
  },
  {
    id: '10',
    title: '2024年11月10日 - 稽古',
    playlistId: 'dokan-nou-2024-keiko',
    stage: '同観能',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=dokan2024_keiko',
    recorded_date: '2024-11-10'
  },
  
  // 2023年EVE能のプレイリスト
  {
    id: '11',
    title: '2023年12月20日 - 本番',
    playlistId: 'eve-nou-2023-honban',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '本番',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2023_honban',
    recorded_date: '2023-12-20'
  },
  {
    id: '12',
    title: '2023年12月10日 - 稽古',
    playlistId: 'eve-nou-2023-keiko',
    stage: 'EVE能',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    phase: '稽古',
    youtubeUrl: 'https://youtube.com/playlist?list=eve2023_keiko',
    recorded_date: '2023-12-10'
  }
];

export { playlistVideos };