import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VenueListView } from '../VenueListView'

// Mock the useVenues hook
jest.mock('../../hooks/useVenues')
import { useVenues } from '../../hooks/useVenues'
const mockUseVenues = useVenues as jest.MockedFunction<typeof useVenues>

// Mock child components
jest.mock('../../components/VenueSearch', () => ({
  VenueSearch: ({ onSearchChange }: { onSearchChange: (term: string) => void }) => (
    <input
      data-testid="venue-search"
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="会場を検索..."
    />
  ),
}))

jest.mock('../../components/VenueFilter', () => ({
  VenueFilter: ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => (
    <div data-testid="venue-filter">
      <button onClick={() => onFilterChange({ minCapacity: 50 })}>
        Filter 50+
      </button>
    </div>
  ),
}))

jest.mock('../../components/VenueGrid', () => ({
  VenueGrid: ({ venues, onVenueClick }: { venues: any[]; onVenueClick: (id: number) => void }) => (
    <div data-testid="venue-grid">
      {venues.map((venue) => (
        <button
          key={venue.id}
          data-testid={`venue-card-${venue.id}`}
          onClick={() => onVenueClick(venue.id)}
        >
          {venue.name}
        </button>
      ))}
    </div>
  ),
}))

jest.mock('../../components/VenueList', () => ({
  VenueList: ({ venues, onVenueClick }: { venues: any[]; onVenueClick: (id: number) => void }) => (
    <div data-testid="venue-list">
      {venues.map((venue) => (
        <div key={venue.id} data-testid={`venue-item-${venue.id}`}>
          <button onClick={() => onVenueClick(venue.id)}>{venue.name}</button>
        </div>
      ))}
    </div>
  ),
}))

const mockVenues = [
  {
    id: 1,
    name: '体育館A',
    location: { address: '東京都渋谷区' },
    capacity: 100,
    equipment: [],
    photos: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  },
  {
    id: 2,
    name: '体育館B',
    location: { address: '東京都新宿区' },
    capacity: 200,
    equipment: [],
    photos: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  },
]

describe('VenueListView', () => {
  const mockFetchVenues = jest.fn()
  const mockSetPage = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseVenues.mockReturnValue({
      venues: mockVenues,
      loading: false,
      error: null,
      totalCount: 2,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
      fetchVenues: mockFetchVenues,
      fetchVenueById: jest.fn(),
      fetchVenueAvailability: jest.fn(),
      setPage: mockSetPage,
    })
  })

  test('コンポーネントが正しくレンダリングされる', () => {
    render(<VenueListView />)

    expect(screen.getByText('会場一覧')).toBeInTheDocument()
    expect(screen.getByTestId('venue-search')).toBeInTheDocument()
    expect(screen.getByTestId('venue-filter')).toBeInTheDocument()
  })

  test('初期状態でグリッド表示が選択されている', () => {
    render(<VenueListView />)

    expect(screen.getByTestId('venue-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('venue-list')).not.toBeInTheDocument()
  })

  test('表示モード切り替えボタンが機能する', () => {
    render(<VenueListView />)

    // リスト表示に切り替え
    const listViewButton = screen.getByRole('button', { name: /リスト表示/ })
    fireEvent.click(listViewButton)

    expect(screen.getByTestId('venue-list')).toBeInTheDocument()
    expect(screen.queryByTestId('venue-grid')).not.toBeInTheDocument()

    // グリッド表示に戻す
    const gridViewButton = screen.getByRole('button', { name: /グリッド表示/ })
    fireEvent.click(gridViewButton)

    expect(screen.getByTestId('venue-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('venue-list')).not.toBeInTheDocument()
  })

  test('検索機能が正しく動作する', async () => {
    render(<VenueListView />)

    const searchInput = screen.getByTestId('venue-search')
    fireEvent.change(searchInput, { target: { value: '体育館A' } })

    await waitFor(() => {
      expect(mockFetchVenues).toHaveBeenCalledWith({
        filters: { searchTerm: '体育館A' },
      })
    })
  })

  test('フィルタ機能が正しく動作する', async () => {
    render(<VenueListView />)

    const filterButton = screen.getByText('Filter 50+')
    fireEvent.click(filterButton)

    await waitFor(() => {
      expect(mockFetchVenues).toHaveBeenCalledWith({
        filters: { minCapacity: 50 },
      })
    })
  })

  test('会場選択で詳細画面に遷移する', () => {
    // Next.js routerのモック
    const mockPush = jest.fn()
    const mockRouter = {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }

    jest.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }))

    render(<VenueListView />)

    const venueCard = screen.getByTestId('venue-card-1')
    fireEvent.click(venueCard)

    expect(mockPush).toHaveBeenCalledWith('/venues/1')
  })

  test('ローディング状態が正しく表示される', () => {
    mockUseVenues.mockReturnValue({
      venues: [],
      loading: true,
      error: null,
      totalCount: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
      fetchVenues: mockFetchVenues,
      fetchVenueById: jest.fn(),
      fetchVenueAvailability: jest.fn(),
      setPage: mockSetPage,
    })

    render(<VenueListView />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  test('エラー状態が正しく表示される', () => {
    const error = new Error('API Error')
    mockUseVenues.mockReturnValue({
      venues: [],
      loading: false,
      error,
      totalCount: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
      fetchVenues: mockFetchVenues,
      fetchVenueById: jest.fn(),
      fetchVenueAvailability: jest.fn(),
      setPage: mockSetPage,
    })

    render(<VenueListView />)

    expect(screen.getByText('エラーが発生しました: API Error')).toBeInTheDocument()
  })

  test('ページネーションが正しく動作する', () => {
    mockUseVenues.mockReturnValue({
      venues: mockVenues,
      loading: false,
      error: null,
      totalCount: 50,
      currentPage: 1,
      hasNextPage: true,
      hasPrevPage: false,
      fetchVenues: mockFetchVenues,
      fetchVenueById: jest.fn(),
      fetchVenueAvailability: jest.fn(),
      setPage: mockSetPage,
    })

    render(<VenueListView />)

    const nextButton = screen.getByRole('button', { name: /次のページ/ })
    fireEvent.click(nextButton)

    expect(mockSetPage).toHaveBeenCalledWith(2)
  })

  test('コンポーネントマウント時にfetchVenuesが呼ばれる', () => {
    render(<VenueListView />)

    expect(mockFetchVenues).toHaveBeenCalledWith({})
  })
})