import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { VenueList } from '../VenueList'
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
    location: { address: '東京都新宿区2-2-2' },
    capacity: 50,
    equipment: [],
    photos: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
  },
]

describe('VenueList', () => {
  test('会場リストが正しく表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueList venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    expect(screen.getByText('体育館A')).toBeInTheDocument()
    expect(screen.getByText('体育館B')).toBeInTheDocument()
    expect(screen.getByText('東京都渋谷区1-1-1')).toBeInTheDocument()
    expect(screen.getByText('東京都新宿区2-2-2')).toBeInTheDocument()
  })

  test('会場の詳細情報が表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueList venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    expect(screen.getByText('100名')).toBeInTheDocument()
    expect(screen.getByText('50名')).toBeInTheDocument()
    expect(screen.getByText('¥5,000/時間')).toBeInTheDocument()
    expect(screen.getByText('メイン体育館です')).toBeInTheDocument()
  })

  test('会場アイテムをクリックするとonVenueClickが呼ばれる', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueList venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    const venueItem = screen.getByTestId('venue-item-1')
    fireEvent.click(venueItem)

    expect(mockOnVenueClick).toHaveBeenCalledWith(1)
  })

  test('空の会場リストの場合は何も表示されない', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueList venues={[]} onVenueClick={mockOnVenueClick} />)

    expect(screen.queryByTestId(/venue-item-\d+/)).not.toBeInTheDocument()
  })

  test('連絡先情報が適切に表示される', () => {
    const mockOnVenueClick = jest.fn()
    render(<VenueList venues={mockVenues} onVenueClick={mockOnVenueClick} />)

    expect(screen.getByText('03-1234-5678')).toBeInTheDocument()
  })
})