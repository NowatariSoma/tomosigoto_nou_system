import { useState, useEffect } from 'react';
import { Room } from '../../room-settings/types';

// モック会場データ
const mockVenues: Room[] = [
  {
    id: 'venue-1',
    name: '体育館A',
    campus: '今出川',
    capacity: 50,
    danceAllowed: true,
    description: 'メイン体育館',
    location: '1階',
  },
  {
    id: 'venue-2',
    name: '体育館B',
    campus: '京田辺',
    capacity: 30,
    danceAllowed: false,
    description: 'サブ体育館',
    location: '2階',
  },
  {
    id: 'venue-3',
    name: 'グラウンド',
    campus: '今出川',
    capacity: 100,
    danceAllowed: false,
    description: '屋外グラウンド',
    location: '屋外',
  },
];

export const useVenues = () => {
  const [venues, setVenues] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      // ネットワーク遅延をシミュレート
      await new Promise(resolve => setTimeout(resolve, 300));
      setVenues(mockVenues);
    } catch (err) {
      setError(err instanceof Error ? err.message : '会場データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  return {
    venues,
    loading,
    error,
    refetch: fetchVenues,
  };
};
