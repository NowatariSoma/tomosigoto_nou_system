'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { VideoPlaylist } from '../types/material-types';

/**
 * 動画プレイリストのカードコンポーネント
 * @param item - 表示する動画プレイリストのデータ
 */
interface MaterialCardProps {
  item: VideoPlaylist;
}

export function MaterialCard({ item }: MaterialCardProps) {
  return (
    <Card
      key={item.id}
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => window.open(item.youtubeUrl, '_blank')}
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge
            variant={item.phase === '本番' ? 'default' : 'secondary'}
            className="font-semibold"
          >
            {item.phase}
          </Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{item.title}</span>
          <span className="text-sm font-normal text-slate-500">{item.year}年</span>
        </CardTitle>
        <CardDescription>
          YouTubeプレイリストを見る
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
