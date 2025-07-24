import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { VenueFilter } from '../VenueFilter'

describe('VenueFilter', () => {
  test('フィルタコンポーネントが正しくレンダリングされる', () => {
    const mockOnFilterChange = jest.fn()
    render(<VenueFilter onFilterChange={mockOnFilterChange} />)

    expect(screen.getByText('フィルタ')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('最小収容人数')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('最大収容人数')).toBeInTheDocument()
  })

  test('収容人数フィルタが機能する', () => {
    const mockOnFilterChange = jest.fn()
    render(<VenueFilter onFilterChange={mockOnFilterChange} />)

    const minCapacityInput = screen.getByPlaceholderText('最小収容人数')
    fireEvent.change(minCapacityInput, { target: { value: '50' } })

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      minCapacity: 50,
    })
  })

  test('エリアフィルタが機能する', () => {
    const mockOnFilterChange = jest.fn()
    render(<VenueFilter onFilterChange={mockOnFilterChange} />)

    const areaSelect = screen.getByDisplayValue('全てのエリア')
    fireEvent.change(areaSelect, { target: { value: '渋谷区' } })

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      area: '渋谷区',
    })
  })

  test('フィルタクリアが機能する', () => {
    const mockOnFilterChange = jest.fn()
    render(<VenueFilter onFilterChange={mockOnFilterChange} />)

    // まずフィルタを設定
    const minCapacityInput = screen.getByPlaceholderText('最小収容人数')
    fireEvent.change(minCapacityInput, { target: { value: '50' } })

    // クリアボタンをクリック
    const clearButton = screen.getByText('クリア')
    fireEvent.click(clearButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({})
    expect(minCapacityInput).toHaveValue('')
  })
})