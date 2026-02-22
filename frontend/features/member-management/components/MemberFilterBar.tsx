import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';
import { instructorFilterOptions } from '@/features/member-management/constants';

type MemberFilterBarProps = {
  roleFilter: 'all' | 'admin' | 'basic' | 'viewer';
  setRoleFilter: (value: 'all' | 'admin' | 'basic' | 'viewer') => void;
  instructorFilter: 'all' | 'only' | 'exclude';
  setInstructorFilter: (value: 'all' | 'only' | 'exclude') => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

export function MemberFilterBar({
  roleFilter,
  setRoleFilter,
  instructorFilter,
  setInstructorFilter,
  searchQuery,
  setSearchQuery,
}: MemberFilterBarProps) {
  return (
    <div className="card-blue p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-black">
        <Filter className="h-4 w-4 text-black" />
        絞り込み
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">ロール</label>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
              <SelectItem value="basic">基本権限</SelectItem>
              <SelectItem value="viewer">閲覧のみ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">指導者</label>
          <Select value={instructorFilter} onValueChange={(value) => setInstructorFilter(value as typeof instructorFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              {instructorFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">キーワード</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="氏名・メールで検索"
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
