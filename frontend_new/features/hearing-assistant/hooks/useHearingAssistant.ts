'use client';

import { useState, useCallback } from 'react';
import { 
  HearingStep, 
  HearingInput, 
  AIAnalysisResult, 
  AIQuestion, 
  AIResponse, 
  RequirementsDocument,
  HearingAssistantState 
} from '../types';
import { HearingAssistantService } from '../services/HearingAssistantService';

export function useHearingAssistant() {
  const [state, setState] = useState<HearingAssistantState>({
    currentStep: 'input',
    hearingInput: {
      rawText: '',
      meetingNotes: '',
      keywords: [],
      additionalInfo: ''
    },
    analysisResult: null,
    questions: [],
    responses: [],
    requirementsDocument: {},
    isLoading: false,
    error: null
  });

  const setCurrentStep = useCallback((step: HearingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const updateHearingInput = useCallback((input: Partial<HearingInput>) => {
    setState(prev => ({
      ...prev,
      hearingInput: { ...prev.hearingInput, ...input }
    }));
  }, []);

  const analyzeInput = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const analysisResult = await HearingAssistantService.analyzeHearingInput(state.hearingInput);
      const questions = await HearingAssistantService.generateQuestions(analysisResult);
      
      setState(prev => ({
        ...prev,
        analysisResult,
        questions,
        isLoading: false,
        currentStep: 'analysis'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '分析中にエラーが発生しました',
        isLoading: false
      }));
    }
  }, [state.hearingInput]);

  const startDialogue = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 'dialogue' }));
  }, []);

  const addResponse = useCallback((response: AIResponse) => {
    setState(prev => ({
      ...prev,
      responses: [...prev.responses, response]
    }));
  }, []);

  const updateResponse = useCallback((questionId: string, response: Partial<AIResponse>) => {
    setState(prev => ({
      ...prev,
      responses: prev.responses.map(r => 
        r.questionId === questionId ? { ...r, ...response } : r
      )
    }));
  }, []);

  const generateRequirementsDocument = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const document = await HearingAssistantService.generateRequirementsDocument(
        state.analysisResult!,
        state.responses
      );
      
      setState(prev => ({
        ...prev,
        requirementsDocument: document,
        isLoading: false,
        currentStep: 'preview'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '要件定義書の生成中にエラーが発生しました',
        isLoading: false
      }));
    }
  }, [state.analysisResult, state.responses]);

  const exportDocument = useCallback(async (format: 'markdown' | 'pdf' | 'word') => {
    try {
      await HearingAssistantService.exportDocument(state.requirementsDocument, format);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'エクスポート中にエラーが発生しました'
      }));
    }
  }, [state.requirementsDocument]);

  const resetAssistant = useCallback(() => {
    setState({
      currentStep: 'input',
      hearingInput: {
        rawText: '',
        meetingNotes: '',
        keywords: [],
        additionalInfo: ''
      },
      analysisResult: null,
      questions: [],
      responses: [],
      requirementsDocument: {},
      isLoading: false,
      error: null
    });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    setCurrentStep,
    updateHearingInput,
    analyzeInput,
    startDialogue,
    addResponse,
    updateResponse,
    generateRequirementsDocument,
    exportDocument,
    resetAssistant,
    
    // Computed
    canProceedToAnalysis: state.hearingInput.rawText.trim().length > 0,
    canProceedToDialogue: state.analysisResult !== null,
    canGenerateDocument: state.responses.length > 0,
    completedResponses: state.responses.length,
    totalQuestions: state.questions.length,
    progressPercentage: state.questions.length > 0 ? (state.responses.length / state.questions.length) * 100 : 0
  };
} 