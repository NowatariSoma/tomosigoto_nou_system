'use client';

import { useState } from 'react';
import { useHearingAssistant } from '../../hooks/useHearingAssistant';
import { AIQuestion, AIResponse } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Label } from '@/components/ui/inputs/label';
import { Badge } from '@/components/ui/feedback/badge';
import { 
  MessageCircle, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Clock,
  Lightbulb
} from 'lucide-react';

export function DialogueStep() {
  const { 
    questions, 
    responses, 
    addResponse, 
    updateResponse, 
    generateRequirementsDocument,
    canGenerateDocument,
    completedResponses,
    totalQuestions
  } = useHearingAssistant();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '重要';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'required': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'clarification': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'optimization': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'validation': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleOptionToggle = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];
    setSelectedOptions(newSelected);
  };

  const handleSaveResponse = () => {
    if (!currentQuestion) return;

    const response: AIResponse = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
      additionalNotes: additionalNotes || undefined
    };

    if (currentResponse) {
      updateResponse(currentQuestion.id, response);
    } else {
      addResponse(response);
    }

    // 次の質問に移動
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // 次の質問の既存回答を読み込み
      const nextQuestion = questions[currentQuestionIndex + 1];
      const nextResponse = responses.find(r => r.questionId === nextQuestion.id);
      if (nextResponse) {
        setCurrentAnswer(nextResponse.answer);
        setSelectedOptions(nextResponse.selectedOptions || []);
        setAdditionalNotes(nextResponse.additionalNotes || '');
      } else {
        setCurrentAnswer('');
        setSelectedOptions([]);
        setAdditionalNotes('');
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // 前の質問の回答を読み込み
      const prevQuestion = questions[currentQuestionIndex - 1];
      const prevResponse = responses.find(r => r.questionId === prevQuestion.id);
      if (prevResponse) {
        setCurrentAnswer(prevResponse.answer);
        setSelectedOptions(prevResponse.selectedOptions || []);
        setAdditionalNotes(prevResponse.additionalNotes || '');
      }
    }
  };

  const handleQuestionNavigation = (questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    const question = questions[questionIndex];
    const response = responses.find(r => r.questionId === question.id);
    if (response) {
      setCurrentAnswer(response.answer);
      setSelectedOptions(response.selectedOptions || []);
      setAdditionalNotes(response.additionalNotes || '');
    } else {
      setCurrentAnswer('');
      setSelectedOptions([]);
      setAdditionalNotes('');
    }
  };

  if (questions.length === 0) {
    // モック質問データを生成
    const mockQuestions = [
      {
        id: 'processing-mode',
        category: 'required' as const,
        question: '加工モードが明確ではありません。どのような加工をご希望ですか？',
        options: ['切断', 'マーキング', '溶接', '穴あけ', 'その他'],
        relatedField: 'functionalRequirements.processingMode',
        priority: 'high' as const
      },
      {
        id: 'processing-speed',
        category: 'clarification' as const,
        question: '高速加工をご希望とのことですが、具体的な加工速度やタクトタイムの目標値はありますか？',
        relatedField: 'functionalRequirements.processingSpeed',
        priority: 'medium' as const
      },
      {
        id: 'hmi-requirements',
        category: 'required' as const,
        question: 'HMI（操作画面）の要件はいかがですか？',
        options: ['タッチパネル形式', 'PCベース', '既存システムとの統合', 'シンプルな操作パネル'],
        relatedField: 'functionalRequirements.hmiRequirements',
        priority: 'medium' as const
      },
      {
        id: 'safety-requirements',
        category: 'validation' as const,
        question: '安全規格について、労働安全衛生法の他に、CEマーキングやUL規格など、輸出を考慮した対応は必要ですか？',
        options: ['国内向けのみ', 'CEマーキング必要', 'UL規格必要', 'その他の規格'],
        relatedField: 'nonFunctionalRequirements.legalRequirements',
        priority: 'low' as const
      }
    ];

    return (
      <div className="space-y-6">
        {/* モックデータ使用時の警告 */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                デモ用のサンプル質問を表示しています
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 進捗表示 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-blue-900">質問 1 / {mockQuestions.length}</h3>
                <p className="text-sm text-blue-700">回答済み: 0 件</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">0%</div>
                <div className="text-sm text-blue-700">完了</div>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }} />
            </div>
          </CardContent>
        </Card>

        {/* 質問ナビゲーション */}
        <div className="flex flex-wrap gap-2">
          {mockQuestions.map((question, index) => (
            <button
              key={question.id}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                index === 0 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* 最初の質問を表示 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(mockQuestions[0].category)}
                質問 1
              </CardTitle>
              <Badge className={getPriorityColor(mockQuestions[0].priority)}>
                {getPriorityLabel(mockQuestions[0].priority)}
              </Badge>
            </div>
            <CardDescription>
              関連項目: {mockQuestions[0].relatedField}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 質問文 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-medium">{mockQuestions[0].question}</p>
            </div>

            {/* 選択肢 */}
            {mockQuestions[0].options && (
              <div>
                <Label>選択肢（複数選択可）</Label>
                <div className="mt-2 space-y-2">
                  {mockQuestions[0].options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 自由回答 */}
            <div>
              <Label htmlFor="answer">詳細な回答</Label>
              <Textarea
                id="answer"
                placeholder="具体的な内容や数値、条件などを入力してください"
                rows={4}
                className="mt-2"
              />
            </div>

            {/* 補足情報 */}
            <div>
              <Label htmlFor="notes">補足・備考（任意）</Label>
              <Textarea
                id="notes"
                placeholder="追加の情報や特記事項があれば入力してください"
                rows={2}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex justify-between">
          <Button variant="outline" disabled>
            前の質問
          </Button>

          <div className="flex gap-2">
            <Button>
              次の質問
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 進捗表示 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-blue-900">質問 {currentQuestionIndex + 1} / {totalQuestions}</h3>
              <p className="text-sm text-blue-700">回答済み: {completedResponses} 件</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((completedResponses / totalQuestions) * 100)}%
              </div>
              <div className="text-sm text-blue-700">完了</div>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedResponses / totalQuestions) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 質問ナビゲーション */}
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const hasResponse = responses.some(r => r.questionId === question.id);
          return (
            <button
              key={question.id}
              onClick={() => handleQuestionNavigation(index)}
              className={`
                w-8 h-8 rounded-full text-sm font-medium transition-all duration-200
                ${index === currentQuestionIndex 
                  ? 'bg-blue-600 text-white' 
                  : hasResponse 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }
              `}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* 現在の質問 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(currentQuestion.category)}
              質問 {currentQuestionIndex + 1}
            </CardTitle>
            <Badge className={getPriorityColor(currentQuestion.priority)}>
              {getPriorityLabel(currentQuestion.priority)}
            </Badge>
          </div>
          <CardDescription>
            関連項目: {currentQuestion.relatedField}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 質問文 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-900 font-medium">{currentQuestion.question}</p>
          </div>

          {/* 選択肢（ある場合） */}
          {currentQuestion.options && (
            <div>
              <Label>選択肢（複数選択可）</Label>
              <div className="mt-2 space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={() => handleOptionToggle(option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 自由回答 */}
          <div>
            <Label htmlFor="answer">詳細な回答</Label>
            <Textarea
              id="answer"
              value={currentAnswer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
              placeholder="具体的な内容や数値、条件などを入力してください"
              rows={4}
              className="mt-2"
            />
          </div>

          {/* 補足情報 */}
          <div>
            <Label htmlFor="notes">補足・備考（任意）</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
              placeholder="追加の情報や特記事項があれば入力してください"
              rows={2}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          前の質問
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleSaveResponse}
            disabled={!currentAnswer.trim() && selectedOptions.length === 0}
          >
            {currentQuestionIndex === questions.length - 1 ? '回答を保存' : '次の質問'}
          </Button>

          {completedResponses === totalQuestions && (
            <Button
              onClick={generateRequirementsDocument}
              disabled={!canGenerateDocument}
              className="btn-primary flex items-center gap-2"
            >
              要件定義書を生成
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 