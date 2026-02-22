import { Loader2 } from 'lucide-react';
import { MemberSummary } from '@/features/member-management/types';
import {
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
  ROLE_BUTTON_STYLES,
  INSTRUCTOR_BADGE_STYLES,
  INSTRUCTOR_BUTTON_STYLES,
  roleOptions,
  instructorOptions,
} from '@/features/member-management/constants';
import { formatRelativeLastActive } from '@/shared/utils/format';
import { Button } from '@/components/ui/forms/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/data-display/table';

type MemberTableProps = {
  members: MemberSummary[];
  isLoading: boolean;
  isEditMode: boolean;
  resolveDraftRole: (member: MemberSummary) => MemberSummary['role'];
  resolveDraftInstructor: (member: MemberSummary) => boolean;
  updateDraft: (memberId: string, updates: { role?: MemberSummary['role']; is_instructor?: boolean }) => void;
};

export function MemberTable({
  members,
  isLoading,
  isEditMode,
  resolveDraftRole,
  resolveDraftInstructor,
  updateDraft,
}: MemberTableProps) {
  const renderRoleCell = (member: MemberSummary) => {
    const currentRole = resolveDraftRole(member);

    if (!isEditMode) {
      return (
        <span className={ROLE_BADGE_STYLES[currentRole]}>
          {ROLE_LABELS[currentRole]}
        </span>
      );
    }

    return (
      <div className="flex gap-1.5">
        {roleOptions.map(option => {
          const isActive = currentRole === option;
          const styles = isActive ? ROLE_BUTTON_STYLES[option].active : ROLE_BUTTON_STYLES[option].inactive;
          return (
            <Button
              key={option}
              type="button"
              variant="outline"
              onClick={() => updateDraft(member.id, { role: option })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
            >
              {ROLE_LABELS[option]}
            </Button>
          );
        })}
      </div>
    );
  };

  const renderInstructorCell = (member: MemberSummary) => {
    const currentInstructor = resolveDraftInstructor(member);

    if (!isEditMode) {
      const variant = currentInstructor ? 'instructor' : 'member';
      return (
        <span className={INSTRUCTOR_BADGE_STYLES[variant]}>
          {currentInstructor ? '指導者' : '一般'}
        </span>
      );
    }

    return (
      <div className="flex gap-1.5">
        {instructorOptions.map(option => {
          const variant = option.value ? 'instructor' : 'member';
          const isActive = currentInstructor === option.value;
          const styles = isActive ? INSTRUCTOR_BUTTON_STYLES[variant].active : INSTRUCTOR_BUTTON_STYLES[variant].inactive;
          return (
            <Button
              key={option.label}
              type="button"
              variant="outline"
              onClick={() => updateDraft(member.id, { is_instructor: option.value })}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="hidden md:block">
      <Table className="min-w-full divide-y divide-blue-200">
        <TableHeader className="bg-blue-100">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-1/3">メンバー</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-1/4">ロール</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider w-1/4">指導者</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">最終アクティブ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-blue-100">
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="px-6 py-16 text-center text-black">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-black" />
                  <p>読み込み中...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="px-6 py-16 text-center text-black">
                条件に一致するメンバーがいません
              </TableCell>
            </TableRow>
          ) : (
            members.map(member => (
              <TableRow key={member.id} className="hover:bg-blue-50 transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-black">{member.name}</span>
                    <span className="text-xs text-black">{member.email}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 align-top">
                  {renderRoleCell(member)}
                </TableCell>
                <TableCell className="px-6 py-4 align-top">
                  {renderInstructorCell(member)}
                </TableCell>
                <TableCell className="px-6 py-4 align-top">
                  <span className="text-sm text-black">{formatRelativeLastActive(member.last_active_at)}</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
