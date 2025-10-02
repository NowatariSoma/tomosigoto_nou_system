import React, { useState } from 'react';
import { StageWithPartsAndAssignments, MemberAssignmentWithDetails } from '../types';
import { UI_TEXT } from '../constants';
import { Calendar, Theater, User, Music, ChevronDown, ChevronUp } from 'lucide-react';

interface StageAssignmentsCardProps {
  stage: StageWithPartsAndAssignments;
  onAssignmentClick: (assignment: MemberAssignmentWithDetails) => void;
}

export const StageAssignmentsCard: React.FC<StageAssignmentsCardProps> = ({ 
  stage, 
  onAssignmentClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE_PARTS = 3;
  const parts = stage.parts || [];
  const hasMoreParts = parts.length > MAX_VISIBLE_PARTS;
  const visibleParts = isExpanded ? parts : parts.slice(0, MAX_VISIBLE_PARTS);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAssignmentClick = (assignment: MemberAssignmentWithDetails) => {
    onAssignmentClick(assignment);
  };

  const getCategoryLabel = (category: 'utai' | 'mai') => {
    return category === 'utai' ? '謡' : '舞';
  };

  const getCategoryColor = (category: 'utai' | 'mai') => {
    return category === 'utai' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <Theater className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">{stage.name}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-gray-600 font-medium min-w-[80px]">日付</span>
          <span className="text-gray-500">：</span>
          <span className="text-gray-800 ml-2">
            {new Date(stage.performance_date).toLocaleDateString('ja-JP')}
          </span>
        </div>
        
        {stage.description && (
          <div className="flex items-start">
            <span className="text-gray-600 font-medium min-w-[80px] pt-1">説明</span>
            <span className="text-gray-500 pt-1">：</span>
            <span className="text-gray-800 ml-2 flex-1">{stage.description}</span>
          </div>
        )}
        
        <div className="flex items-start">
          <Music className="h-4 w-4 text-blue-600 mr-2 mt-1" />
          <span className="text-gray-600 font-medium min-w-[80px] pt-1">パート</span>
          <span className="text-gray-500 pt-1">：</span>
          <div className="ml-2 flex-1">
            <div className="space-y-3">
              {visibleParts.map((part) => (
                <div key={part.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{part.name}</h4>
                    <span className="text-sm text-gray-500">
                      {part.member_assignments.length}名の所属
                    </span>
                  </div>
                  
                  {part.member_assignments.length > 0 ? (
                    <div className="space-y-2">
                      {part.member_assignments.map((assignment) => (
                        <div 
                          key={assignment.id}
                          className="flex items-center justify-between p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleAssignmentClick(assignment)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">
                              {assignment.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({assignment.user.email})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getCategoryColor(assignment.category)}`}>
                              {getCategoryLabel(assignment.category)}
                            </span>
                            <span className="text-xs text-gray-500">
                              順序: {assignment.display_order}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">所属メンバーがいません</p>
                    </div>
                  )}
                </div>
              ))}
              
              {hasMoreParts && (
                <button
                  onClick={handleExpandClick}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      折りたたむ
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      他{parts.length - MAX_VISIBLE_PARTS}件のパートを表示
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
