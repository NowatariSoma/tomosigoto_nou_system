'use client';

import React, { useMemo } from 'react';
import { XCircle, Clock, AlertCircle } from 'lucide-react';
import { Attendance, PracticeSchedule } from '../types/attendance';

interface AttendanceSummaryProps {
  currentDate: Date;
  attendances?: Attendance[];
  practiceSchedule?: PracticeSchedule | null;
  loading?: boolean;
  error?: string | null;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  currentDate,
  attendances = [],
  practiceSchedule = null,
  loading = false,
  error = null
}) => {

  const { stats, groupedAttendances } = useMemo(() => {
    const present = attendances.filter(a => a.status === 'present');
    const absent = attendances.filter(a => a.status === 'absent');
    const late = attendances.filter(a => a.status === 'late');
    const noShow = attendances.filter(a => a.status === 'no_show');

    // 学年ごとにグループ化する関数
    const groupByYear = (items: Attendance[]) => {
      const groups: Record<string, Attendance[]> = {};

      items.forEach(item => {
        const yearKey = item.user_year !== undefined && item.user_year !== null
          ? `${item.user_year}回生`
          : '学年未登録';

        if (!groups[yearKey]) {
          groups[yearKey] = [];
        }
        groups[yearKey].push(item);
      });

      // ソート: 4回生 -> 3回生 -> 2回生 -> 1回生 -> 学年未登録
      const sortedGroups: Record<string, Attendance[]> = {};
      const yearOrder = ['4回生', '3回生', '2回生', '1回生', '学年未登録'];

      yearOrder.forEach(year => {
        if (groups[year]) {
          sortedGroups[year] = groups[year];
        }
      });

      return sortedGroups;
    };

    return {
      stats: {
        total: attendances.length,
        present: present.length,
        absent: absent.length,
        late: late.length,
        noShow: noShow.length,
      },
      groupedAttendances: {
        present,
        absent: groupByYear(absent),
        late: groupByYear(late),
        noShow,
      },
    };
  }, [attendances]);


  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">出欠情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {practiceSchedule && attendances.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            出欠情報詳細
          </h3>
          
            
            <div className="space-y-4">
              {Object.keys(groupedAttendances.absent).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <h5 className="font-semibold text-slate-900">
                      欠席 ({Object.values(groupedAttendances.absent).flat().length}名)
                    </h5>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(groupedAttendances.absent).map(([year, attendances]) => (
                      <div key={year} className="flex flex-wrap gap-2 items-start">
                        <div className="font-bold text-slate-700 text-sm min-w-[80px] pt-1.5">
                          【{year}】
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {attendances.map((attendance) => (
                            <div
                              key={attendance.id}
                              className="bg-white px-3 py-1.5 rounded border-2 border-red-400 text-sm"
                            >
                              <span className="text-slate-900">
                                {attendance.user_name || `User ${attendance.user_id.slice(0, 8)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(groupedAttendances.late).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <h5 className="font-semibold text-slate-900">
                      遅刻 ({Object.values(groupedAttendances.late).flat().length}名)
                    </h5>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(groupedAttendances.late).map(([year, attendances]) => (
                      <div key={year} className="flex flex-wrap gap-2 items-start">
                        <div className="font-bold text-slate-700 text-sm min-w-[80px] pt-2">
                          【{year}】
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {attendances.map((attendance) => (
                            <div
                              key={attendance.id}
                              className="bg-white px-3 py-2 rounded border-2 border-yellow-400 text-sm w-fit"
                            >
                              <div className="flex items-center flex-nowrap gap-2">
                                <span className="text-slate-900 font-medium whitespace-nowrap">
                                  {attendance.user_name}
                                </span>
                                {(attendance.available_from && attendance.available_to) && (
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    {attendance.available_from.slice(0, 5)} - {attendance.available_to.slice(0, 5)}
                                  </span>
                                )}
                              </div>
                              {attendance.notes && (
                                <p className="text-xs text-slate-600 mt-1">{attendance.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {(!practiceSchedule || attendances.length === 0) && !loading && null}
    </div>
  );
};