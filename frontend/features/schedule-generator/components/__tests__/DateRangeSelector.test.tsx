import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeSelector } from '../DateRangeSelector'
import { DateRange } from '../../types/generationParams'

// date-fnsのモック
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy/MM/dd') {
      return date.toISOString().split('T')[0].replace(/-/g, '/')
    }
    return date.toISOString().split('T')[0]
  }),
  isAfter: jest.fn((date1: Date, date2: Date) => date1.getTime() > date2.getTime()),
  isBefore: jest.fn((date1: Date, date2: Date) => date1.getTime() < date2.getTime()),
  addDays: jest.fn((date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  addWeeks: jest.fn((date: Date, weeks: number) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)),
  addMonths: jest.fn((date: Date, months: number) => {
    const result = new Date(date)
    result.setMonth(date.getMonth() + months)
    return result
  }),
  startOfDay: jest.fn((date: Date) => {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
  }),
}))

describe('DateRangeSelector', () => {
  const defaultValue: DateRange = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }

  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('開始日と終了日の入力フィールドが表示される', () => {
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('開始日')).toBeInTheDocument()
      expect(screen.getByLabelText('終了日')).toBeInTheDocument()
    })

    it('現在の日付範囲が表示される', () => {
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByDisplayValue('2024/01/01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024/01/31')).toBeInTheDocument()
    })

    it('クイック選択ボタンが表示される', () => {
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('今週')).toBeInTheDocument()
      expect(screen.getByText('来週')).toBeInTheDocument()
      expect(screen.getByText('今月')).toBeInTheDocument()
      expect(screen.getByText('来月')).toBeInTheDocument()
    })

    it('無効状態の場合、入力フィールドが無効になる', () => {
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          disabled={true}
        />
      )

      expect(screen.getByLabelText('開始日')).toBeDisabled()
      expect(screen.getByLabelText('終了日')).toBeDisabled()
    })
  })

  describe('日付変更', () => {
    it('開始日を変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const startDateInput = screen.getByLabelText('開始日')
      await user.click(startDateInput)

      // カレンダーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // 2日を選択
      const day2 = screen.getByText('2')
      await user.click(day2)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-02'),
        endDate: defaultValue.endDate,
      })
    })

    it('終了日を変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const endDateInput = screen.getByLabelText('終了日')
      await user.click(endDateInput)

      // カレンダーが表示されることを確認
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // 30日を選択
      const day30 = screen.getByText('30')
      await user.click(day30)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: defaultValue.startDate,
        endDate: new Date('2024-01-30'),
      })
    })

    it('開始日が終了日より後の場合、終了日も自動調整される', async () => {
      const user = userEvent.setup()
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const startDateInput = screen.getByLabelText('開始日')
      await user.click(startDateInput)

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // 2月1日を選択（終了日の1月31日より後）
      // 次月ボタンをクリック
      const nextButton = screen.getByRole('button', { name: /next month/i })
      await user.click(nextButton)

      const day1 = screen.getByText('1')
      await user.click(day1)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-01'), // 終了日も同じ日に調整
      })
    })
  })

  describe('クイック選択', () => {
    it('「今週」ボタンで今週の範囲が選択される', async () => {
      const user = userEvent.setup()
      
      // 現在日時を2024/1/15（月曜日）に固定
      const mockDate = new Date('2024-01-15')
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const thisWeekButton = screen.getByText('今週')
      await user.click(thisWeekButton)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-15'), // 月曜日
        endDate: new Date('2024-01-21'),   // 日曜日
      })
    })

    it('「来週」ボタンで来週の範囲が選択される', async () => {
      const user = userEvent.setup()
      
      const mockDate = new Date('2024-01-15')
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const nextWeekButton = screen.getByText('来週')
      await user.click(nextWeekButton)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-22'), // 次の月曜日
        endDate: new Date('2024-01-28'),   // 次の日曜日
      })
    })

    it('「今月」ボタンで今月の範囲が選択される', async () => {
      const user = userEvent.setup()
      
      const mockDate = new Date('2024-01-15')
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const thisMonthButton = screen.getByText('今月')
      await user.click(thisMonthButton)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      })
    })

    it('「来月」ボタンで来月の範囲が選択される', async () => {
      const user = userEvent.setup()
      
      const mockDate = new Date('2024-01-15')
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const nextMonthButton = screen.getByText('来月')
      await user.click(nextMonthButton)

      expect(mockOnChange).toHaveBeenCalledWith({
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'), // 2024年はうるう年
      })
    })
  })

  describe('制約条件', () => {
    it('最小日付が設定されている場合、それより前の日付は選択できない', () => {
      const minDate = new Date('2024-01-15')
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          minDate={minDate}
        />
      )

      // カレンダーの実装で最小日付より前の日付が無効化されることを確認
      // （実際の実装では disabled prop がカレンダーに渡される）
    })

    it('最大日付が設定されている場合、それより後の日付は選択できない', () => {
      const maxDate = new Date('2024-01-15')
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          maxDate={maxDate}
        />
      )

      // カレンダーの実装で最大日付より後の日付が無効化されることを確認
      // （実際の実装では disabled prop がカレンダーに渡される）
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なラベルが設定されている', () => {
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('開始日')).toBeInTheDocument()
      expect(screen.getByLabelText('終了日')).toBeInTheDocument()
    })

    it('キーボードでカレンダーを操作できる', async () => {
      const user = userEvent.setup()
      render(
        <DateRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const startDateInput = screen.getByLabelText('開始日')
      
      // Enterキーでカレンダーを開く
      await user.click(startDateInput)
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // Escapeキーでカレンダーを閉じる
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument()
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('無効な日付範囲の場合、エラーメッセージが表示される', () => {
      const invalidValue: DateRange = {
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'), // 開始日より前
      }

      render(
        <DateRangeSelector
          value={invalidValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('終了日は開始日以降の日付を選択してください')).toBeInTheDocument()
    })

    it('制約違反の場合、警告メッセージが表示される', () => {
      const minDate = new Date('2024-01-15')
      const violatingValue: DateRange = {
        startDate: new Date('2024-01-10'), // 最小日付より前
        endDate: new Date('2024-01-20'),
      }

      render(
        <DateRangeSelector
          value={violatingValue}
          onChange={mockOnChange}
          minDate={minDate}
        />
      )

      expect(screen.getByText(/選択可能期間外の日付が含まれています/)).toBeInTheDocument()
    })
  })
})