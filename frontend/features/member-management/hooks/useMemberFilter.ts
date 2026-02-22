import { useMemo, useState } from 'react';
import { MemberSummary } from '@/features/member-management/types';

export function useMemberFilter(members: MemberSummary[]) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'basic' | 'viewer'>('all');
  const [instructorFilter, setInstructorFilter] = useState<'all' | 'only' | 'exclude'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      if (instructorFilter === 'only' && !member.is_instructor) {
        return false;
      }

      if (instructorFilter === 'exclude' && member.is_instructor) {
        return false;
      }

      if (searchQuery) {
        const keyword = searchQuery.toLowerCase();
        const name = member.name?.toLowerCase() ?? '';
        const email = member.email?.toLowerCase() ?? '';
        if (!name.includes(keyword) && !email.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }, [members, roleFilter, instructorFilter, searchQuery]);

  return {
    roleFilter,
    setRoleFilter,
    instructorFilter,
    setInstructorFilter,
    searchQuery,
    setSearchQuery,
    filteredMembers,
  };
}
