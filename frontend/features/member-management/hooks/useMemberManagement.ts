import { useCallback, useEffect, useMemo, useState } from 'react';
import { memberManagementService } from '../services/member-management-service';
import { MemberSummary } from '../types';

export const useMemberManagement = () => {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await memberManagementService.listMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = useCallback(async (memberId: string, newRole: MemberSummary['role']) => {
    const target = members.find(member => member.id === memberId);
    if (!target || target.role === newRole) return;

    const previousMembers = [...members];
    setMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );

    try {
      await memberManagementService.updateRole(memberId, { role: newRole });
    } catch (err) {
      setMembers(previousMembers);
      setError(err instanceof Error ? err.message : '権限の更新に失敗しました');
    }
  }, [members]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    const previousMembers = [...members];
    setMembers(prev => prev.filter(member => member.id !== memberId));
    try {
      await memberManagementService.deleteMember(memberId);
    } catch (err) {
      setMembers(previousMembers);
      setError(err instanceof Error ? err.message : 'アカウントの削除に失敗しました');
    }
  }, [members]);

  const adminCount = useMemo(
    () => members.filter(member => member.role === 'admin').length,
    [members]
  );

  return {
    members,
    isLoading,
    error,
    adminCount,
    fetchMembers,
    handleRoleChange,
    handleRemoveMember,
  };
};

