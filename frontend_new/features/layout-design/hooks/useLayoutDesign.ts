'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutElement, ToolType } from '../types';

export const useLayoutDesign = () => {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<LayoutElement[]>([
    {
      id: 'laser-1',
      type: 'equipment',
      x: 100,
      y: 150,
      width: 120,
      height: 80,
      label: 'レーザ加工機',
      color: '#3B82F6'
    },
    {
      id: 'conveyor-1',
      type: 'equipment',
      x: 250,
      y: 150,
      width: 200,
      height: 40,
      label: 'コンベア',
      color: '#10B981'
    }
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCanvasClick = (e: React.MouseEvent<SVGElement>) => {
    if (selectedTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement: LayoutElement = {
      id: `element-${Date.now()}`,
      type: selectedTool === 'rectangle' ? 'rectangle' : 'circle',
      x: x - 50,
      y: y - 25,
      width: selectedTool === 'rectangle' ? 100 : 50,
      height: selectedTool === 'rectangle' ? 50 : 50,
      label: selectedTool === 'rectangle' ? '作業台' : '支柱',
      color: '#6B7280'
    };

    setElements(prev => [...prev, newElement]);
    setSelectedTool('select');
  };

  const handleElementClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(id);
  };

  const handleDeleteSelected = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const handleSaveLayout = () => {
    // TODO: Save layout to backend
    console.log('Saving layout:', elements);
  };

  const handleExportImage = () => {
    // TODO: Export as image
    console.log('Exporting layout as image');
  };

  const handleComplete = () => {
    // TODO: Complete the project
    router.push('/projects');
  };

  return {
    selectedTool,
    setSelectedTool,
    elements,
    selectedElement,
    setSelectedElement,
    isDragging,
    setIsDragging,
    handleCanvasClick,
    handleElementClick,
    handleDeleteSelected,
    handleSaveLayout,
    handleExportImage,
    handleComplete
  };
}; 