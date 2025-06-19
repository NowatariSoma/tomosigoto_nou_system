'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Calendar, FileText, Eye, Trash2, Clock, User, FolderOpen, Plus, Settings } from 'lucide-react';

// プロジェクト一覧用のサイドバー
function ProjectSidebar({ isMobileOpen, onMobileClose }: { isMobileOpen?: boolean; onMobileClose?: () => void }) {
  const router = useRouter();
  const pathname = '/history'; // 現在のパス

  const handleNavigateAndClose = (path: string) => {
    router.push(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // Mobile overlay
  if (isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
        <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50 md:hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">プロジェクト管理</h2>
                  <p className="text-xs text-gray-500">SlideHub</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                プロジェクト
              </div>
              
              <button
                onClick={() => handleNavigateAndClose('/history')}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav active-nav"
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">すべてのプロジェクト</span>
              </button>
              
              <button
                onClick={() => handleNavigateAndClose('/upload')}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">新規プロジェクト</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">プロジェクト管理</h2>
            <p className="text-xs text-gray-500">SlideHub</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          プロジェクト
        </div>
        
        <button
          onClick={() => router.push('/history')}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav active-nav"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="ml-3">すべてのプロジェクト</span>
        </button>
        
        <button
          onClick={() => router.push('/upload')}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="ml-3">新規プロジェクト</span>
        </button>
      </div>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  author: string;
  diffCount: number;
  lastModified: string;
  status: 'active' | 'archived' | 'draft';
}

export default function ProjectListPage() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // 模擬データ
  useEffect(() => {
    const mockData: Project[] = [
      {
        id: '1',
        name: '2024年度プレゼンテーション',
        description: '年度末の業績報告プレゼンテーション資料の差分管理',
        createdAt: '2024-01-15T10:30:00Z',
        author: 'user@example.com',
        diffCount: 5,
        lastModified: '2024-01-20T14:30:00Z',
        status: 'active',
      },
      {
        id: '2',
        name: '新商品企画書',
        description: '春の新商品ラインナップ企画書の版管理',
        createdAt: '2024-01-10T16:45:00Z',
        author: 'user@example.com',
        diffCount: 3,
        lastModified: '2024-01-18T09:15:00Z',
        status: 'active',
      },
      {
        id: '3',
        name: '売上報告書_Q4',
        description: 'Q4売上報告書の差分確認プロジェクト',
        createdAt: '2024-01-05T09:15:00Z',
        author: 'user@example.com',
        diffCount: 2,
        lastModified: '2024-01-15T11:20:00Z',
        status: 'archived',
      },
    ];

    setTimeout(() => {
      setProjectList(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleViewProject = (id: string) => {
    router.push(`/project/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      setProjectList(prev => prev.filter(item => item.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            アクティブ
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            アーカイブ
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            下書き
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <ProjectSidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <ProjectSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 container mx-auto px-4 py-8 bg-white">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                プロジェクト一覧
              </h1>
              <p className="text-gray-600">
                PowerPoint差分比較プロジェクトを管理できます
              </p>
            </div>
            <Button onClick={() => router.push('/upload')}>
              <Plus className="w-4 h-4 mr-2" />
              新規プロジェクト
            </Button>
          </div>

          {projectList.length === 0 ? (
            <Card className="bg-white border border-gray-200">
              <CardContent className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  プロジェクトがありません
                </h3>
                <p className="text-gray-500 mb-4">
                  まだプロジェクトを作成していません
                </p>
                <Button onClick={() => router.push('/upload')}>
                  <Plus className="w-4 h-4 mr-2" />
                  最初のプロジェクトを作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projectList.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.name}
                          </h3>
                          {getStatusBadge(project.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>作成: {formatDate(project.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>更新: {formatDate(project.lastModified)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{project.diffCount}回の差分</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{project.author}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project.id)}
                          className="hover-nav"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          プロジェクトを開く
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          className="hover-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 統計情報 */}
          {projectList.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <FolderOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">総プロジェクト数</p>
                      <p className="text-2xl font-bold text-gray-900">{projectList.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">アクティブプロジェクト</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {projectList.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">総差分数</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {projectList.reduce((sum, p) => sum + p.diffCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 