// Step types
export type HearingStep = 'input' | 'analysis' | 'dialogue' | 'preview';

// Input data types
export interface HearingInput {
  rawText: string;
  meetingNotes?: string;
  keywords?: string[];
  additionalInfo?: string;
}

// AI Analysis result types
export interface AIAnalysisResult {
  extractedKeywords: ExtractedKeyword[];
  mappedRequirements: MappedRequirement[];
  confidence: number;
  suggestedQuestions: string[];
}

export interface ExtractedKeyword {
  keyword: string;
  category: string;
  confidence: number;
  context: string;
}

export interface MappedRequirement {
  section: string;
  field: string;
  value: string;
  confidence: number;
  source: string;
}

// Dialogue types
export interface AIQuestion {
  id: string;
  category: 'required' | 'clarification' | 'optimization' | 'validation';
  question: string;
  options?: string[];
  relatedField: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIResponse {
  questionId: string;
  answer: string;
  selectedOptions?: string[];
  additionalNotes?: string;
}

// Requirements document types
export interface RequirementsDocument {
  // 1. プロジェクト基本情報
  projectInfo: {
    projectName: string;
    customerName: string;
    contactPerson: string;
    projectType: string;
    targetDate: string;
    budget?: string;
  };
  
  // 2. 機能要件
  functionalRequirements: {
    processingMode: string[];
    targetMaterials: string[];
    processingPrecision: string;
    processingSpeed: string;
    workpieceSize: string;
    communicationFeatures: string[];
    hmiRequirements: string;
    errorManagement: string[];
  };
  
  // 3. 非機能要件
  nonFunctionalRequirements: {
    performanceRequirements: {
      operatingRate: string;
      mtbf: string;
      processingCapacity: string;
    };
    reliabilityRequirements: string[];
    safetyRequirements: string[];
    maintenanceRequirements: string[];
    environmentalRequirements: string[];
    legalRequirements: string[];
    costRequirements: string;
  };
  
  // 4. 制約事項
  constraints: {
    budgetConstraints: string;
    scheduleConstraints: string;
    spaceConstraints: string;
    technicalConstraints: string[];
    organizationalConstraints: string[];
  };
  
  // 5. その他
  additionalInfo: {
    specialRequirements: string[];
    futureExpansion: string[];
    notes: string;
  };
}

// Hearing Assistant state
export interface HearingAssistantState {
  currentStep: HearingStep;
  hearingInput: HearingInput;
  analysisResult: AIAnalysisResult | null;
  questions: AIQuestion[];
  responses: AIResponse[];
  requirementsDocument: Partial<RequirementsDocument>;
  isLoading: boolean;
  error: string | null;
} 