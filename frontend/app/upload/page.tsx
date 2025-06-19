'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pptxFiles = droppedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.pptx')
    );
    
    if (pptxFiles.length > 0) {
      setFiles(prev => [...prev, ...pptxFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const pptxFiles = selectedFiles.filter(file => 
        file.name.toLowerCase().endsWith('.pptx')
      );
      setFiles(prev => [...prev, ...pptxFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadStatus('idle');
    
    try {
      // TODO: API呼び出しを実装
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬アップロード
      setUploadStatus('success');
      
      // 成功後、履歴画面に遷移
      setTimeout(() => {
        router.push('/history');
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 container mx-auto px-4 py-8 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PowerPointファイルアップロード
            </h1>
            <p className="text-gray-600">
              比較したいPowerPointファイル(.pptx)をアップロードしてください
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* ドラッグ&ドロップエリア */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>ファイル選択</CardTitle>
                <CardDescription>
                  PowerPointファイル(.pptx)をドラッグ&ドロップするか、クリックして選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    ファイルをドロップするか、クリックして選択
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    .pptxファイルのみ対応
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pptx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      ファイルを選択
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* 選択されたファイル一覧 */}
            {files.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>選択されたファイル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          削除
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* アップロードボタン */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? '処理中...' : 'アップロードして差分を生成'}
                  </Button>

                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>アップロードが完了しました。履歴画面に移動します...</span>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-5 w-5" />
                      <span>アップロードに失敗しました。もう一度お試しください。</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ヘルプ情報 */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>使用方法</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 比較したいPowerPointファイルを複数選択できます</p>
                  <p>• ファイルサイズは1つあたり最大100MBまで対応</p>
                  <p>• アップロード後、自動で差分が生成されます</p>
                  <p>• 生成された差分は履歴画面で確認できます</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 