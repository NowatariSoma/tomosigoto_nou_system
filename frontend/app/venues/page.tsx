import { VenueListView } from '@/features/venues/views/VenueListView'

export default function VenuesPage() {
  return <VenueListView />
}

export const metadata = {
  title: '会場一覧 - 練習表自動生成システム',
  description: '利用可能な練習会場を検索・閲覧できます。',
}