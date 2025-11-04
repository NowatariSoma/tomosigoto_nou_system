import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIdealSchedule } from '../hooks';
import { IdealScheduleData, AbsentMember } from '../types/schedule';
import { InstructorDisplay } from './InstructorDisplay';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/overlays/dialog';

interface ScheduleTableProps {
  className?: string;
  currentDate: Date;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  className,
  currentDate
}) => {
  // 理想的な形式のスケジュール管理フック
  const { idealData, loading, error, fetchIdealScheduleByDate } = useIdealSchedule();
  // 認証情報を取得
  const { isAdmin } = useAuth();

  /**
   * 時間文字列からslot_orderを計算する
   * バックエンドの_calculate_slot_time関数の逆算
   */
  const calculateSlotOrder = (timeStr: string, scheduleData: IdealScheduleData): number => {
    if (!scheduleData?.schedule_info) return 1;

    try {
      const startTime = new Date(`2000-01-01T${scheduleData.schedule_info.start_time}`);
      const endTime = new Date(`2000-01-01T${scheduleData.schedule_info.end_time}`);
      const targetTime = new Date(`2000-01-01T${timeStr}:00`);

      const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const timeSlots = Object.keys(scheduleData?.time_schedule || {}).length;
      const slotDuration = timeSlots > 0 ? totalMinutes / timeSlots : 60;
      
      const elapsedMinutes = (targetTime.getTime() - startTime.getTime()) / (1000 * 60);
      const slotOrder = Math.floor(elapsedMinutes / slotDuration) + 1;
      
      return Math.max(1, slotOrder);
    } catch (error) {
      console.warn('slot_orderの計算に失敗:', error);
      return 1;
    }
  };

  // 日付が変更されたときにAPIからデータを取得
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0];
    console.log('ScheduleTable - 日付変更:', dateString);
    fetchIdealScheduleByDate(dateString);
  }, [currentDate, fetchIdealScheduleByDate]);

  const handleCellClick = (time: string, venueId: string, parts: any[]) => {
    console.log('ScheduleTable - セルクリック:', { time, venueId, parts });
  };

  const handlePartClick = (e: React.MouseEvent, part: any) => {
    e.stopPropagation();
    console.log('パートクリック:', part);
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  // 備考編集用の状態
  const [editingNotes, setEditingNotes] = useState<{ attendanceId: string; notes: string } | null>(null);

  // ローディング状態管理
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null);

  // モーダル表示用の状態
  const [selectedPart, setSelectedPart] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 欠席メンバーのステータス変更ハンドラー
  const handleAbsentMemberStatusChange = async (
    member: AbsentMember,
    newStatus: 'present' | 'absent' | 'late' | 'no_show'
  ) => {
    if (updatingAttendance === member.attendance_id) {
      return; // 既に更新中
    }

    setUpdatingAttendance(member.attendance_id);
    try {
      const { attendanceService } = await import('../services');
      await attendanceService.updateAttendance(member.attendance_id, {
        status: newStatus,
      });
      // データを再取得
      const dateString = currentDate.toISOString().split('T')[0];
      await fetchIdealScheduleByDate(dateString);
    } catch (error) {
      console.error('出欠ステータスの更新に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '出欠ステータスの更新に失敗しました';
      alert(errorMessage);
    } finally {
      setUpdatingAttendance(null);
    }
  };

  // 備考編集ハンドラー
  const handleNotesEdit = async (attendanceId: string, notes: string) => {
    if (updatingAttendance === attendanceId) {
      return; // 既に更新中
    }

    // バリデーション
    if (notes && notes.length > 500) {
      alert('備考は500文字以内で入力してください');
      return;
    }

    setUpdatingAttendance(attendanceId);
    try {
      const { attendanceService } = await import('../services');
      await attendanceService.updateAttendance(attendanceId, {
        notes: notes.trim() || undefined,
      });
      setEditingNotes(null);
      // データを再取得
      const dateString = currentDate.toISOString().split('T')[0];
      await fetchIdealScheduleByDate(dateString);
    } catch (error) {
      console.error('備考の更新に失敗しました:', error);
      const errorMessage = error instanceof Error ? error.message : '備考の更新に失敗しました';
      alert(errorMessage);
    } finally {
      setUpdatingAttendance(null);
    }
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">スケジュール詳細を読み込み中...</div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  // データがない場合の表示
  if (!idealData || !idealData.venues || !Array.isArray(idealData.venues)) {
    return (
      <div className={cn("bg-white rounded-lg shadow-lg p-8 text-center", className)}>
        <div className="text-gray-500">スケジュールデータがありません</div>
      </div>
    );
  }

  // 時間スロットを取得
  const timeSlots = Object.keys(idealData?.time_schedule || {}).sort();
  
  // デバッグ: 会場データを確認
  console.log('会場データ:', idealData?.venues);
  console.log('会場の詳細:', idealData?.venues?.map(venue => ({ id: venue.id, name: venue.name, priority: venue.priority, color: venue.color })));
  
  // 重複するvenue.idをチェック
  const venueIds = idealData?.venues?.map(venue => venue?.id) || [];
  const uniqueVenueIds = Array.from(new Set(venueIds));
  if (venueIds.length !== uniqueVenueIds.length) {
    console.warn('重複するvenue.idが検出されました:', venueIds);
    console.warn('重複するID:', venueIds.filter((id, index) => venueIds.indexOf(id) !== index));
  }

  // 重複を除去した会場データを取得
  const uniqueVenues = idealData?.venues?.filter((venue, index, self) => 
    index === self.findIndex(v => v?.id === venue?.id)
  ) || [];

  return (
    <div className={cn("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
      {/* テーブルヘッダー */}
      <div className="flex">
        <div className="w-24 px-4 py-3 bg-gray-900 text-sm font-semibold text-white border-r border-b border-gray-600 hover:bg-gray-800 transition-colors">時間</div>
        <div className="flex-1 bg-gray-900 py-3 px-4 flex border-b border-gray-600">
          {uniqueVenues.map((venue) => (
            <div key={venue?.id || 'unknown'} className="flex-1 text-sm font-semibold text-white text-center hover:bg-gray-800 transition-colors">
              {venue?.name || `会場${venue?.id?.slice(-4) || 'unknown'}`}
            </div>
          ))}
        </div>
      </div>

      {/* テーブルボディ */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-gray-100">
                <td className="w-24 px-4 py-3 text-sm font-medium text-white bg-gray-900 align-top border-r border-gray-600 hover:bg-gray-800 transition-colors">
                  {time}
                </td>
                {uniqueVenues.map((venue) => {
                  const parts = idealData.time_schedule?.[time]?.[venue?.id] || [];
                  // デバッグ: 欠席メンバーデータを確認
                  if (parts.length > 0) {
                    console.log('Parts data for', time, venue?.id, ':', {
                      part_name: parts[0].part_name,
                      absent_members: parts[0].absent_members,
                      absent_members_length: parts[0].absent_members?.length
                    });
                  }
                  return (
                    <td
                      key={`${time}-${venue?.id || 'unknown'}`}
                      className={cn(
                        "px-2 py-2 border-r border-gray-200 last:border-r-0 min-h-[80px] align-top",
                        "cursor-pointer transition-colors bg-white",
                        parts.length > 0 ? "hover:bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onClick={() => handleCellClick(time, venue?.id || '', parts)}
                    >
                      {parts.length > 0 ? (
                        <div
                          className="p-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all"
                          onClick={(e) => handlePartClick(e, parts[0])}
                        >
                          {/* セッションタイトル */}
                          {parts[0].session_title && (
                            <div className="text-xs font-semibold text-blue-700 mb-1">
                              {parts[0].session_title}
                            </div>
                          )}
                          {/* パート名 */}
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {parts[0].part_name}
                          </div>
                          <InstructorDisplay
                            scheduleId={idealData?.schedule_info?.id || ''}
                            slotOrder={parts[0].slot_order || calculateSlotOrder(time, idealData)}
                            fallbackInstructors={parts[0].instructors}
                            maxDisplay={2}
                          />
                          
                          {/* 欠席メンバー表示 */}
                          {parts[0].absent_members && parts[0].absent_members.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs font-medium text-red-600 mb-1">欠席メンバー:</div>
                              <div className="space-y-1">
                                {parts[0].absent_members.map((member) => (
                                  <div
                                    key={member.user_id}
                                    className={`text-xs ${
                                      isAdmin
                                        ? 'cursor-pointer hover:bg-red-50 px-1 py-0.5 rounded transition-colors'
                                        : ''
                                    }`}
                                    onClick={
                                      isAdmin && updatingAttendance !== member.attendance_id
                                        ? async (e) => {
                                            e.stopPropagation();
                                            // ステータス変更の確認
                                            const statusText = member.status === 'absent' ? '欠席' : member.status === 'late' ? '遅刻' : '無断欠席';
                                            const confirmMessage = `${member.name} (${statusText}) のステータスを「出席」に変更しますか？`;
                                            if (window.confirm(confirmMessage)) {
                                              await handleAbsentMemberStatusChange(member, 'present');
                                            }
                                          }
                                        : undefined
                                    }
                                    title={
                                      isAdmin
                                        ? 'クリックして出席に変更'
                                        : `${member.name} (${member.status === 'absent' ? '欠席' : member.status === 'late' ? '遅刻' : '無断欠席'})`
                                    }
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <span className="text-red-700">
                                          {member.name}
                                          {member.status === 'late' && ' (遅刻)'}
                                          {member.status === 'no_show' && ' (無断)'}
                                        </span>
                                        {editingNotes?.attendanceId === member.attendance_id ? (
                                          <div className="mt-1">
                                            <textarea
                                              value={editingNotes.notes}
                                              onChange={(e) => {
                                                const newNotes = e.target.value;
                                                if (newNotes.length <= 500) {
                                                  setEditingNotes({
                                                    attendanceId: member.attendance_id,
                                                    notes: newNotes,
                                                  });
                                                } else {
                                                  // 文字数制限に達した場合の視覚的フィードバック
                                                  const textarea = e.target;
                                                  textarea.style.borderColor = '#ef4444';
                                                  setTimeout(() => {
                                                    textarea.style.borderColor = '';
                                                  }, 300);
                                                }
                                              }}
                                              className="w-full text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                              rows={2}
                                              placeholder="備考を入力（最大500文字）"
                                              onClick={(e) => e.stopPropagation()}
                                              disabled={updatingAttendance === member.attendance_id}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                  e.preventDefault();
                                                  handleNotesEdit(member.attendance_id, editingNotes.notes);
                                                }
                                                if (e.key === 'Escape') {
                                                  setEditingNotes(null);
                                                }
                                              }}
                                            />
                                            <div className="flex items-center justify-between mt-1">
                                              <div className={`text-xs ${
                                                editingNotes.notes.length > 480
                                                  ? 'text-red-600 font-medium'
                                                  : editingNotes.notes.length > 450
                                                  ? 'text-orange-600 font-medium'
                                                  : 'text-gray-500'
                                              }`}>
                                                {editingNotes.notes.length}/500文字
                                              </div>
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNotesEdit(member.attendance_id, editingNotes.notes);
                                                  }}
                                                  disabled={updatingAttendance === member.attendance_id}
                                                  className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                >
                                                  {updatingAttendance === member.attendance_id ? '保存中...' : '保存'}
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingNotes(null);
                                                  }}
                                                  disabled={updatingAttendance === member.attendance_id}
                                                  className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                >
                                                  キャンセル
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {member.notes && (
                                              <div className="text-gray-500 text-xs mt-0.5">
                                                {member.notes}
                                              </div>
                                            )}
                                            {isAdmin && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingNotes({
                                                    attendanceId: member.attendance_id,
                                                    notes: member.notes || '',
                                                  });
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 ml-1 underline"
                                              >
                                                備考{member.notes ? '編集' : '追加'}
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-6">
                          空き
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* パート詳細モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedPart?.part_name || 'パート詳細'}
            </DialogTitle>
            <DialogDescription>
              {selectedPart?.session_title && (
                <span className="text-sm text-gray-600">{selectedPart.session_title}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 講師情報 */}
            {selectedPart?.instructors && selectedPart.instructors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">講師</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPart.instructors.map((instructor: string, index: number) => (
                    <span key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {instructor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 欠席メンバー */}
            {selectedPart?.absent_members && selectedPart.absent_members.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2">欠席メンバー</h3>
                <div className="space-y-2">
                  {selectedPart.absent_members.map((member: AbsentMember) => (
                    <div
                      key={member.user_id}
                      className={`p-3 border border-gray-200 rounded-lg ${
                        isAdmin
                          ? 'cursor-pointer hover:bg-red-50 transition-colors'
                          : ''
                      }`}
                      onClick={
                        isAdmin && updatingAttendance !== member.attendance_id
                          ? async () => {
                              const statusText = 
                                member.status === 'absent' ? '欠席' : 
                                member.status === 'late' ? '遅刻' : 
                                '無断欠席';
                              const confirmMessage = `${member.name} (${statusText}) のステータスを「出席」に変更しますか？`;
                              if (window.confirm(confirmMessage)) {
                                await handleAbsentMemberStatusChange(member, 'present');
                                // モーダルを閉じてデータを再取得
                                const dateString = currentDate.toISOString().split('T')[0];
                                await fetchIdealScheduleByDate(dateString);
                                // モーダルを再度開く（更新後のデータで）
                                setIsModalOpen(true);
                              }
                            }
                          : undefined
                      }
                      title={isAdmin ? 'クリックして出席に変更' : undefined}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-700">
                              {member.name}
                            </span>
                            <span className="text-xs text-red-600">
                              {member.status === 'absent' && '(欠席)'}
                              {member.status === 'late' && '(遅刻)'}
                              {member.status === 'no_show' && '(無断欠席)'}
                            </span>
                          </div>
                          
                          {/* 備考表示・編集 */}
                          {editingNotes?.attendanceId === member.attendance_id ? (
                            <div className="mt-2">
                              <textarea
                                value={editingNotes.notes}
                                onChange={(e) => {
                                  const newNotes = e.target.value;
                                  if (newNotes.length <= 500) {
                                    setEditingNotes({
                                      attendanceId: member.attendance_id,
                                      notes: newNotes,
                                    });
                                  } else {
                                    const textarea = e.target;
                                    textarea.style.borderColor = '#ef4444';
                                    setTimeout(() => {
                                      textarea.style.borderColor = '';
                                    }, 300);
                                  }
                                }}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={3}
                                placeholder="備考を入力（最大500文字）"
                                disabled={updatingAttendance === member.attendance_id}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleNotesEdit(member.attendance_id, editingNotes.notes);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingNotes(null);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between mt-1">
                                <div className={`text-xs ${
                                  editingNotes.notes.length > 480
                                    ? 'text-red-600 font-medium'
                                    : editingNotes.notes.length > 450
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-500'
                                }`}>
                                  {editingNotes.notes.length}/500文字
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleNotesEdit(member.attendance_id, editingNotes.notes);
                                      // データを再取得
                                      const dateString = currentDate.toISOString().split('T')[0];
                                      await fetchIdealScheduleByDate(dateString);
                                      // モーダルを再度開く（更新後のデータで）
                                      setIsModalOpen(true);
                                    }}
                                    disabled={updatingAttendance === member.attendance_id}
                                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                  >
                                    {updatingAttendance === member.attendance_id ? '保存中...' : '保存'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNotes(null);
                                    }}
                                    disabled={updatingAttendance === member.attendance_id}
                                    className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {member.notes && (
                                <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                                  {member.notes}
                                </div>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNotes({
                                      attendanceId: member.attendance_id,
                                      notes: member.notes || '',
                                    });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                                >
                                  備考{member.notes ? '編集' : '追加'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                欠席メンバーはいません
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

ScheduleTable.displayName = 'ScheduleTable';

export { ScheduleTable };