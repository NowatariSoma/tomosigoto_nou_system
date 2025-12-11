'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Checkbox } from '@/components/ui/inputs/checkbox';
import { Search } from 'lucide-react';
import { Part, Member } from '../types';

interface MemberRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: Part | null;
  onConfirm: (partId: number, selectedMembers: Member[]) => void;
}

export function MemberRegistrationModal({
  isOpen,
  onClose,
  selectedPart,
  onConfirm,
}: MemberRegistrationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localMembers, setLocalMembers] = useState<Member[]>([]);

  // Initialize local members when part changes
  useEffect(() => {
    if (selectedPart) {
      setLocalMembers([...selectedPart.members]);
    }
  }, [selectedPart]);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    return localMembers.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localMembers, searchQuery]);

  const handleMemberToggle = (memberId: number) => {
    setLocalMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId
          ? { ...member, isSelected: !member.isSelected }
          : member
      )
    );
  };

  const handleConfirm = () => {
    if (selectedPart) {
      const selectedMembers = localMembers.filter(member => member.isSelected);
      onConfirm(selectedPart.id, selectedMembers);
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to original state
    if (selectedPart) {
      setLocalMembers([...selectedPart.members]);
    }
    setSearchQuery('');
    onClose();
  };

  if (!selectedPart) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-4">
            {selectedPart.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="メンバーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Members List */}
          <div className="border border-gray-300 rounded-lg p-4 h-64 overflow-y-auto">
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={member.isSelected}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                    className="w-5 h-5 border-2 border-gray-400 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor={`member-${member.id}`}
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    {member.name}
                  </label>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  該当するメンバーが見つかりません
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 py-3 border-2 border-blue-300 text-black rounded-full hover:bg-blue-50 transition-colors"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-full transition-colors"
            >
              確定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}