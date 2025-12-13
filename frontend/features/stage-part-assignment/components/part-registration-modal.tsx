'use client';

import { useState, useEffect } from 'react';
import { Performance, Grade, Part } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Input } from '@/components/ui/inputs/input';
import { Button } from '@/components/ui/forms/button';
import { Checkbox } from '@/components/ui/inputs/checkbox';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  performance: Performance | null;
}

export function PartRegistrationModal({ 
  isOpen, 
  onClose, 
  performance 
}: PartRegistrationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localGrades, setLocalGrades] = useState<Grade[]>([]);

  // Initialize local grades when performance changes
  useEffect(() => {
    if (performance) {
      setLocalGrades(performance.grades);
    }
  }, [performance]);

  const toggleGradeExpansion = (gradeId: string) => {
    setLocalGrades(prev => 
      prev.map(grade => 
        grade.id === gradeId 
          ? { ...grade, expanded: !grade.expanded }
          : grade
      )
    );
  };

  const togglePartSelection = (gradeId: string, partId: string) => {
    setLocalGrades(prev => 
      prev.map(grade => 
        grade.id === gradeId 
          ? {
              ...grade,
              parts: grade.parts.map(part => 
                part.id === partId 
                  ? { ...part, selected: !part.selected }
                  : part
              )
            }
          : grade
      )
    );
  };

  const filteredGrades = localGrades.map(grade => ({
    ...grade,
    parts: grade.parts.filter(part => 
      part.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }));

  if (!performance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {performance.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
            <Input
              placeholder="パートを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grades List */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-md">
            {filteredGrades.map((grade, index) => (
              <div key={grade.id} className={cn(
                "border-b border-gray-300 last:border-b-0"
              )}>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto rounded-none hover:bg-blue-50"
                  onClick={() => toggleGradeExpansion(grade.id)}
                >
                  <span className="font-medium">{grade.name}</span>
                  {grade.expanded ? (
                    <ChevronUp className="h-4 w-4 text-black" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-black" />
                  )}
                </Button>
                
                {grade.expanded && grade.parts.length > 0 && (
                  <div className="px-4 pb-4 bg-gray-50">
                    <div className="space-y-3">
                      {grade.parts.map((part) => (
                        <div key={part.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={part.id}
                            checked={part.selected}
                            onCheckedChange={() => togglePartSelection(grade.id, part.id)}
                            className="border-2 border-gray-400 data-[state=checked]:bg-black data-[state=checked]:border-black"
                          />
                          <label 
                            htmlFor={part.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {part.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
              登録
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}