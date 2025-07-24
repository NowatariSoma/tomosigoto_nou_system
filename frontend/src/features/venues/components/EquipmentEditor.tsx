'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2,
  Volume2,
  Lightbulb,
  Sofa,
  Trophy,
  Monitor,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EquipmentData, EquipmentItemData, EQUIPMENT_CATEGORIES } from '../types/venueForm';

interface EquipmentEditorProps {
  value: EquipmentData[];
  onChange: (data: EquipmentData[]) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

// カテゴリアイコンのマッピング
const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'audio': return Volume2;
    case 'lighting': return Lightbulb;
    case 'furniture': return Sofa;
    case 'sports': return Trophy;
    case 'tech': return Monitor;
    default: return Package;
  }
};

// 設備アイテム編集用のダイアログコンポーネント
const EquipmentItemDialog: React.FC<{
  item?: EquipmentItemData;
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: EquipmentItemData) => void;
}> = ({ item, categoryId, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<EquipmentItemData>>(() => ({
    id: item?.id || '',
    name: item?.name || '',
    category: item?.category || categoryId,
    quantity: item?.quantity || 1,
    status: item?.status || 'available',
    notes: item?.notes || ''
  }));

  const handleSave = () => {
    if (formData.name && formData.category) {
      onSave({
        id: formData.id || Date.now().toString(),
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity || 1,
        status: formData.status || 'available',
        notes: formData.notes
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? '設備を編集' : '設備を追加'}
          </DialogTitle>
          <DialogDescription>
            設備の詳細情報を入力してください
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              設備名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-3"
              placeholder="設備名を入力"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              数量
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              状態
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">利用可能</SelectItem>
                <SelectItem value="maintenance">メンテナンス中</SelectItem>
                <SelectItem value="unavailable">利用不可</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              備考
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="col-span-3"
              placeholder="備考があれば入力"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!formData.name}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const EquipmentEditor: React.FC<EquipmentEditorProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<{ item?: EquipmentItemData; categoryId: string } | null>(null);

  // カテゴリごとにグループ化された設備データ
  const groupedEquipment = useMemo(() => {
    const grouped = new Map<string, EquipmentData>();
    
    // 既存のデータからグループを作成
    value.forEach(equipData => {
      grouped.set(equipData.categoryId, equipData);
    });

    // すべてのカテゴリを含めるため、空のグループも作成
    EQUIPMENT_CATEGORIES.forEach(category => {
      if (!grouped.has(category.id)) {
        grouped.set(category.id, {
          id: category.id,
          categoryId: category.id,
          items: []
        });
      }
    });

    return grouped;
  }, [value]);

  // 検索フィルタリング
  const filteredEquipment = useMemo(() => {
    if (!searchTerm) return groupedEquipment;

    const filtered = new Map<string, EquipmentData>();
    groupedEquipment.forEach((equipData, categoryId) => {
      const filteredItems = equipData.items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredItems.length > 0) {
        filtered.set(categoryId, {
          ...equipData,
          items: filteredItems
        });
      }
    });

    return filtered;
  }, [groupedEquipment, searchTerm]);

  // カテゴリの展開/折りたたみ
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // 設備アイテムの追加・更新
  const handleSaveItem = (categoryId: string, item: EquipmentItemData) => {
    const newValue = Array.from(groupedEquipment.values()).map(equipData => {
      if (equipData.categoryId !== categoryId) return equipData;

      const existingItemIndex = equipData.items.findIndex(existing => existing.id === item.id);
      let newItems;

      if (existingItemIndex >= 0) {
        // 既存アイテムの更新
        newItems = [...equipData.items];
        newItems[existingItemIndex] = item;
      } else {
        // 新規アイテムの追加
        newItems = [...equipData.items, item];
      }

      return {
        ...equipData,
        items: newItems
      };
    });

    onChange(newValue.filter(equipData => equipData.items.length > 0));
  };

  // 設備アイテムの削除
  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const newValue = Array.from(groupedEquipment.values()).map(equipData => {
      if (equipData.categoryId !== categoryId) return equipData;

      return {
        ...equipData,
        items: equipData.items.filter(item => item.id !== itemId)
      };
    });

    onChange(newValue.filter(equipData => equipData.items.length > 0));
  };

  // ステータスのバッジ色
  const getStatusBadgeVariant = (status: EquipmentItemData['status']) => {
    switch (status) {
      case 'available': return 'default';
      case 'maintenance': return 'secondary';
      case 'unavailable': return 'destructive';
    }
  };

  // ステータスのテキスト
  const getStatusText = (status: EquipmentItemData['status']) => {
    switch (status) {
      case 'available': return '利用可能';
      case 'maintenance': return 'メンテナンス中';
      case 'unavailable': return '利用不可';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">設備情報</h2>
        </div>
      </div>

      {/* 検索バー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">設備検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="設備名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* 設備カテゴリ一覧 */}
      <div className="space-y-4">
        {EQUIPMENT_CATEGORIES.map(category => {
          const equipData = filteredEquipment.get(category.id);
          const isExpanded = expandedCategories.includes(category.id);
          const IconComponent = getCategoryIcon(category.id);
          const itemCount = equipData?.items.length || 0;

          return (
            <Card key={category.id}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>
                        {itemCount}件の設備が登録されています
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem({ categoryId: category.id });
                    }}
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  {itemCount === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      設備が登録されていません
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {equipData!.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <Badge variant={getStatusBadgeVariant(item.status)}>
                                {getStatusText(item.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>数量: {item.quantity}</span>
                              {item.notes && <span>備考: {item.notes}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem({ item, categoryId: category.id })}
                              disabled={disabled}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(category.id, item.id)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* 設備編集ダイアログ */}
      {editingItem && (
        <EquipmentItemDialog
          item={editingItem.item}
          categoryId={editingItem.categoryId}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onSave={(item) => handleSaveItem(editingItem.categoryId, item)}
        />
      )}
    </div>
  );
};