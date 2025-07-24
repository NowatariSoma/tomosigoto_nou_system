import { VenueDetailView } from '@/features/venues/views/VenueDetailView'

interface VenueDetailPageProps {
  params: {
    id: string
  }
}

export default function VenueDetailPage({ params }: VenueDetailPageProps) {
  return <VenueDetailView venueId={parseInt(params.id, 10)} />
}

export const metadata = {
  title: '会場詳細 - 練習表自動生成システム',
  description: '会場の詳細情報を表示します。',
}