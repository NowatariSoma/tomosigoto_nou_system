/**
 * QuickCreateMenu Component Test
 * TDD テスト - クイック作成メニューコンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickCreateMenu } from '../../components/schedule/QuickCreateMenu'
import { Position } from '../../../types/session'

// テストデータ
const mockPosition: Position = {
  x: 100,
  y: 200,
  date: new Date('2024-01-15'),
  time: new Date('2024-01-15T09:00:00')
}

const mockParts = [
  { id: 1, name: 'パート1' },
  { id: 2, name: 'パート2' }
]

const mockVenues = [
  { id: 'venue-1', name: '会場1' },
  { id: 'venue-2', name: '会場2' }
]

// モック関数
const mockOnQuickCreate = jest.fn()
const mockOnDetailedCreate = jest.fn()
const mockOnClose = jest.fn()

const defaultProps = {
  position: mockPosition,
  onQuickCreate: mockOnQuickCreate,
  onDetailedCreate: mockOnDetailedCreate,
  onClose: mockOnClose,
  parts: mockParts,
  venues: mockVenues
}

describe('QuickCreateMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('should render menu with correct position', () => {
      render(<QuickCreateMenu {...defaultProps} />)

      expect(screen.getByText('セッション作成')).toBeInTheDocument()
      expect(screen.getByText('1月15日(月)')).toBeInTheDocument()
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()
      expect(screen.getByText('(60分間)')).toBeInTheDocument()
    })

    it('should render part selection', () => {
      render(<QuickCreateMenu {...defaultProps} />)

      expect(screen.getByLabelText(/パート/)).toBeInTheDocument()
      expect(screen.getByText('パートを選択')).toBeInTheDocument()
    })

    it('should render duration selection with default 60 minutes', () => {
      render(<QuickCreateMenu {...defaultProps} />)

      expect(screen.getByLabelText(/時間/)).toBeInTheDocument()
      expect(screen.getByDisplayValue('1時間')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<QuickCreateMenu {...defaultProps} />)

      expect(screen.getByText('キャンセル')).toBeInTheDocument()
      expect(screen.getByText('詳細設定')).toBeInTheDocument()
      expect(screen.getByText('作成')).toBeInTheDocument()
    })

    it('should disable create button when no part is selected', () => {
      render(<QuickCreateMenu {...defaultProps} />)

      const createButton = screen.getByText('作成')
      expect(createButton).toBeDisabled()
      expect(screen.getByText('パートを選択してください')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <QuickCreateMenu {...defaultProps} className="custom-class" />
      )

      const menuElement = container.querySelector('.custom-class')
      expect(menuElement).toBeInTheDocument()
    })
  })

  describe('パート選択', () => {
    it('should enable create button when part is selected', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      const createButton = screen.getByText('作成')
      expect(createButton).not.toBeDisabled()
      expect(screen.queryByText('パートを選択してください')).not.toBeInTheDocument()
    })

    it('should update selected part', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート2'))

      expect(screen.getByDisplayValue('パート2')).toBeInTheDocument()
    })
  })

  describe('時間選択', () => {
    it('should update duration and end time', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const durationSelect = screen.getByRole('combobox', { name: /時間/ })
      await user.click(durationSelect)
      await user.click(screen.getByText('2時間'))

      expect(screen.getByDisplayValue('2時間')).toBeInTheDocument()
      expect(screen.getByText('09:00 - 11:00')).toBeInTheDocument()
      expect(screen.getByText('(120分間)')).toBeInTheDocument()
    })

    it('should show all duration options', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const durationSelect = screen.getByRole('combobox', { name: /時間/ })
      await user.click(durationSelect)

      expect(screen.getByText('30分')).toBeInTheDocument()
      expect(screen.getByText('1時間')).toBeInTheDocument()
      expect(screen.getByText('1時間30分')).toBeInTheDocument()
      expect(screen.getByText('2時間')).toBeInTheDocument()
      expect(screen.getByText('3時間')).toBeInTheDocument()
    })
  })

  describe('クイック作成', () => {
    it('should call onQuickCreate with correct data', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      // パートを選択
      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      // 時間を変更
      const durationSelect = screen.getByRole('combobox', { name: /時間/ })
      await user.click(durationSelect)
      await user.click(screen.getByText('1時間30分'))

      // 作成ボタンをクリック
      const createButton = screen.getByText('作成')
      await user.click(createButton)

      expect(mockOnQuickCreate).toHaveBeenCalledWith({
        partId: 1,
        duration: 90,
        date: mockPosition.date,
        time: mockPosition.time
      })
    })

    it('should not call onQuickCreate when no part is selected', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const createButton = screen.getByText('作成')
      
      // ボタンが無効化されているため、クリックイベントは発生しない
      expect(createButton).toBeDisabled()
    })
  })

  describe('詳細作成', () => {
    it('should call onDetailedCreate with initial data', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      // パートを選択
      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート2'))

      // 時間を変更
      const durationSelect = screen.getByRole('combobox', { name: /時間/ })
      await user.click(durationSelect)
      await user.click(screen.getByText('2時間'))

      // 詳細設定ボタンをクリック
      const detailButton = screen.getByText('詳細設定')
      await user.click(detailButton)

      expect(mockOnDetailedCreate).toHaveBeenCalledWith({
        title: 'パート2',
        start: mockPosition.time,
        end: new Date('2024-01-15T11:00:00'), // 2時間後
        partId: 2,
        instructorId: '',
        venueId: 'venue-1', // 最初の会場
        description: ''
      })
    })

    it('should work even without part selection', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const detailButton = screen.getByText('詳細設定')
      await user.click(detailButton)

      expect(mockOnDetailedCreate).toHaveBeenCalledWith({
        title: '',
        start: mockPosition.time,
        end: new Date('2024-01-15T10:00:00'), // デフォルト1時間後
        partId: 0,
        instructorId: '',
        venueId: 'venue-1',
        description: ''
      })
    })
  })

  describe('キャンセル', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('ポジショニング', () => {
    it('should apply correct positioning styles', () => {
      const { container } = render(<QuickCreateMenu {...defaultProps} />)

      const menuElement = container.querySelector('[style*="left: 100px"]')
      expect(menuElement).toBeInTheDocument()
      
      const menuElementWithTop = container.querySelector('[style*="top: 200px"]')
      expect(menuElementWithTop).toBeInTheDocument()
    })
  })

  describe('時間表示の更新', () => {
    it('should update end time when duration changes', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} />)

      // 初期状態の確認
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()

      // 時間を30分に変更
      const durationSelect = screen.getByRole('combobox', { name: /時間/ })
      await user.click(durationSelect)
      await user.click(screen.getByText('30分'))

      // 終了時間が更新されることを確認
      expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument()
      expect(screen.getByText('(30分間)')).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('should handle empty parts array', () => {
      render(<QuickCreateMenu {...defaultProps} parts={[]} />)

      expect(screen.getByText('パートを選択')).toBeInTheDocument()
      
      // パートがない場合はクイック作成できない
      const createButton = screen.getByText('作成')
      expect(createButton).toBeDisabled()
    })

    it('should handle empty venues array', async () => {
      const user = userEvent.setup()
      render(<QuickCreateMenu {...defaultProps} venues={[]} />)

      const detailButton = screen.getByText('詳細設定')
      await user.click(detailButton)

      expect(mockOnDetailedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          venueId: '' // 会場が空の場合
        })
      )
    })
  })
})