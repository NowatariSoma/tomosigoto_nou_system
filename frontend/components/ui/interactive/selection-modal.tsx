'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/forms/button';
import { cn } from '@/lib/utils';

export interface SelectionModalItem {
  id: string;
  [key: string]: any;
}

interface SelectionModalProps<T extends SelectionModalItem> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: T[]) => void;
  items: T[];
  selectedItems: T[];
  title?: string;
  columns?: number;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  getItemLabel?: (item: T) => string;
  getItemSubLabel?: (item: T) => string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  selectedCountText?: (count: number) => string;
  className?: string;
}

export function SelectionModal<T extends SelectionModalItem>({
  isOpen,
  onClose,
  onConfirm,
  items,
  selectedItems,
  title = '選択',
  columns = 3,
  renderItem,
  getItemLabel,
  getItemSubLabel,
  confirmButtonText = '確定',
  cancelButtonText = 'キャンセル',
  selectedCountText = (count) => `${count}個を選択中`,
  className,
}: SelectionModalProps<T>) {
  const [tempSelectedItems, setTempSelectedItems] = useState<T[]>(selectedItems);

  // モーダルが開かれるたびに現在の選択状態を更新
  useEffect(() => {
    if (isOpen) {
      setTempSelectedItems(selectedItems);
    }
  }, [isOpen, selectedItems]);

  const handleItemToggle = (item: T) => {
    const isCurrentlySelected = tempSelectedItems.some(i => i.id === item.id);

    if (isCurrentlySelected) {
      setTempSelectedItems(tempSelectedItems.filter(i => i.id !== item.id));
    } else {
      setTempSelectedItems([...tempSelectedItems, item]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedItems);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedItems(selectedItems); // 元の状態に戻す
    onClose();
  };

  const isItemSelected = (itemId: string) => {
    return tempSelectedItems.some(i => i.id === itemId);
  };

  const defaultRenderItem = (item: T, isSelected: boolean) => {
    const label = getItemLabel ? getItemLabel(item) : (item as any).name || item.id;
    const subLabel = getItemSubLabel ? getItemSubLabel(item) : null;

    return (
      <>
        <div className="truncate">{label}</div>
        {subLabel && (
          <div className="text-xs text-gray-500 mt-1">{subLabel}</div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-blue-600 rounded-full" />
        )}
      </>
    );
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-3';

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={cn("max-w-2xl max-h-[80vh] overflow-hidden", className)}>
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className={`grid ${gridColsClass} gap-3 p-1`}>
            {items.map((item) => {
              const isSelected = isItemSelected(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemToggle(item)}
                  className={cn(
                    "relative px-4 py-6 rounded-xl border-2 transition-all duration-200",
                    "text-center font-medium text-sm",
                    isSelected
                      ? "bg-blue-100 border-blue-400 text-black shadow-md"
                      : "bg-white border-gray-200 text-black hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  {renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedCountText(tempSelectedItems.length)}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              {cancelButtonText}
            </Button>
            <Button
              onClick={handleConfirm}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
