import { Room } from '../types/room';

export const rooms: Room[] = [
  {
    id: '1',
    name: '多目的ホール',
    campus: '京田辺',
    capacity: 10,
    danceAllowed: true,
    description: '利用時間に制約あり',
    location: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
  },
  {
    id: '2',
    name: '京田辺別館204',
    campus: '京田辺',
    capacity: 8,
    danceAllowed: false,
    description: 'なし',
    location: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
  },
  {
    id: '3',
    name: '京田辺別館205',
    campus: '京田辺',
    capacity: 12,
    danceAllowed: false,
    description: 'なし',
    location: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
  },
  {
    id: '4',
    name: '新町練習場',
    campus: '今出川',
    capacity: 15,
    danceAllowed: true,
    description: '防音設備完備、夜間利用可能',
    location: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
  },
  {
    id: '5',
    name: '今出川別館301',
    campus: '今出川',
    capacity: 6,
    danceAllowed: false,
    description: '静かな環境での利用推奨',
    location: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
  }
]; 