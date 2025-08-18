'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { Layout, Square, Circle, ArrowRight, Move, Trash2, Save, Download } from 'lucide-react';
import { useLayoutDesign } from '../hooks/useLayoutDesign';

export function LayoutDesignPage() {
  const {
    selectedTool,
    setSelectedTool,
    elements,
    selectedElement,
    handleCanvasClick,
    handleElementClick,
    handleDeleteSelected,
    handleSaveLayout,
    handleExportImage,
    handleComplete
  } = useLayoutDesign();

  return (
    <AppTemplate
      title="レイアウト設計"
      description="装置配置の最適化と簡易レイアウト図作成"
      maxWidth="7xl"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Layout className="w-8 h-8 text-red-600" />
          <div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="destructive">難易度: 高</Badge>
              <div className="text-gray-600">
                配置要素: {elements.length}個
              </div>
            </div>
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
    </AppTemplate>
  );
} 