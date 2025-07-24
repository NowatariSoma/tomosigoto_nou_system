import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { VenueGrid } from '../VenueGrid'
import type { Venue } from '@/types/venue'

const mockVenues: Venue[] = [
  {
    id: 1,
    name: '体育館A',
    description: 'メイン体育館です',
    location: { 
      address: '東京都渋谷区1-1-1',
      nearestStation: '渋谷駅'
    },
    capacity: 100,
    pricePerHour: 5000,
    equipment: [
      { id: 1, name: 'バスケットボール', category: 'スポーツ', count: 10, available: true }
    ],
    photos: [
      { id: 1, url: '/venue1.jpg', alt: '体育館A', isPrimary: true }
    ],
    contactPhone: '03-1234-5678',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  },
  {
    id: 2,
    name: '体育館B',
    description: 'サブ体育館です',
    location: { 
      address: '東京都新宿区2-2-2',
      nearestStation: '新宿駅'
    },
    capacity: 50,
    pricePerHour: 3000,
    equipment: [],
    photos: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  },
]

describe('VenueGrid', () => {
  test('会場カードが正しく表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    // 会場名が表示される
    expect(screen.getByText('体育館A')).toBeInTheDocument()
    expect(screen.getByText('体育館B')).toBeInTheDocument()

    // 場所が表示される
    expect(screen.getByText('東京都渋谷区1-1-1')).toBeInTheDocument()
    expect(screen.getByText('東京都新宿区2-2-2')).toBeInTheDocument()

    // 収容人数が表示される
    expect(screen.getByText('100名')).toBeInTheDocument()
    expect(screen.getByText('50名')).toBeInTheDocument()
  })

  test('会場の料金情報が正しく表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    expect(screen.getByText('¥5,000/時間')).toBeInTheDocument()
    expect(screen.getByText('¥3,000/時間')).toBeInTheDocument()
  })

  test('会場の写真が表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const venueImage = screen.getByAltText('体育館A')
    expect(venueImage).toBeInTheDocument()
    expect(venueImage).toHaveAttribute('src', '/venue1.jpg')
  })

  test('写真がない場合はデフォルト画像が表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const defaultImages = screen.getAllByTestId('default-venue-image')
    expect(defaultImages).toHaveLength(1) // venue2のみ
  })

  test('会場カードをクリックするとonVenueClickが呼ばれる', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const venueCard = screen.getByTestId('venue-card-1')
    fireEvent.click(venueCard)

    expect(mockOnVenueClick).toHaveBeenCalledWith(1)
  })

  test('複数の会場カードがクリック可能', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const venueCard1 = screen.getByTestId('venue-card-1')
    const venueCard2 = screen.getByTestId('venue-card-2')

    fireEvent.click(venueCard1)
    fireEvent.click(venueCard2)

    expect(mockOnVenueClick).toHaveBeenCalledTimes(2)
    expect(mockOnVenueClick).toHaveBeenNthCalledWith(1, 1)
    expect(mockOnVenueClick).toHaveBeenNthCalledWith(2, 2)
  })

  test('ローディング状態でスケルトンが表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={[]} onVenueClick={mockOnVenueClick} loading={true} />)

    const skeletons = screen.getAllByTestId('venue-card-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  test('会場が空の場合は何も表示されない', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={[]} onVenueClick={mockOnVenueClick} />)

    expect(screen.queryByTestId(/venue-card-\d+/)).not.toBeInTheDocument()
  })

  test('グリッドサイズが正しく適用される', () => {
    const mockOnVenueClick = jest.fn()
    const { rerender } = render(
      <VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} gridSize="small" />
    )

    const gridContainer = screen.getByTestId('venue-grid')
    expect(gridContainer).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5')

    rerender(
      <VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} gridSize="large" />
    )

    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
  })

  test('ホバー状態が正しく管理される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const venueCard = screen.getByTestId('venue-card-1')
    
    // ホバー
    fireEvent.mouseEnter(venueCard)
    expect(venueCard).toHaveClass('hover:shadow-lg')

    // ホバー終了
    fireEvent.mouseLeave(venueCard)
    expect(venueCard).not.toHaveClass('hover:shadow-lg')
  })

  test('設備数が表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueGrid venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    expect(screen.getByText('設備: 1件')).toBeInTheDocument()
    expect(screen.getByText('設備: 0件')).toBeInTheDocument()
  })
})