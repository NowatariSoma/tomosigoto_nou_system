import { Video } from '../types/material_types';

// 各プレイリスト内の動画情報（能の演目）
const videos: Video[] = [
  // 2025年EVE能 - 本番プレイリスト内の動画
  {
    id: '1',
    title: '高砂',
    url: 'https://youtube.com/watch?v=eve2025_honban_takasago',
    playlistId: 'eve-nou-2025-honban',
    recorded_date: '2025-01-20',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=eve2025_honban_hagoromo',
    playlistId: 'eve-nou-2025-honban',
    recorded_date: '2025-01-22',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=eve2025_honban_dojoji',
    playlistId: 'eve-nou-2025-honban',
    recorded_date: '2025-01-24',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2025年EVE能 - 稽古プレイリスト内の動画
  {
    id: '4',
    title: '高砂',
    url: 'https://youtube.com/watch?v=eve2025_keiko_takasago',
    playlistId: 'eve-nou-2025-keiko',
    recorded_date: '2025-01-10',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '5',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=eve2025_keiko_hagoromo',
    playlistId: 'eve-nou-2025-keiko',
    recorded_date: '2025-01-12',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '6',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=eve2025_keiko_dojoji',
    playlistId: 'eve-nou-2025-keiko',
    recorded_date: '2025-01-14',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2025年同観能 - 本番プレイリスト内の動画
  {
    id: '7',
    title: '安宅',
    url: 'https://youtube.com/watch?v=dokan2025_honban_ataka',
    playlistId: 'dokan-nou-2025-honban',
    recorded_date: '2025-02-20',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '8',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=dokan2025_honban_funabenkei',
    playlistId: 'dokan-nou-2025-honban',
    recorded_date: '2025-02-22',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '9',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=dokan2025_honban_atsumori',
    playlistId: 'dokan-nou-2025-honban',
    recorded_date: '2025-02-24',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2025年同観能 - 稽古プレイリスト内の動画
  {
    id: '10',
    title: '安宅',
    url: 'https://youtube.com/watch?v=dokan2025_keiko_ataka',
    playlistId: 'dokan-nou-2025-keiko',
    recorded_date: '2025-02-10',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '11',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=dokan2025_keiko_funabenkei',
    playlistId: 'dokan-nou-2025-keiko',
    recorded_date: '2025-02-12',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '12',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=dokan2025_keiko_atsumori',
    playlistId: 'dokan-nou-2025-keiko',
    recorded_date: '2025-02-14',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2025年翡翠の会 - 本番プレイリスト内の動画
  {
    id: '13',
    title: '高砂',
    url: 'https://youtube.com/watch?v=hisui2025_honban_takasago',
    playlistId: 'hisui-no-kai-2025-honban',
    recorded_date: '2025-03-20',
    stage: '翡翠の会',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '14',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=hisui2025_honban_hagoromo',
    playlistId: 'hisui-no-kai-2025-honban',
    recorded_date: '2025-03-22',
    stage: '翡翠の会',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '15',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=hisui2025_honban_dojoji',
    playlistId: 'hisui-no-kai-2025-honban',
    recorded_date: '2025-03-24',
    stage: '翡翠の会',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2025年翡翠の会 - 稽古プレイリスト内の動画
  {
    id: '16',
    title: '高砂',
    url: 'https://youtube.com/watch?v=hisui2025_keiko_takasago',
    playlistId: 'hisui-no-kai-2025-keiko',
    recorded_date: '2025-03-10',
    stage: '翡翠の会',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '17',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=hisui2025_keiko_hagoromo',
    playlistId: 'hisui-no-kai-2025-keiko',
    recorded_date: '2025-03-12',
    stage: '翡翠の会',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '18',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=hisui2025_keiko_dojoji',
    playlistId: 'hisui-no-kai-2025-keiko',
    recorded_date: '2025-03-14',
    stage: '翡翠の会',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2024年EVE能 - 本番プレイリスト内の動画
  {
    id: '19',
    title: '安宅',
    url: 'https://youtube.com/watch?v=eve2024_honban_ataka',
    playlistId: 'eve-nou-2024-honban',
    recorded_date: '2024-12-20',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '20',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=eve2024_honban_funabenkei',
    playlistId: 'eve-nou-2024-honban',
    recorded_date: '2024-12-22',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '21',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=eve2024_honban_atsumori',
    playlistId: 'eve-nou-2024-honban',
    recorded_date: '2024-12-24',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2024年EVE能 - 稽古プレイリスト内の動画
  {
    id: '22',
    title: '安宅',
    url: 'https://youtube.com/watch?v=eve2024_keiko_ataka',
    playlistId: 'eve-nou-2024-keiko',
    recorded_date: '2024-12-10',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '23',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=eve2024_keiko_funabenkei',
    playlistId: 'eve-nou-2024-keiko',
    recorded_date: '2024-12-12',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '24',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=eve2024_keiko_atsumori',
    playlistId: 'eve-nou-2024-keiko',
    recorded_date: '2024-12-14',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2024年同観能 - 本番プレイリスト内の動画
  {
    id: '25',
    title: '高砂',
    url: 'https://youtube.com/watch?v=dokan2024_honban_takasago',
    playlistId: 'dokan-nou-2024-honban',
    recorded_date: '2024-11-20',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '26',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=dokan2024_honban_hagoromo',
    playlistId: 'dokan-nou-2024-honban',
    recorded_date: '2024-11-22',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '27',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=dokan2024_honban_dojoji',
    playlistId: 'dokan-nou-2024-honban',
    recorded_date: '2024-11-24',
    stage: '同観能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2024年同観能 - 稽古プレイリスト内の動画
  {
    id: '28',
    title: '高砂',
    url: 'https://youtube.com/watch?v=dokan2024_keiko_takasago',
    playlistId: 'dokan-nou-2024-keiko',
    recorded_date: '2024-11-10',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '29',
    title: '羽衣',
    url: 'https://youtube.com/watch?v=dokan2024_keiko_hagoromo',
    playlistId: 'dokan-nou-2024-keiko',
    recorded_date: '2024-11-12',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '30',
    title: '道成寺',
    url: 'https://youtube.com/watch?v=dokan2024_keiko_dojoji',
    playlistId: 'dokan-nou-2024-keiko',
    recorded_date: '2024-11-14',
    stage: '同観能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2023年EVE能 - 本番プレイリスト内の動画
  {
    id: '31',
    title: '安宅',
    url: 'https://youtube.com/watch?v=eve2023_honban_ataka',
    playlistId: 'eve-nou-2023-honban',
    recorded_date: '2023-12-20',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '32',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=eve2023_honban_funabenkei',
    playlistId: 'eve-nou-2023-honban',
    recorded_date: '2023-12-22',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '33',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=eve2023_honban_atsumori',
    playlistId: 'eve-nou-2023-honban',
    recorded_date: '2023-12-24',
    stage: 'EVE能',
    phase: '本番',
    thumbnailUrl: 'https://images.pexels.com/photos/247851/pexels-photo-247851.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  
  // 2023年EVE能 - 稽古プレイリスト内の動画
  {
    id: '34',
    title: '安宅',
    url: 'https://youtube.com/watch?v=eve2023_keiko_ataka',
    playlistId: 'eve-nou-2023-keiko',
    recorded_date: '2023-12-10',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '35',
    title: '船弁慶',
    url: 'https://youtube.com/watch?v=eve2023_keiko_funabenkei',
    playlistId: 'eve-nou-2023-keiko',
    recorded_date: '2023-12-12',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '36',
    title: '敦盛',
    url: 'https://youtube.com/watch?v=eve2023_keiko_atsumori',
    playlistId: 'eve-nou-2023-keiko',
    recorded_date: '2023-12-14',
    stage: 'EVE能',
    phase: '稽古',
    thumbnailUrl: 'https://images.pexels.com/photos/2889746/pexels-photo-2889746.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export { videos };