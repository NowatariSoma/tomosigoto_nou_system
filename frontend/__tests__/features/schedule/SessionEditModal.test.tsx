/**
 * SessionEditModal Component Test
 * TDD テスト - セッション編集モーダルコンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionEditModal } from '../../../src/features/schedule/components/SessionEditModal'
import { Session, SessionFormData } from '../../../types/session'

// テストデータ
const mockSession: Session = {
  id: 'session-1',
  title: 'テストセッション',
  start: new Date('2024-01-15T09:00:00'),
  end: new Date('2024-01-15T10:00:00'),
  partId: 1,
  partName: 'パート1',
  venueId: 'venue-1',
  venueName: '会場1',
  instructorId: 'instructor-1',
  instructorName: '指導者1',
  status: 'scheduled',
  color: '#3B82F6',
  createdAt: new Date('2024-01-15T08:00:00'),
  updatedAt: new Date('2024-01-15T08:00:00'),
  description: 'テスト説明'
}

const mockVenues = [
  { id: 'venue-1', name: '会場1' },
  { id: 'venue-2', name: '会場2' }
]

const mockInstructors = [
  { id: 'instructor-1', name: '指導者1' },
  { id: 'instructor-2', name: '指導者2' }
]

const mockParts = [
  { id: 1, name: 'パート1' },
  { id: 2, name: 'パート2' }
]

// モック関数
const mockOnClose = jest.fn()
const mockOnSave = jest.fn()
const mockOnDelete = jest.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  venues: mockVenues,
  instructors: mockInstructors,
  parts: mockParts
}

describe('SessionEditModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('should render create mode correctly', () => {
      render(<SessionEditModal {...defaultProps} />)

      expect(screen.getByText('新規セッション作成')).toBeInTheDocument()
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument()
      expect(screen.getByLabelText(/開始日時/)).toBeInTheDocument()
      expect(screen.getByLabelText(/終了日時/)).toBeInTheDocument()
      expect(screen.getByText('作成')).toBeInTheDocument()
    })

    it('should render edit mode correctly', () => {
      render(<SessionEditModal {...defaultProps} session={mockSession} onDelete={mockOnDelete} />)

      expect(screen.getByText('セッション編集')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テストセッション')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テスト説明')).toBeInTheDocument()
      expect(screen.getByText('更新')).toBeInTheDocument()
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('should not render delete button in create mode', () => {
      render(<SessionEditModal {...defaultProps} />)

      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })

    it('should pre-populate form fields in edit mode', () => {
      render(<SessionEditModal {...defaultProps} session={mockSession} />)

      expect(screen.getByDisplayValue('テストセッション')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テスト説明')).toBeInTheDocument()
    })
  })

  describe('フォーム入力', () => {
    it('should update title field', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const titleInput = screen.getByLabelText(/タイトル/)
      await user.clear(titleInput)
      await user.type(titleInput, '新しいタイトル')

      expect(titleInput).toHaveValue('新しいタイトル')
    })

    it('should update date fields', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const startDateInput = screen.getByLabelText(/開始日時/)
      await user.clear(startDateInput)
      await user.type(startDateInput, '2024-02-01')

      expect(startDateInput).toHaveValue('2024-02-01')
    })

    it('should update time fields', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const startTimeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/)
      const startTimeInput = startTimeInputs[0]
      
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '14:30')

      expect(startTimeInput).toHaveValue('14:30')
    })

    it('should update description field', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const descriptionInput = screen.getByLabelText(/説明/)
      await user.clear(descriptionInput)
      await user.type(descriptionInput, '新しい説明')

      expect(descriptionInput).toHaveValue('新しい説明')
    })
  })

  describe('バリデーション', () => {
    it('should show error for empty title', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      expect(screen.getByText('タイトルを入力してください')).toBeInTheDocument()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should show error for long title', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const titleInput = screen.getByLabelText(/タイトル/)
      const longTitle = 'a'.repeat(101)
      await user.clear(titleInput)
      await user.type(titleInput, longTitle)

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      expect(screen.getByText('タイトルは100文字以内で入力してください')).toBeInTheDocument()
    })

    it('should show error when start time is after end time', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      // タイトルを設定（必須項目）
      const titleInput = screen.getByLabelText(/タイトル/)
      await user.type(titleInput, 'テストタイトル')

      // パートを選択（必須項目）
      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      // 会場を選択（必須項目）
      const venueSelect = screen.getByRole('combobox', { name: /会場/ })
      await user.click(venueSelect)
      await user.click(screen.getByText('会場1'))

      // 開始時刻を終了時刻より後に設定
      const timeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/)
      const startTimeInput = timeInputs[0]
      const endTimeInput = timeInputs[1]
      
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '15:00')
      await user.clear(endTimeInput)
      await user.type(endTimeInput, '14:00')

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      expect(screen.getByText('開始時刻は終了時刻より前である必要があります')).toBeInTheDocument()
    })

    it('should show error for session shorter than 30 minutes', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const titleInput = screen.getByLabelText(/タイトル/)
      await user.type(titleInput, 'テストタイトル')

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      const venueSelect = screen.getByRole('combobox', { name: /会場/ })
      await user.click(venueSelect)
      await user.click(screen.getByText('会場1'))

      // 15分間のセッションを設定
      const timeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/)
      const startTimeInput = timeInputs[0]
      const endTimeInput = timeInputs[1]
      
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '09:00')
      await user.clear(endTimeInput)
      await user.type(endTimeInput, '09:15')

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      expect(screen.getByText('セッションは最低30分必要です')).toBeInTheDocument()
    })
  })

  describe('フォーム送信', () => {
    it('should call onSave with correct data', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValue(undefined)
      
      render(<SessionEditModal {...defaultProps} />)

      // 必須フィールドを入力
      const titleInput = screen.getByLabelText(/タイトル/)
      await user.type(titleInput, 'テストセッション')

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      const venueSelect = screen.getByRole('combobox', { name: /会場/ })
      await user.click(venueSelect)
      await user.click(screen.getByText('会場1'))

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'テストセッション',
            partId: 1,
            venueId: 'venue-1'
          })
        )
      })
    })

    it('should close modal after successful save', async () => {
      const user = userEvent.setup()
      mockOnSave.mockResolvedValue(undefined)
      
      render(<SessionEditModal {...defaultProps} />)

      const titleInput = screen.getByLabelText(/タイトル/)
      await user.type(titleInput, 'テストセッション')

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      const venueSelect = screen.getByRole('combobox', { name: /会場/ })
      await user.click(venueSelect)
      await user.click(screen.getByText('会場1'))

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should show error message on save failure', async () => {
      const user = userEvent.setup()
      mockOnSave.mockRejectedValue(new Error('Save failed'))
      
      render(<SessionEditModal {...defaultProps} />)

      const titleInput = screen.getByLabelText(/タイトル/)
      await user.type(titleInput, 'テストセッション')

      const partSelect = screen.getByRole('combobox', { name: /パート/ })
      await user.click(partSelect)
      await user.click(screen.getByText('パート1'))

      const venueSelect = screen.getByRole('combobox', { name: /会場/ })
      await user.click(venueSelect)
      await user.click(screen.getByText('会場1'))

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('セッションの保存に失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('削除機能', () => {
    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} session={mockSession} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      expect(screen.getByText('セッション削除の確認')).toBeInTheDocument()
      expect(screen.getByText(/セッション「テストセッション」を削除してもよろしいですか/)).toBeInTheDocument()
    })

    it('should call onDelete when confirmed', async () => {
      const user = userEvent.setup()
      mockOnDelete.mockResolvedValue(undefined)
      
      render(<SessionEditModal {...defaultProps} session={mockSession} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /削除.*/ })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('session-1')
      })
    })

    it('should close modal after successful delete', async () => {
      const user = userEvent.setup()
      mockOnDelete.mockResolvedValue(undefined)
      
      render(<SessionEditModal {...defaultProps} session={mockSession} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /削除.*/ })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should cancel delete when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} session={mockSession} onDelete={mockOnDelete} />)

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      expect(screen.queryByText('セッション削除の確認')).not.toBeInTheDocument()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('自動調整機能', () => {
    it('should adjust end time when start time changes', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} session={mockSession} />)

      // 開始時刻を変更
      const timeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/)
      const startTimeInput = timeInputs[0]
      
      await user.clear(startTimeInput)
      await user.type(startTimeInput, '10:00')

      // 終了時刻も自動的に調整されることを確認
      await waitFor(() => {
        const updatedTimeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/)
        const endTimeInput = updatedTimeInputs[1]
        expect(endTimeInput).toHaveValue('11:00')
      })
    })
  })

  describe('キャンセル機能', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<SessionEditModal {...defaultProps} />)

      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})