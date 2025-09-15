import React, { useState, useEffect } from 'react';
import { Group, GroupCreate, GroupUpdate } from '@/features/practice-slots/types/groups';
import { Part, PartCreate, PartUpdate } from '@/features/practice-slots/types/parts';
import { groupsAPI } from '@/lib/api/groups';
import { partsAPI } from '@/lib/api/parts';
import { cn } from '@/lib/utils';

interface EditGroupsPartsProps {
  className?: string;
}

export const EditGroupsParts: React.FC<EditGroupsPartsProps> = ({ className }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'parts'>('groups');

  // 編集状態
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);

  // フォームデータ
  const [groupForm, setGroupForm] = useState<GroupCreate>({
    name: '',
    display_name: '',
    color: '#3B82F6',
    is_active: true,
    sort_order: 0
  });
  const [partForm, setPartForm] = useState<PartCreate>({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  // モックデータ
  const mockGroups: Group[] = [
    { id: '1', name: 'A', display_name: 'グループA', color: '#3B82F6', is_active: true, sort_order: 1 },
    { id: '2', name: 'B', display_name: 'グループB', color: '#10B981', is_active: true, sort_order: 2 },
    { id: '3', name: 'C', display_name: 'グループC', color: '#F59E0B', is_active: true, sort_order: 3 },
    { id: '4', name: 'D', display_name: 'グループD', color: '#EF4444', is_active: true, sort_order: 4 },
    { id: '5', name: 'E', display_name: 'グループE', color: '#8B5CF6', is_active: true, sort_order: 5 }
  ];

  const mockParts: Part[] = [
    { id: '1', name: '○○パート', display_name: '○○パート', description: 'メインのパート練習', is_active: true, sort_order: 1 },
    { id: '2', name: '××パート', display_name: '××パート', description: 'サブのパート練習', is_active: true, sort_order: 2 },
    { id: '3', name: '△△パート', display_name: '△△パート', description: '補助のパート練習', is_active: true, sort_order: 3 },
    { id: '4', name: '集合', display_name: '集合・挨拶', description: '練習開始時の集合', is_active: true, sort_order: 4 },
    { id: '5', name: '準備', display_name: '準備', description: '練習前の準備時間', is_active: true, sort_order: 5 },
    { id: '6', name: '整上', display_name: '整上・挨拶', description: '練習終了時の整上', is_active: true, sort_order: 6 }
  ];

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsResponse, partsResponse] = await Promise.all([
        groupsAPI.getAllGroups(),
        partsAPI.getAllParts()
      ]);

      // グループデータの処理
      if (groupsResponse.success && groupsResponse.data) {
        if (groupsResponse.data.length > 0) {
          setGroups(groupsResponse.data);
        } else {
          // データベースにデータがない場合は空配列を設定
          setGroups([]);
          console.info('No groups found in database');
        }
      } else {
        console.error('Groups API error:', groupsResponse);
        setError('グループデータの取得に失敗しました。');
        setGroups([]);
      }
      
      // パートデータの処理
      if (partsResponse.success && partsResponse.data) {
        if (partsResponse.data.length > 0) {
          setParts(partsResponse.data);
        } else {
          // データベースにデータがない場合は空配列を設定
          setParts([]);
          console.info('No parts found in database');
        }
      } else {
        console.error('Parts API error:', partsResponse);
        if (!error) {
          setError('パートデータの取得に失敗しました。');
        }
        setParts([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました。バックエンドサーバーが起動しているか確認してください。');
      setGroups([]);
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // グループ操作
  const handleCreateGroup = async () => {
    try {
      const response = await groupsAPI.createGroup(groupForm);
      if (response.success) {
        await fetchData();
        setShowGroupForm(false);
        setGroupForm({
          name: '',
          display_name: '',
          color: '#3B82F6',
          is_active: true,
          sort_order: 0
        });
      } else {
        setError(response.error || 'グループの作成に失敗しました');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      setError('グループの作成に失敗しました');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup?.id) return;
    try {
      const updateData: GroupUpdate = {
        name: groupForm.name,
        display_name: groupForm.display_name,
        color: groupForm.color,
        is_active: groupForm.is_active,
        sort_order: groupForm.sort_order
      };
      const response = await groupsAPI.updateGroup(editingGroup.id, updateData);
      if (response.success) {
        await fetchData();
        setEditingGroup(null);
        setShowGroupForm(false);
        setGroupForm({
          name: '',
          display_name: '',
          color: '#3B82F6',
          is_active: true,
          sort_order: 0
        });
      } else {
        setError(response.error || 'グループの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating group:', err);
      setError('グループの更新に失敗しました');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('このグループを削除しますか？')) return;
    try {
      const response = await groupsAPI.deleteGroup(id);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || 'グループの削除に失敗しました');
      }
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('グループの削除に失敗しました');
    }
  };

  // パート操作
  const handleCreatePart = async () => {
    try {
      const response = await partsAPI.createPart(partForm);
      if (response.success) {
        await fetchData();
        setShowPartForm(false);
        setPartForm({
          name: '',
          display_name: '',
          description: '',
          is_active: true,
          sort_order: 0
        });
      } else {
        setError(response.error || 'パートの作成に失敗しました');
      }
    } catch (err) {
      console.error('Error creating part:', err);
      setError('パートの作成に失敗しました');
    }
  };

  const handleUpdatePart = async () => {
    if (!editingPart?.id) return;
    try {
      const updateData: PartUpdate = {
        name: partForm.name,
        display_name: partForm.display_name,
        description: partForm.description,
        is_active: partForm.is_active,
        sort_order: partForm.sort_order
      };
      const response = await partsAPI.updatePart(editingPart.id, updateData);
      if (response.success) {
        await fetchData();
        setEditingPart(null);
        setShowPartForm(false);
        setPartForm({
          name: '',
          display_name: '',
          description: '',
          is_active: true,
          sort_order: 0
        });
      } else {
        setError(response.error || 'パートの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating part:', err);
      setError('パートの更新に失敗しました');
    }
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm('このパートを削除しますか？')) return;
    try {
      const response = await partsAPI.deletePart(id);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || 'パートの削除に失敗しました');
      }
    } catch (err) {
      console.error('Error deleting part:', err);
      setError('パートの削除に失敗しました');
    }
  };

  // 編集開始
  const startEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      display_name: group.display_name,
      color: group.color,
      is_active: group.is_active,
      sort_order: group.sort_order
    });
    setShowGroupForm(true);
  };

  const startEditPart = (part: Part) => {
    setEditingPart(part);
    setPartForm({
      name: part.name,
      display_name: part.display_name,
      description: part.description || '',
      is_active: part.is_active,
      sort_order: part.sort_order
    });
    setShowPartForm(true);
  };

  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-6", className)}>
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-lg p-6", className)}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">グループ・パート管理</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* タブ */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'groups'
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
        >
          グループ管理
        </button>
        <button
          onClick={() => setActiveTab('parts')}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            activeTab === 'parts'
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
        >
          パート管理
        </button>
      </div>

      {/* グループ管理 */}
      {activeTab === 'groups' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">グループ一覧</h3>
            <button
              onClick={() => {
                setEditingGroup(null);
                setGroupForm({
                  name: '',
                  display_name: '',
                  color: '#3B82F6',
                  is_active: true,
                  sort_order: groups.length
                });
                setShowGroupForm(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              新規グループ追加
            </button>
          </div>

          {/* グループ一覧 */}
          <div className="space-y-2 mb-4">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">{group.display_name}</span>
                  <span className="text-sm text-gray-500">({group.name})</span>
                  {!group.is_active && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">無効</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditGroup(group)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id!)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* グループフォーム */}
          {showGroupForm && (
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold mb-3">
                {editingGroup ? 'グループ編集' : '新規グループ追加'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                  <input
                    type="text"
                    value={groupForm.display_name}
                    onChange={(e) => setGroupForm({ ...groupForm, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: グループA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
                  <input
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">並び順</label>
                  <input
                    type="number"
                    value={groupForm.sort_order}
                    onChange={(e) => setGroupForm({ ...groupForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  id="group-active"
                  checked={groupForm.is_active}
                  onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="group-active" className="text-sm text-gray-700">有効</label>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingGroup ? '更新' : '作成'}
                </button>
                <button
                  onClick={() => {
                    setShowGroupForm(false);
                    setEditingGroup(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* パート管理 */}
      {activeTab === 'parts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">パート一覧</h3>
            <button
              onClick={() => {
                setEditingPart(null);
                setPartForm({
                  name: '',
                  display_name: '',
                  description: '',
                  is_active: true,
                  sort_order: parts.length
                });
                setShowPartForm(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              新規パート追加
            </button>
          </div>

          {/* パート一覧 */}
          <div className="space-y-2 mb-4">
            {parts.map((part) => (
              <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{part.display_name}</span>
                  <span className="text-sm text-gray-500">({part.name})</span>
                  {part.description && (
                    <span className="text-sm text-gray-600">{part.description}</span>
                  )}
                  {!part.is_active && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">無効</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditPart(part)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeletePart(part.id!)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* パートフォーム */}
          {showPartForm && (
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold mb-3">
                {editingPart ? 'パート編集' : '新規パート追加'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <input
                    type="text"
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: パートA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                  <input
                    type="text"
                    value={partForm.display_name}
                    onChange={(e) => setPartForm({ ...partForm, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: パートA"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                  <textarea
                    value={partForm.description}
                    onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="パートの説明を入力してください"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">並び順</label>
                  <input
                    type="number"
                    value={partForm.sort_order}
                    onChange={(e) => setPartForm({ ...partForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  id="part-active"
                  checked={partForm.is_active}
                  onChange={(e) => setPartForm({ ...partForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="part-active" className="text-sm text-gray-700">有効</label>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={editingPart ? handleUpdatePart : handleCreatePart}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingPart ? '更新' : '作成'}
                </button>
                <button
                  onClick={() => {
                    setShowPartForm(false);
                    setEditingPart(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
