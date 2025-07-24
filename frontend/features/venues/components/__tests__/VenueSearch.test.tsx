import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VenueSearch } from '../VenueSearch'

describe('VenueSearch', () => {
  test('検索入力フィールドが正しくレンダリングされる', () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchInput = screen.getByPlaceholderText('会場名や地域で検索...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('type', 'text')
  })

  test('検索アイコンが表示される', () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchIcon = screen.getByTestId('search-icon')
    expect(searchIcon).toBeInTheDocument()
  })

  test('入力値が変更されるとonSearchChangeが呼ばれる（デバウンス有り）', async () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchInput = screen.getByPlaceholderText('会場名や地域で検索...')
    
    // 検索語を入力
    fireEvent.change(searchInput, { target: { value: '体育館' } })
    
    // デバウンス前は呼ばれない
    expect(mockOnSearchChange).not.toHaveBeenCalled()
    
    // デバウンス後に呼ばれる
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('体育館')
    }, { timeout: 1000 })
  })

  test('複数の文字入力でも最後の値のみでonSearchChangeが呼ばれる', async () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchInput = screen.getByPlaceholderText('会場名や地域で検索...')
    
    // 連続で入力
    fireEvent.change(searchInput, { target: { value: '体' } })
    fireEvent.change(searchInput, { target: { value: '体育' } })
    fireEvent.change(searchInput, { target: { value: '体育館' } })
    
    // デバウンス後に最後の値のみで呼ばれる
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledTimes(1)
      expect(mockOnSearchChange).toHaveBeenCalledWith('体育館')
    }, { timeout: 1000 })
  })

  test('空文字を入力するとonSearchChangeが空文字で呼ばれる', async () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchInput = screen.getByPlaceholderText('会場名や地域で検索...')
    
    // 最初に何か入力
    fireEvent.change(searchInput, { target: { value: '体育館' } })
    
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('体育館')
    })

    // クリア
    fireEvent.change(searchInput, { target: { value: '' } })
    
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('')
    })
  })

  test('初期値が設定されている場合、その値が表示される', () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} initialValue="初期検索値" />)

    const searchInput = screen.getByDisplayValue('初期検索値')
    expect(searchInput).toBeInTheDocument()
  })

  test('clearボタンをクリックすると入力値がクリアされる', async () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    const searchInput = screen.getByPlaceholderText('会場名や地域で検索...')
    
    // 検索語を入力
    fireEvent.change(searchInput, { target: { value: '体育館' } })
    
    // クリアボタンが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId('clear-button')).toBeInTheDocument()
    })

    // クリアボタンをクリック
    const clearButton = screen.getByTestId('clear-button')
    fireEvent.click(clearButton)

    // 入力値がクリアされる
    expect(searchInput).toHaveValue('')
    
    // onSearchChangeが空文字で呼ばれる
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('')
    })
  })

  test('入力値が空の時はクリアボタンが表示されない', () => {
    const mockOnSearchChange = jest.fn()
    render(<VenueSearch onSearchChange={mockOnSearchChange} />)

    expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument()
  })
})