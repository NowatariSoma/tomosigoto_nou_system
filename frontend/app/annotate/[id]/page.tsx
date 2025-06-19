'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { ArrowLeft, MessageCircle, Send, Edit, Trash2, User, Clock, X, FileText, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';

// 注釈・コメント画面用のサイドバー
function AnnotationSidebar({ isMobileOpen, onMobileClose }: { isMobileOpen?: boolean; onMobileClose?: () => void }) {
  const router = useRouter();
  const params = useParams();

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
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">注釈・コメント</h2>
                  <p className="text-xs text-gray-500">SlideHub</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileClose}
                className="w-8 h-8 p-0 hover-icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ナビゲーション
              </div>
              
              <button
                onClick={() => handleNavigateAndClose('/history')}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">プロジェクト一覧</span>
              </button>
              
              <button
                onClick={() => handleNavigateAndClose(`/diff/${params.id}`)}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">差分詳細</span>
              </button>
              
              <button
                onClick={() => handleNavigateAndClose(`/annotate/${params.id}`)}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav active-nav"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3">注釈・コメント</span>
              </button>
              
              <div className="pt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  コメント機能
                </div>
                
                <div className="px-3 py-2 text-xs text-gray-600 bg-blue-50 rounded-md">
                  <p className="font-medium mb-1">新規コメント</p>
                  <p>スライド上をクリックして追加</p>
                </div>
                
                <div className="px-3 py-2 mt-2 text-xs text-gray-600 bg-green-50 rounded-md">
                  <p className="font-medium mb-1">ステータス管理</p>
                  <p>未解決 / 解決済み</p>
                </div>
              </div>
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
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">注釈・コメント</h2>
            <p className="text-xs text-gray-500">SlideHub</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ナビゲーション
        </div>
        
        <button
          onClick={() => router.push('/history')}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="ml-3">プロジェクト一覧</span>
        </button>
        
        <button
          onClick={() => router.push(`/diff/${params.id}`)}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav"
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="ml-3">差分詳細</span>
        </button>
        
        <button
          onClick={() => router.push(`/annotate/${params.id}`)}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover-nav active-nav"
        >
          <MessageCircle className="w-4 h-4 flex-shrink-0" />
          <span className="ml-3">注釈・コメント</span>
        </button>
        
        <div className="pt-4">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            コメント機能
          </div>
          
          <div className="px-3 py-2 text-xs text-gray-600 bg-blue-50 rounded-md">
            <p className="font-medium mb-1">新規コメント</p>
            <p>スライド上をクリックして追加</p>
          </div>
          
          <div className="px-3 py-2 mt-2 text-xs text-gray-600 bg-green-50 rounded-md">
            <p className="font-medium mb-1">ステータス管理</p>
            <p>未解決 / 解決済み</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  x: number;
  y: number;
  resolved: boolean;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface SlideAnnotation {
  slideId: string;
  slideNumber: number;
  title: string;
  comments: Comment[];
}

export default function AnnotatePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slideId = searchParams.get('slide');
  
  const [annotation, setAnnotation] = useState<SlideAnnotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // 模擬データ
  useEffect(() => {
    const mockData: SlideAnnotation = {
      slideId: slideId || '1',
      slideNumber: 3,
      title: 'スライド3: 売上グラフ',
      comments: [
        {
          id: '1',
          author: 'user@example.com',
          content: 'このグラフの数値は最新のものでしょうか？',
          createdAt: '2024-01-15T10:30:00Z',
          x: 300,
          y: 150,
          resolved: false,
          replies: [
            {
              id: '1-1',
              author: 'admin@example.com',
              content: 'はい、昨日更新されたデータです。',
              createdAt: '2024-01-15T11:00:00Z',
            },
          ],
        },
        {
          id: '2',
          author: 'reviewer@example.com',
          content: 'グラフの色分けが見づらいです。',
          createdAt: '2024-01-15T14:20:00Z',
          x: 450,
          y: 200,
          resolved: true,
          replies: [],
        },
      ],
    };

    setTimeout(() => {
      setAnnotation(mockData);
      setLoading(false);
    }, 1000);
  }, [slideId]);

  const handleAddComment = () => {
    if (!newComment.trim() || !annotation) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'current-user@example.com',
      content: newComment,
      createdAt: new Date().toISOString(),
      x: 200,
      y: 100,
      resolved: false,
      replies: [],
    };

    setAnnotation(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null);
    setNewComment('');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim() || !annotation) return;

    const reply: Reply = {
      id: Date.now().toString(),
      author: 'current-user@example.com',
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    setAnnotation(prev => prev ? {
      ...prev,
      comments: prev.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    } : null);
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleResolveComment = (commentId: string) => {
    if (!annotation) return;

    setAnnotation(prev => prev ? {
      ...prev,
      comments: prev.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, resolved: !comment.resolved }
          : comment
      )
    } : null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!annotation) return;

    if (confirm('このコメントを削除しますか？')) {
      setAnnotation(prev => prev ? {
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId)
      } : null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AnnotationSidebar 
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

  if (!annotation) {
    return (
      <div className="min-h-screen bg-white flex">
        <AnnotationSidebar 
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleMobileSidebarClose}
        />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-gray-500">注釈データが見つかりません</p>
              <Button onClick={() => router.push('/history')} className="mt-4">
                履歴に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <AnnotationSidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 flex bg-white">
          {/* Left panel - Comments list */}
          <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/diff/${params.id}`)}
                  className="hover-nav"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  差分に戻る
                </Button>
              </div>
              
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                {annotation.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  {annotation.comments.filter(c => !c.resolved).length}件 未解決
                </span>
                <span>
                  {annotation.comments.filter(c => c.resolved).length}件 解決済み
                </span>
              </div>
            </div>

            {/* New comment form */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">新しいコメント</h3>
              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="コメントを入力..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  コメントを追加
                </Button>
              </div>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-2">
                {annotation.comments.map((comment) => (
                  <Card
                    key={comment.id}
                    className={`cursor-pointer transition-all hover-card ${
                      selectedComment === comment.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'bg-white border border-gray-200'
                    } ${comment.resolved ? 'opacity-75' : ''}`}
                    onClick={() => setSelectedComment(comment.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author}
                          </span>
                          {comment.resolved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveComment(comment.id);
                            }}
                            className="h-6 w-6 p-0 hover-success"
                            title={comment.resolved ? "未解決に戻す" : "解決済みにする"}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComment(comment.id);
                            }}
                            className="h-6 w-6 p-0 hover-danger"
                            title="削除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        {comment.replies.length > 0 && (
                          <span>{comment.replies.length}件の返信</span>
                        )}
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-700">{reply.author}</span>
                                <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-600">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form */}
                      {replyingTo === comment.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="返信を入力..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAddReply(comment.id)}
                              disabled={!replyContent.trim()}
                              size="sm"
                              className="text-xs"
                            >
                              返信
                            </Button>
                            <Button
                              onClick={() => setReplyingTo(null)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingTo(comment.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs hover-nav"
                        >
                          返信
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Main view area - Slide with comment markers */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  スライド表示・注釈
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>未解決</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>解決済み</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide display area */}
            <div className="flex-1 p-4 bg-gray-50 overflow-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-4 h-full relative">
                <div className="bg-gray-100 rounded-lg h-96 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500">スライド画像</p>
                  </div>
                  
                  {/* Comment markers */}
                  {annotation.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all hover:scale-110 ${
                        comment.resolved 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      } ${
                        selectedComment === comment.id 
                          ? 'ring-2 ring-blue-500 scale-125' 
                          : ''
                      }`}
                      style={{
                        left: `${comment.x}px`,
                        top: `${comment.y}px`,
                      }}
                      onClick={() => setSelectedComment(comment.id)}
                      title={comment.content}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>スライド上の赤いマーカーは未解決のコメント、緑のマーカーは解決済みのコメントを表示しています。</p>
                  <p>マーカーをクリックするとコメントを確認できます。</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 