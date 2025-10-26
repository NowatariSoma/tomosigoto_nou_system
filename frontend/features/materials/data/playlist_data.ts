import { SubPlaylist } from '../types/material_types';

// 各年度+舞台のプレイリスト情報（本番・稽古）
const playlistVideos: SubPlaylist[] = [
  // 2025年EVE能のプレイリスト
  {
    id: '1',
    playlistId: '1',
    title: '2025年1月20日 - 本番',
    recordedDate: '2025-01-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=eve2025_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-01-20T00:00:00Z',
    updatedAt: '2025-01-20T00:00:00Z',
  },
  {
    id: '2',
    playlistId: '1',
    title: '2025年1月10日 - 稽古',
    recordedDate: '2025-01-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=eve2025_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  
  // 2025年同観能のプレイリスト
  {
    id: '3',
    playlistId: '2',
    title: '2025年11月20日 - 本番',
    recordedDate: '2025-02-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=dokan2025_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-02-20T00:00:00Z',
    updatedAt: '2025-02-20T00:00:00Z',
  },
  {
    id: '4',
    playlistId: '2',
    title: '2025年11月10日 - 稽古',
    recordedDate: '2025-02-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=dokan2025_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-02-10T00:00:00Z',
  },
  
  // 2025年翡翠の会のプレイリスト
  {
    id: '5',
    playlistId: '3',
    title: '2025年3月15日 - 本番',
    recordedDate: '2025-03-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=hisui2025_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-03-20T00:00:00Z',
    updatedAt: '2025-03-20T00:00:00Z',
  },
  {
    id: '6',
    playlistId: '3',
    title: '2025年3月10日 - 稽古',
    recordedDate: '2025-03-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=hisui2025_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z',
  },
  
  // 2024年EVE能のプレイリスト
  {
    id: '7',
    playlistId: '4',
    title: '2024年12月20日 - 本番',
    recordedDate: '2024-12-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=eve2024_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024-12-20T00:00:00Z',
    updatedAt: '2024-12-20T00:00:00Z',
  },
  {
    id: '8',
    playlistId: '4',
    title: '2024年12月10日 - 稽古',
    recordedDate: '2024-12-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=eve2024_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024-12-10T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z',
  },
  
  // 2024年同観能のプレイリスト
  {
    id: '9',
    playlistId: '5',
    title: '2024年11月20日 - 本番',
    recordedDate: '2024-11-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=dokan2024_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024-11-20T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: '10',
    playlistId: '5',
    title: '2024年11月10日 - 稽古',
    recordedDate: '2024-11-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=dokan2024_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024-11-10T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
  },
  
  // 2023年EVE能のプレイリスト
  {
    id: '11',
    playlistId: '6',
    title: '2023年12月20日 - 本番',
    recordedDate: '2023-12-20',
    phase: '本番',
    playlistUrl: 'https://youtube.com/playlist?list=eve2023_honban',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2023-12-20T00:00:00Z',
    updatedAt: '2023-12-20T00:00:00Z',
  },
  {
    id: '12',
    playlistId: '6',
    title: '2023年12月10日 - 稽古',
    recordedDate: '2023-12-10',
    phase: '稽古',
    playlistUrl: 'https://youtube.com/playlist?list=eve2023_keiko',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2023-12-10T00:00:00Z',
    updatedAt: '2023-12-10T00:00:00Z',
  }
];

export { playlistVideos };