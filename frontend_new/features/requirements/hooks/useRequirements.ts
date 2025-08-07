'use client';

import { useState } from 'react';
import { RequirementItem, CustomerInfo, NewRequirement, RequirementStep } from '../types';

export const useRequirements = () => {
  const [currentStep, setCurrentStep] = useState<RequirementStep>('hearing');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    currentProcess: '',
    challenges: '',
    goals: ''
  });
  
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [newRequirement, setNewRequirement] = useState<NewRequirement>({
    category: 'functional',
    title: '',
    description: '',
    priority: 'medium'
  });

  const addRequirement = () => {
    if (newRequirement.title && newRequirement.description) {
      const requirement: RequirementItem = {
        id: Date.now().toString(),
        ...newRequirement,
        status: 'pending'
      };
      setRequirements([...requirements, requirement]);
      setNewRequirement({
        category: 'functional',
        title: '',
        description: '',
        priority: 'medium'
      });
    }
  };

  const updateRequirementStatus = (id: string, status: RequirementItem['status']) => {
    setRequirements(requirements.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    currentStep,
    setCurrentStep,
    customerInfo,
    setCustomerInfo,
    requirements,
    newRequirement,
    setNewRequirement,
    addRequirement,
    updateRequirementStatus,
    getPriorityColor
  };
}; 