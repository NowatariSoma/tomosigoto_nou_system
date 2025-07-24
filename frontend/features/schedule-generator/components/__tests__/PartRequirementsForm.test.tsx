import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartRequirementsForm } from '../PartRequirementsForm'
import { Part, Venue, PartRequirements } from '../../types/generationParams'

describe('PartRequirementsForm', () => {
  const mockParts: Part[] = [
    { id: 1, name: 'ソプラノ', color: '#ff6b6b' },
    { id: 2, name: 'アルト', color: '#4ecdc4' },
    { id: 3, name: 'テナー', color: '#45b7d1' },
    { id: 4, name: 'バス', color: '#96ceb4' },
  ]

  const mockVenues: Venue[] = [
    { id: 1, name: '大ホール', capacity: 100, location: '1F', equipmentIds: [1, 2] },
    { id: 2, name: '小ホール', capacity: 50, location: '2F', equipmentIds: [1] },
    { id: 3, name: '練習室A', capacity: 20, location: '3F', equipmentIds: [2, 3] },
  ]

  const defaultRequirements: PartRequirements[] = [
    {
      partId: 1,
      frequencyPerWeek: 2,
      durationMinutes: 90,
      preferredVenueIds: [1],
      priority: 3,
      dependencies: [],
    },
    {
      partId: 2,
      frequencyPerWeek: 2,
      durationMinutes: 90,
      preferredVenueIds: [1],
      priority: 3,
      dependencies: [],
    },
  ]

  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('全パートの設定項目が表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // パート名が表示されることを確認
      expect(screen.getByText('ソプラノ')).toBeInTheDocument()
      expect(screen.getByText('アルト')).toBeInTheDocument()
      expect(screen.getByText('テナー')).toBeInTheDocument()
      expect(screen.getByText('バス')).toBeInTheDocument()
    })

    it('各パートの練習頻度設定が表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 練習頻度のラベルと入力フィールドが表示されることを確認
      const frequencyInputs = screen.getAllByLabelText(/週あたり練習回数/)
      expect(frequencyInputs).toHaveLength(mockParts.length)
    })

    it('各パートの練習時間設定が表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 練習時間のラベルと入力フィールドが表示されることを確認
      const durationInputs = screen.getAllByLabelText(/1回あたり練習時間/)
      expect(durationInputs).toHaveLength(mockParts.length)
    })

    it('優先度設定が表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 優先度のスライダーが表示されることを確認
      const prioritySliders = screen.getAllByLabelText(/優先度/)
      expect(prioritySliders).toHaveLength(mockParts.length)
    })

    it('推奨会場選択が表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 推奨会場のセクションが表示されることを確認
      expect(screen.getByText('推奨会場')).toBeInTheDocument()
    })
  })

  describe('練習頻度の変更', () => {
    it('週あたり練習回数を変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // ソプラノの練習頻度を変更
      const frequencyInput = screen.getAllByLabelText(/週あたり練習回数/)[0]
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '3')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            frequencyPerWeek: 3,
          },
          defaultRequirements[1],
        ])
      })
    })

    it('無効な値（0以下）が入力された場合、1に修正される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const frequencyInput = screen.getAllByLabelText(/週あたり練習回数/)[0]
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '0')
      
      // フィールドからフォーカスを外す
      await user.tab()

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            frequencyPerWeek: 1,
          },
          defaultRequirements[1],
        ])
      })
    })

    it('無効な値（7より大きい）が入力された場合、7に修正される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const frequencyInput = screen.getAllByLabelText(/週あたり練習回数/)[0]
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '8')
      
      await user.tab()

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            frequencyPerWeek: 7,
          },
          defaultRequirements[1],
        ])
      })
    })
  })

  describe('練習時間の変更', () => {
    it('練習時間を変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const durationInput = screen.getAllByLabelText(/1回あたり練習時間/)[0]
      await user.clear(durationInput)
      await user.type(durationInput, '120')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            durationMinutes: 120,
          },
          defaultRequirements[1],
        ])
      })
    })

    it('無効な値（30分未満）が入力された場合、30分に修正される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const durationInput = screen.getAllByLabelText(/1回あたり練習時間/)[0]
      await user.clear(durationInput)
      await user.type(durationInput, '15')
      
      await user.tab()

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            durationMinutes: 30,
          },
          defaultRequirements[1],
        ])
      })
    })

    it('無効な値（480分超過）が入力された場合、480分に修正される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const durationInput = screen.getAllByLabelText(/1回あたり練習時間/)[0]
      await user.clear(durationInput)
      await user.type(durationInput, '600')
      
      await user.tab()

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          {
            ...defaultRequirements[0],
            durationMinutes: 480,
          },
          defaultRequirements[1],
        ])
      })
    })
  })

  describe('優先度の変更', () => {
    it('優先度スライダーを変更するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const prioritySlider = screen.getAllByLabelText(/優先度/)[0]
      
      // スライダーの値を変更
      fireEvent.change(prioritySlider, { target: { value: '5' } })

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...defaultRequirements[0],
          priority: 5,
        },
        defaultRequirements[1],
      ])
    })
  })

  describe('推奨会場の変更', () => {
    it('推奨会場を選択するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 最初のパートの推奨会場設定を開く
      const venueButtons = screen.getAllByText('推奨会場設定')
      await user.click(venueButtons[0])

      // 会場のチェックボックスを選択
      const venueCheckbox = screen.getByLabelText('小ホール')
      await user.click(venueCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...defaultRequirements[0],
          preferredVenueIds: [1, 2], // 既存の1に加えて2を追加
        },
        defaultRequirements[1],
      ])
    })

    it('既に選択されている会場のチェックを外すと削除される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const venueButtons = screen.getAllByText('推奨会場設定')
      await user.click(venueButtons[0])

      // 既に選択されている「大ホール」のチェックを外す
      const venueCheckbox = screen.getByLabelText('大ホール')
      await user.click(venueCheckbox)

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...defaultRequirements[0],
          preferredVenueIds: [], // 1を削除
        },
        defaultRequirements[1],
      ])
    })
  })

  describe('依存関係設定', () => {
    it('依存関係マトリクスボタンが表示される', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      expect(screen.getByText('パート間依存関係設定')).toBeInTheDocument()
    })

    it('依存関係マトリクスを開くとパート間の関係が表示される', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const matrixButton = screen.getByText('パート間依存関係設定')
      await user.click(matrixButton)

      // マトリクス内でパート名が表示されることを確認
      await waitFor(() => {
        expect(screen.getAllByText('ソプラノ')).toHaveLength(2) // 行と列で2回表示
        expect(screen.getAllByText('アルト')).toHaveLength(2)
      })
    })

    it('依存関係を設定するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const matrixButton = screen.getByText('パート間依存関係設定')
      await user.click(matrixButton)

      // ソプラノ→アルトの「前」関係を設定
      const beforeButton = screen.getByTestId('dependency-1-2-before')
      await user.click(beforeButton)

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          ...defaultRequirements[0],
          dependencies: [
            { dependsOnPartId: 2, type: 'before' }
          ],
        },
        defaultRequirements[1],
      ])
    })
  })

  describe('フォーム検証', () => {
    it('必須項目が空の場合、エラーメッセージが表示される', async () => {
      const emptyRequirements: PartRequirements[] = [
        {
          partId: 1,
          frequencyPerWeek: 0, // 無効な値
          durationMinutes: 0,  // 無効な値
          preferredVenueIds: [],
          priority: 0, // 無効な値
          dependencies: [],
        },
      ]

      render(
        <PartRequirementsForm
          parts={[mockParts[0]]}
          value={emptyRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      expect(screen.getByText('週あたり練習回数は1〜7回で設定してください')).toBeInTheDocument()
      expect(screen.getByText('練習時間は30〜480分で設定してください')).toBeInTheDocument()
      expect(screen.getByText('優先度は1〜5で設定してください')).toBeInTheDocument()
    })

    it('推奨会場が未選択の場合、警告メッセージが表示される', () => {
      const noVenueRequirements: PartRequirements[] = [
        {
          ...defaultRequirements[0],
          preferredVenueIds: [],
        },
      ]

      render(
        <PartRequirementsForm
          parts={[mockParts[0]]}
          value={noVenueRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      expect(screen.getByText('推奨会場を最低1つ選択することをお勧めします')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なラベルとaria属性が設定されている', () => {
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      // 各入力フィールドに適切なラベルが設定されていることを確認
      const frequencyInputs = screen.getAllByLabelText(/週あたり練習回数/)
      const durationInputs = screen.getAllByLabelText(/1回あたり練習時間/)
      const prioritySliders = screen.getAllByLabelText(/優先度/)

      expect(frequencyInputs).toHaveLength(mockParts.length)
      expect(durationInputs).toHaveLength(mockParts.length)
      expect(prioritySliders).toHaveLength(mockParts.length)
    })

    it('キーボードナビゲーションが機能する', async () => {
      const user = userEvent.setup()
      render(
        <PartRequirementsForm
          parts={mockParts}
          value={defaultRequirements}
          onChange={mockOnChange}
          venues={mockVenues}
        />
      )

      const firstFrequencyInput = screen.getAllByLabelText(/週あたり練習回数/)[0]
      
      // Tabキーでフォーカス移動
      await user.tab()
      expect(firstFrequencyInput).toHaveFocus()

      // Enterキーで値変更モードに入る
      await user.keyboard('{Enter}')
      await user.clear(firstFrequencyInput)
      await user.type(firstFrequencyInput, '4')

      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})