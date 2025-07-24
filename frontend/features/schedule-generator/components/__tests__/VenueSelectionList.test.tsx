import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VenueSelectionList } from '../VenueSelectionList'
import { Venue, EquipmentType } from '../../types/generationParams'

// ドラッグアンドドロップのモック
const mockDataTransfer = {
  getData: jest.fn(),
  setData: jest.fn(),
  dropEffect: 'move',
  effectAllowed: 'move',
  files: [],
  items: [],
  types: [],
}

Object.defineProperty(window, 'DragEvent', {
  value: class DragEvent extends Event {
    constructor(type: string, eventInitDict?: DragEventInit) {
      super(type, eventInitDict)
      this.dataTransfer = mockDataTransfer
    }
    dataTransfer = mockDataTransfer
  },
})

describe('VenueSelectionList', () => {
  const mockVenues: Venue[] = [
    { 
      id: 1, 
      name: '大ホール', 
      capacity: 100, 
      location: '1F', 
      equipmentIds: [1, 2] 
    },
    { 
      id: 2, 
      name: '小ホール', 
      capacity: 50, 
      location: '2F', 
      equipmentIds: [1] 
    },
    { 
      id: 3, 
      name: '練習室A', 
      capacity: 20, 
      location: '3F', 
      equipmentIds: [2, 3] 
    },
    { 
      id: 4, 
      name: '練習室B', 
      capacity: 15, 
      location: '3F', 
      equipmentIds: [3] 
    },
  ]

  const mockEquipmentTypes: EquipmentType[] = [
    { id: 1, name: 'ピアノ', description: 'グランドピアノ' },
    { id: 2, name: '音響システム', description: 'マイク・スピーカー' },
    { id: 3, name: 'プロジェクター', description: '映像投影装置' },
  ]

  const defaultSelection = {
    selectedVenues: [1, 2],
    venueOrder: [1, 2],
  }

  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDataTransfer.getData.mockClear()
    mockDataTransfer.setData.mockClear()
  })

  describe('レンダリング', () => {
    it('会場一覧が表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      expect(screen.getByText('大ホール')).toBeInTheDocument()
      expect(screen.getByText('小ホール')).toBeInTheDocument()
      expect(screen.getByText('練習室A')).toBeInTheDocument()
      expect(screen.getByText('練習室B')).toBeInTheDocument()
    })

    it('選択済み会場にチェックマークが表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // 選択済み会場のチェックボックスがチェックされていることを確認
      const venue1Checkbox = screen.getByLabelText('大ホール')
      const venue2Checkbox = screen.getByLabelText('小ホール')
      const venue3Checkbox = screen.getByLabelText('練習室A')

      expect(venue1Checkbox).toBeChecked()
      expect(venue2Checkbox).toBeChecked()
      expect(venue3Checkbox).not.toBeChecked()
    })

    it('会場の詳細情報が表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      expect(screen.getByText('収容人数: 100人')).toBeInTheDocument()
      expect(screen.getByText('場所: 1F')).toBeInTheDocument()
      expect(screen.getByText('収容人数: 50人')).toBeInTheDocument()
      expect(screen.getByText('場所: 2F')).toBeInTheDocument()
    })

    it('設備情報が表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // 大ホールの設備（ピアノ、音響システム）が表示されることを確認
      expect(screen.getByText('ピアノ')).toBeInTheDocument()
      expect(screen.getByText('音響システム')).toBeInTheDocument()
    })

    it('フィルタ機能のUIが表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      expect(screen.getByPlaceholderText('会場名で検索...')).toBeInTheDocument()
      expect(screen.getByText('設備でフィルタ')).toBeInTheDocument()
    })
  })

  describe('会場選択', () => {
    it('会場を選択するとonChangeが呼ばれる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const venue1Checkbox = screen.getByLabelText('大ホール')
      await user.click(venue1Checkbox)

      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [1],
        order: [1],
      })
    })

    it('選択済み会場のチェックを外すと削除される', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2]}
          venueOrder={[1, 2]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const venue1Checkbox = screen.getByLabelText('大ホール')
      await user.click(venue1Checkbox)

      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [2],
        order: [2],
      })
    })

    it('複数の会場を選択できる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1]}
          venueOrder={[1]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const venue2Checkbox = screen.getByLabelText('小ホール')
      await user.click(venue2Checkbox)

      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [1, 2],
        order: [1, 2],
      })
    })
  })

  describe('優先順位の変更', () => {
    it('ドラッグアンドドロップで順序を変更できる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2, 3]}
          venueOrder={[1, 2, 3]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // 優先順位表示セクションを開く
      const priorityButton = screen.getByText('優先順位設定')
      await user.click(priorityButton)

      // ドラッグ可能な要素を取得
      const venue1Item = screen.getByTestId('draggable-venue-1')
      const venue3Item = screen.getByTestId('draggable-venue-3')

      // ドラッグ開始
      fireEvent.dragStart(venue1Item, {
        dataTransfer: mockDataTransfer,
      })
      
      expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', '1')

      // ドラッグオーバー
      fireEvent.dragOver(venue3Item, {
        dataTransfer: mockDataTransfer,
      })

      // ドロップ
      mockDataTransfer.getData.mockReturnValue('1')
      fireEvent.drop(venue3Item, {
        dataTransfer: mockDataTransfer,
      })

      // 順序が変更されることを確認
      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [1, 2, 3],
        order: [2, 3, 1], // 1が最後に移動
      })
    })

    it('上下矢印ボタンで順序を変更できる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2, 3]}
          venueOrder={[1, 2, 3]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const priorityButton = screen.getByText('優先順位設定')
      await user.click(priorityButton)

      // 2番目の会場を上に移動
      const moveUpButton = screen.getByTestId('move-up-2')
      await user.click(moveUpButton)

      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [1, 2, 3],
        order: [2, 1, 3], // 2が上に移動
      })
    })

    it('1番目の会場の上ボタンは無効になる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2]}
          venueOrder={[1, 2]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const priorityButton = screen.getByText('優先順位設定')
      await user.click(priorityButton)

      const moveUpButton = screen.getByTestId('move-up-1')
      expect(moveUpButton).toBeDisabled()
    })

    it('最後の会場の下ボタンは無効になる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2]}
          venueOrder={[1, 2]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const priorityButton = screen.getByText('優先順位設定')
      await user.click(priorityButton)

      const moveDownButton = screen.getByTestId('move-down-2')
      expect(moveDownButton).toBeDisabled()
    })
  })

  describe('フィルタ機能', () => {
    it('会場名でフィルタできる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const searchInput = screen.getByPlaceholderText('会場名で検索...')
      await user.type(searchInput, 'ホール')

      // 「ホール」を含む会場のみ表示される
      expect(screen.getByText('大ホール')).toBeInTheDocument()
      expect(screen.getByText('小ホール')).toBeInTheDocument()
      expect(screen.queryByText('練習室A')).not.toBeInTheDocument()
      expect(screen.queryByText('練習室B')).not.toBeInTheDocument()
    })

    it('設備でフィルタできる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // 設備フィルタを開く
      const equipmentFilterButton = screen.getByText('設備でフィルタ')
      await user.click(equipmentFilterButton)

      // ピアノを選択
      const pianoCheckbox = screen.getByLabelText('ピアノ')
      await user.click(pianoCheckbox)

      // ピアノがある会場のみ表示される
      expect(screen.getByText('大ホール')).toBeInTheDocument()
      expect(screen.getByText('小ホール')).toBeInTheDocument()
      expect(screen.queryByText('練習室A')).not.toBeInTheDocument()
      expect(screen.queryByText('練習室B')).not.toBeInTheDocument()
    })

    it('複数の設備でANDフィルタできる', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const equipmentFilterButton = screen.getByText('設備でフィルタ')
      await user.click(equipmentFilterButton)

      // ピアノと音響システムを選択
      const pianoCheckbox = screen.getByLabelText('ピアノ')
      const audioCheckbox = screen.getByLabelText('音響システム')
      
      await user.click(pianoCheckbox)
      await user.click(audioCheckbox)

      // 両方の設備がある会場のみ表示される（大ホールのみ）
      expect(screen.getByText('大ホール')).toBeInTheDocument()
      expect(screen.queryByText('小ホール')).not.toBeInTheDocument()
      expect(screen.queryByText('練習室A')).not.toBeInTheDocument()
      expect(screen.queryByText('練習室B')).not.toBeInTheDocument()
    })

    it('フィルタクリアボタンで全フィルタが解除される', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // フィルタを適用
      const searchInput = screen.getByPlaceholderText('会場名で検索...')
      await user.type(searchInput, 'ホール')

      const equipmentFilterButton = screen.getByText('設備でフィルタ')
      await user.click(equipmentFilterButton)
      const pianoCheckbox = screen.getByLabelText('ピアノ')
      await user.click(pianoCheckbox)

      // フィルタクリア
      const clearButton = screen.getByText('フィルタクリア')
      await user.click(clearButton)

      // 全会場が表示される
      expect(screen.getByText('大ホール')).toBeInTheDocument()
      expect(screen.getByText('小ホール')).toBeInTheDocument()
      expect(screen.getByText('練習室A')).toBeInTheDocument()
      expect(screen.getByText('練習室B')).toBeInTheDocument()
    })
  })

  describe('表示状態管理', () => {
    it('選択された会場数が表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[1, 2]}
          venueOrder={[1, 2]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      expect(screen.getByText('2件選択中')).toBeInTheDocument()
    })

    it('会場が選択されていない場合、適切なメッセージが表示される', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      expect(screen.getByText('会場が選択されていません')).toBeInTheDocument()
    })

    it('フィルタ結果が0件の場合、適切なメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      const searchInput = screen.getByPlaceholderText('会場名で検索...')
      await user.type(searchInput, '存在しない会場')

      expect(screen.getByText('検索条件に一致する会場がありません')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なaria-labelが設定されている', () => {
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={defaultSelection.selectedVenues}
          venueOrder={defaultSelection.venueOrder}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // 各会場のチェックボックスに適切なラベルが設定されていること
      expect(screen.getByLabelText('大ホール')).toBeInTheDocument()
      expect(screen.getByLabelText('小ホール')).toBeInTheDocument()
      expect(screen.getByLabelText('練習室A')).toBeInTheDocument()
      expect(screen.getByLabelText('練習室B')).toBeInTheDocument()
    })

    it('キーボードナビゲーションが機能する', async () => {
      const user = userEvent.setup()
      render(
        <VenueSelectionList
          venues={mockVenues}
          selectedVenues={[]}
          venueOrder={[]}
          onChange={mockOnChange}
          equipmentTypes={mockEquipmentTypes}
        />
      )

      // Tabキーでフォーカス移動
      await user.tab()
      const firstCheckbox = screen.getByLabelText('大ホール')
      expect(firstCheckbox).toHaveFocus()

      // Spaceキーで選択
      await user.keyboard(' ')
      expect(mockOnChange).toHaveBeenCalledWith({
        ids: [1],
        order: [1],
      })
    })
  })
})