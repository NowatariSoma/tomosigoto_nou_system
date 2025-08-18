import { 
  HearingInput, 
  AIAnalysisResult, 
  AIQuestion, 
  AIResponse, 
  RequirementsDocument,
  ExtractedKeyword,
  MappedRequirement
} from '../types';

export class HearingAssistantService {
  // キーワード辞書（実際の実装では外部ファイルやDBから取得）
  private static keywordMappings: Record<string, { category: string; field: string; value: string }> = {
    '切断': { category: '加工モード', field: 'processingMode', value: '切断' },
    'カット': { category: '加工モード', field: 'processingMode', value: '切断' },
    'レーザー': { category: '加工モード', field: 'processingMode', value: 'レーザー加工' },
    'SUS': { category: '材料', field: 'targetMaterials', value: 'ステンレス(SUS304)' },
    'ステンレス': { category: '材料', field: 'targetMaterials', value: 'ステンレス' },
    'アルミ': { category: '材料', field: 'targetMaterials', value: 'アルミニウム' },
    '精度': { category: '精度', field: 'processingPrecision', value: '' },
    '±': { category: '精度', field: 'processingPrecision', value: '' },
    'MES': { category: '通信', field: 'communicationFeatures', value: '生産管理システム連携' },
    '生産管理': { category: '通信', field: 'communicationFeatures', value: '生産管理システム連携' },
    '予算': { category: '制約', field: 'budgetConstraints', value: '' },
    'コスト': { category: '制約', field: 'budgetConstraints', value: '' },
    '安全': { category: '規格', field: 'safetyRequirements', value: '安全規格対応' },
    'ISO': { category: '規格', field: 'legalRequirements', value: 'ISO規格対応' }
  };

  static async analyzeHearingInput(input: HearingInput): Promise<AIAnalysisResult> {
    // 実際の実装では、ここでAI APIを呼び出す
    // 今回はモックデータを返す
    await this.delay(2000); // 分析処理をシミュレート

    const text = `${input.rawText} ${input.meetingNotes || ''} ${input.additionalInfo || ''}`;
    const extractedKeywords = this.extractKeywords(text);
    const mappedRequirements = this.mapRequirements(extractedKeywords, text);
    
    return {
      extractedKeywords,
      mappedRequirements,
      confidence: 0.85,
      suggestedQuestions: this.generateSuggestedQuestions(mappedRequirements)
    };
  }

  static async generateQuestions(analysisResult: AIAnalysisResult): Promise<AIQuestion[]> {
    // 実際の実装では、分析結果に基づいてAIが質問を生成
    await this.delay(1000);

    const questions: AIQuestion[] = [];
    
    // 必須項目の確認
    if (!this.hasRequirement(analysisResult.mappedRequirements, 'processingMode')) {
      questions.push({
        id: 'processing-mode',
        category: 'required',
        question: '加工モードが明確ではありません。どのような加工をご希望ですか？',
        options: ['切断', 'マーキング', '溶接', '穴あけ', 'その他'],
        relatedField: 'functionalRequirements.processingMode',
        priority: 'high'
      });
    }

    if (!this.hasRequirement(analysisResult.mappedRequirements, 'targetMaterials')) {
      questions.push({
        id: 'target-materials',
        category: 'required',
        question: '加工対象の材料を教えてください。',
        options: ['ステンレス', 'アルミニウム', '鉄', '樹脂', 'その他'],
        relatedField: 'functionalRequirements.targetMaterials',
        priority: 'high'
      });
    }

    // 深掘り質問
    if (this.hasKeyword(analysisResult.extractedKeywords, '高速')) {
      questions.push({
        id: 'processing-speed',
        category: 'clarification',
        question: '高速加工をご希望とのことですが、具体的な加工速度やタクトタイムの目標値はありますか？',
        relatedField: 'functionalRequirements.processingSpeed',
        priority: 'medium'
      });
    }

    if (this.hasKeyword(analysisResult.extractedKeywords, '自動車')) {
      questions.push({
        id: 'automotive-standards',
        category: 'optimization',
        question: '自動車部品向けの生産設備の場合、一般的に稼働率は95%以上が求められます。この目標値でよろしいでしょうか？',
        relatedField: 'nonFunctionalRequirements.performanceRequirements.operatingRate',
        priority: 'medium'
      });
    }

    // HMI要件
    questions.push({
      id: 'hmi-requirements',
      category: 'required',
      question: 'HMI（操作画面）の要件はいかがですか？',
      options: ['タッチパネル形式', 'PCベース', '既存システムとの統合', 'シンプルな操作パネル'],
      relatedField: 'functionalRequirements.hmiRequirements',
      priority: 'medium'
    });

    // 安全要件
    questions.push({
      id: 'safety-requirements',
      category: 'validation',
      question: '安全規格について、労働安全衛生法の他に、CEマーキングやUL規格など、輸出を考慮した対応は必要ですか？',
      options: ['国内向けのみ', 'CEマーキング必要', 'UL規格必要', 'その他の規格'],
      relatedField: 'nonFunctionalRequirements.legalRequirements',
      priority: 'low'
    });

    return questions;
  }

  static async generateRequirementsDocument(
    analysisResult: AIAnalysisResult, 
    responses: AIResponse[]
  ): Promise<RequirementsDocument> {
    await this.delay(1500);

    // 分析結果と回答から要件定義書を生成
    const document: RequirementsDocument = {
      projectInfo: {
        projectName: this.extractValue(responses, 'project-name') || '新規プロジェクト',
        customerName: this.extractValue(responses, 'customer-name') || '',
        contactPerson: this.extractValue(responses, 'contact-person') || '',
        projectType: 'レーザー加工システム導入',
        targetDate: this.extractValue(responses, 'target-date') || '',
        budget: this.extractBudgetFromAnalysis(analysisResult)
      },
      functionalRequirements: {
        processingMode: this.extractArrayValue(responses, 'processing-mode') || 
                       this.extractFromMappedRequirements(analysisResult.mappedRequirements, 'processingMode'),
        targetMaterials: this.extractArrayValue(responses, 'target-materials') || 
                        this.extractFromMappedRequirements(analysisResult.mappedRequirements, 'targetMaterials'),
        processingPrecision: this.extractValue(responses, 'processing-precision') || 
                           this.extractFromMappedRequirements(analysisResult.mappedRequirements, 'processingPrecision')[0] || '',
        processingSpeed: this.extractValue(responses, 'processing-speed') || '',
        workpieceSize: this.extractValue(responses, 'workpiece-size') || '',
        communicationFeatures: this.extractArrayValue(responses, 'communication-features') || 
                              this.extractFromMappedRequirements(analysisResult.mappedRequirements, 'communicationFeatures'),
        hmiRequirements: this.extractValue(responses, 'hmi-requirements') || '',
        errorManagement: ['エラー内容の表示', 'ブザーでの通知', '履歴の自動記録']
      },
      nonFunctionalRequirements: {
        performanceRequirements: {
          operatingRate: this.extractValue(responses, 'automotive-standards') === 'はい' ? '95%以上' : '',
          mtbf: '8760時間以上（1年以上）',
          processingCapacity: this.extractValue(responses, 'processing-capacity') || ''
        },
        reliabilityRequirements: ['24時間連続運転対応', '定期メンテナンス機能'],
        safetyRequirements: this.extractArrayValue(responses, 'safety-requirements') || ['労働安全衛生法対応'],
        maintenanceRequirements: ['予防保全機能', 'リモート診断対応'],
        environmentalRequirements: ['工場環境対応（温度・湿度・振動）'],
        legalRequirements: this.extractArrayValue(responses, 'safety-requirements') || ['労働安全衛生法'],
        costRequirements: this.extractBudgetFromAnalysis(analysisResult) || ''
      },
      constraints: {
        budgetConstraints: this.extractBudgetFromAnalysis(analysisResult) || '',
        scheduleConstraints: this.extractValue(responses, 'schedule-constraints') || '',
        spaceConstraints: this.extractValue(responses, 'space-constraints') || '',
        technicalConstraints: [],
        organizationalConstraints: []
      },
      additionalInfo: {
        specialRequirements: [],
        futureExpansion: [],
        notes: '対話型ヒアリング・アシスタントにより生成された要件定義書'
      }
    };

    return document;
  }

  static async exportDocument(requirementsDoc: Partial<RequirementsDocument>, format: 'markdown' | 'pdf' | 'word'): Promise<void> {
    // 実際の実装では、指定されたフォーマットでドキュメントをエクスポート
    await this.delay(1000);
    
    const content = this.formatDocument(requirementsDoc);
    
    // ブラウザでダウンロードをトリガー
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `要件定義書.${format === 'markdown' ? 'md' : format}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // プライベートヘルパーメソッド
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static extractKeywords(text: string): ExtractedKeyword[] {
    const keywords: ExtractedKeyword[] = [];
    
    Object.entries(this.keywordMappings).forEach(([keyword, mapping]) => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push({
          keyword,
          category: mapping.category,
          confidence: 0.9,
          context: this.extractContext(text, keyword)
        });
      }
    });

    return keywords;
  }

  private static extractContext(text: string, keyword: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + keyword.length + 20);
    return text.substring(start, end);
  }

  private static mapRequirements(keywords: ExtractedKeyword[], text: string): MappedRequirement[] {
    const requirements: MappedRequirement[] = [];
    
    keywords.forEach(keyword => {
      const mapping = this.keywordMappings[keyword.keyword];
      if (mapping) {
        requirements.push({
          section: this.getSectionFromField(mapping.field),
          field: mapping.field,
          value: mapping.value || this.extractValueFromContext(text, keyword.keyword),
          confidence: keyword.confidence,
          source: keyword.context
        });
      }
    });

    return requirements;
  }

  private static getSectionFromField(field: string): string {
    if (field.startsWith('processing') || field.startsWith('target') || field.startsWith('communication') || field.startsWith('hmi') || field.startsWith('error')) {
      return '機能要件';
    }
    if (field.startsWith('performance') || field.startsWith('reliability') || field.startsWith('safety') || field.startsWith('maintenance') || field.startsWith('environmental') || field.startsWith('legal') || field.startsWith('cost')) {
      return '非機能要件';
    }
    if (field.includes('Constraints')) {
      return '制約事項';
    }
    return 'その他';
  }

  private static extractValueFromContext(text: string, keyword: string): string {
    // 精度の数値を抽出
    if (keyword === '精度' || keyword === '±') {
      const precisionMatch = text.match(/±\s*(\d+(?:\.\d+)?)\s*mm/);
      return precisionMatch ? `±${precisionMatch[1]}mm` : '';
    }
    
    // 予算の数値を抽出
    if (keyword === '予算' || keyword === 'コスト') {
      const budgetMatch = text.match(/(\d+(?:,\d+)*)\s*万円/);
      return budgetMatch ? `${budgetMatch[1]}万円` : '';
    }
    
    return '';
  }

  private static generateSuggestedQuestions(requirements: MappedRequirement[]): string[] {
    const questions = [
      '具体的な加工精度の要求値は？',
      'タクトタイムの目標値は？',
      '既存システムとの連携方法は？',
      '安全規格の対応範囲は？',
      'メンテナンス要件は？'
    ];
    
    return questions.slice(0, 3); // 最初の3つを返す
  }

  private static hasRequirement(requirements: MappedRequirement[], field: string): boolean {
    return requirements.some(req => req.field === field);
  }

  private static hasKeyword(keywords: ExtractedKeyword[], keyword: string): boolean {
    return keywords.some(kw => kw.keyword.includes(keyword));
  }

  private static extractValue(responses: AIResponse[], questionId: string): string {
    const response = responses.find(r => r.questionId === questionId);
    return response?.answer || '';
  }

  private static extractArrayValue(responses: AIResponse[], questionId: string): string[] {
    const response = responses.find(r => r.questionId === questionId);
    return response?.selectedOptions || [];
  }

  private static extractFromMappedRequirements(requirements: MappedRequirement[], field: string): string[] {
    return requirements.filter(req => req.field === field).map(req => req.value);
  }

  private static extractBudgetFromAnalysis(analysisResult: AIAnalysisResult): string {
    const budgetRequirement = analysisResult.mappedRequirements.find(req => req.field === 'budgetConstraints');
    return budgetRequirement?.value || '';
  }

  private static formatDocument(requirementsDoc: Partial<RequirementsDocument>): string {
    // Markdown形式で要件定義書をフォーマット
    let content = '# 要件定義書\n\n';
    
    if (requirementsDoc.projectInfo) {
      content += '## 1. プロジェクト基本情報\n\n';
      content += `- プロジェクト名: ${requirementsDoc.projectInfo.projectName || ''}\n`;
      content += `- 顧客名: ${requirementsDoc.projectInfo.customerName || ''}\n`;
      content += `- 担当者: ${requirementsDoc.projectInfo.contactPerson || ''}\n`;
      content += `- プロジェクト種別: ${requirementsDoc.projectInfo.projectType || ''}\n`;
      content += `- 目標納期: ${requirementsDoc.projectInfo.targetDate || ''}\n`;
      content += `- 予算: ${requirementsDoc.projectInfo.budget || ''}\n\n`;
    }
    
    if (requirementsDoc.functionalRequirements) {
      content += '## 2. 機能要件\n\n';
      content += `- 加工モード: ${requirementsDoc.functionalRequirements.processingMode?.join(', ') || ''}\n`;
      content += `- 対象材料: ${requirementsDoc.functionalRequirements.targetMaterials?.join(', ') || ''}\n`;
      content += `- 加工精度: ${requirementsDoc.functionalRequirements.processingPrecision || ''}\n`;
      content += `- 加工速度: ${requirementsDoc.functionalRequirements.processingSpeed || ''}\n`;
      content += `- ワーク寸法: ${requirementsDoc.functionalRequirements.workpieceSize || ''}\n`;
      content += `- 通信機能: ${requirementsDoc.functionalRequirements.communicationFeatures?.join(', ') || ''}\n`;
      content += `- HMI要件: ${requirementsDoc.functionalRequirements.hmiRequirements || ''}\n`;
      content += `- エラー管理: ${requirementsDoc.functionalRequirements.errorManagement?.join(', ') || ''}\n\n`;
    }
    
    // 他のセクションも同様に追加...
    
    return content;
  }
} 