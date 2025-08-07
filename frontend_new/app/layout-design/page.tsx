'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { Layout, Square, Circle, ArrowRight, Move, RotateCw, Trash2, Save, Download, Image } from 'lucide-react';

interface LayoutElement {
  id: string;
  type: 'rectangle' | 'circle' | 'equipment';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}

export default function LayoutDesignPage() {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle'>('select');
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

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

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

  return (
    <div className="min-h-screen bg-white">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 w-full px-4 py-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Layout className="w-8 h-8 text-red-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    レイアウト設計
                  </h1>
                  <p className="text-gray-600">
                    装置配置の最適化と簡易レイアウト図作成
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="destructive">難易度: 高</Badge>
                <div className="text-gray-600">
                  配置要素: {elements.length}個
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ツールパレット */}
              <div className="lg:col-span-1">
                <Card className="bg-white border border-gray-200 sticky top-4">
                  <CardHeader>
                    <CardTitle>ツール</CardTitle>
                    <CardDescription>
                      図形を選択して配置
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant={selectedTool === 'select' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool('select')}
                    >
                      <Move className="w-4 h-4 mr-2" />
                      選択・移動
                    </Button>
                    
                    <Button
                      variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool('rectangle')}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      四角形
                    </Button>
                    
                    <Button
                      variant={selectedTool === 'circle' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool('circle')}
                    >
                      <Circle className="w-4 h-4 mr-2" />
                      円形
                    </Button>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">選択中の要素</p>
                      {selectedElement ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {elements.find(el => el.id === selectedElement)?.label}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700"
                            onClick={handleDeleteSelected}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            削除
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">要素が選択されていません</p>
                      )}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSaveLayout}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleExportImage}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        画像出力
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* キャンバス */}
              <div className="lg:col-span-4">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle>レイアウト図</CardTitle>
                    <CardDescription>
                      クリックして図形を配置、要素をクリックして選択
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <svg
                        width="100%"
                        height="500"
                        viewBox="0 0 800 500"
                        className="bg-gray-50 rounded cursor-crosshair"
                        onClick={handleCanvasClick}
                      >
                        {/* Grid */}
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Elements */}
                        {elements.map((element) => {
                          const isSelected = selectedElement === element.id;
                          
                          if (element.type === 'circle') {
                            return (
                              <g key={element.id}>
                                <circle
                                  cx={element.x + element.width / 2}
                                  cy={element.y + element.height / 2}
                                  r={element.width / 2}
                                  fill={element.color}
                                  fillOpacity="0.7"
                                  stroke={isSelected ? '#EF4444' : element.color}
                                  strokeWidth={isSelected ? 3 : 2}
                                  className="cursor-pointer hover:fill-opacity-80"
                                  onClick={(e) => handleElementClick(element.id, e)}
                                />
                                <text
                                  x={element.x + element.width / 2}
                                  y={element.y + element.height / 2}
                                  textAnchor="middle"
                                  dy="0.3em"
                                  className="text-xs fill-white font-medium pointer-events-none"
                                >
                                  {element.label}
                                </text>
                              </g>
                            );
                          }

                          return (
                            <g key={element.id}>
                              <rect
                                x={element.x}
                                y={element.y}
                                width={element.width}
                                height={element.height}
                                fill={element.color}
                                fillOpacity="0.7"
                                stroke={isSelected ? '#EF4444' : element.color}
                                strokeWidth={isSelected ? 3 : 2}
                                rx="4"
                                className="cursor-pointer hover:fill-opacity-80"
                                onClick={(e) => handleElementClick(element.id, e)}
                              />
                              <text
                                x={element.x + element.width / 2}
                                y={element.y + element.height / 2}
                                textAnchor="middle"
                                dy="0.3em"
                                className="text-xs fill-white font-medium pointer-events-none"
                              >
                                {element.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <p>💡 ヒント:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>ツールを選択してキャンバスをクリックすると図形を配置できます</li>
                        <li>配置した要素をクリックすると選択できます</li>
                        <li>選択した要素は削除や編集が可能です</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 完了ボタン */}
            <div className="mt-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Layout className="w-5 h-5" />
                    レイアウト設計完了
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        レイアウト設計が完了しました。プロジェクトを完了して次のステップに進みましょう。
                      </p>
                      <p className="text-xs text-gray-600">
                        ※ 後で修正することも可能です
                      </p>
                    </div>
                    <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
                      プロジェクト完了
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 