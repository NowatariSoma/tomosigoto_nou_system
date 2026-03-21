import { Loader2, Trash2 } from 'lucide-react';
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

type MemberCardListProps = {
  members: MemberSummary[];
  isLoading: boolean;
  isEditMode: boolean;
  resolveDraftRole: (member: MemberSummary) => MemberSummary['role'];
  resolveDraftInstructor: (member: MemberSummary) => boolean;
  updateDraft: (memberId: string, updates: { role?: MemberSummary['role']; is_instructor?: boolean }) => void;
  onRemoveMember: (memberId: string) => void;
};

export function MemberCardList({
  members,
  isLoading,
  isEditMode,
  resolveDraftRole,
  resolveDraftInstructor,
  updateDraft,
  onRemoveMember,
}: MemberCardListProps) {
  return (
    <div className="md:hidden divide-y divide-blue-200">
      {isLoading ? (
        <div className="py-10 text-center text-black">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-black mb-3" />
          読み込み中...
        </div>
      ) : members.length === 0 ? (
        <div className="py-10 text-center text-black">
          該当するメンバーがいません
        </div>
      ) : (
        members.map(member => {
          const currentRole = resolveDraftRole(member);
          const currentInstructor = resolveDraftInstructor(member);
          return (
            <div key={member.id} className="p-3">
              {isEditMode ? (
                // 編集モード：縦レイアウト
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-black">{member.name}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`${member.name}のアカウントを削除しますか？この操作は取り消せません。`)) {
                          onRemoveMember(member.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-black mb-1">ロール</p>
                    <div className="grid grid-cols-3 gap-2">
                      {roleOptions.map(option => {
                        const isActive = currentRole === option;
                        const styles = isActive ? ROLE_BUTTON_STYLES[option].active : ROLE_BUTTON_STYLES[option].inactive;
                        return (
                          <Button
                            key={option}
                            type="button"
                            variant="outline"
                            onClick={() => updateDraft(member.id, { role: option })}
                            className={`px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
                          >
                            {ROLE_LABELS[option]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-black mb-1">指導者</p>
                    <div className="grid grid-cols-2 gap-2">
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
                            className={`px-2 py-1.5 text-xs font-medium transition-colors ${styles}`}
                          >
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // 通常モード：横一列レイアウト
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate flex-shrink min-w-0">
                      <span className="text-sm font-semibold text-black truncate">{member.name}</span>
                      <span className="text-xs text-black whitespace-nowrap">({formatRelativeLastActive(member.last_active_at)})</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={ROLE_BADGE_STYLES[currentRole]}>
                        {ROLE_LABELS[currentRole]}
                      </span>
                      <span className={INSTRUCTOR_BADGE_STYLES[currentInstructor ? 'instructor' : 'member']}>
                        {currentInstructor ? '指導者' : '一般'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`${member.name}のアカウントを削除しますか？この操作は取り消せません。`)) {
                          onRemoveMember(member.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
