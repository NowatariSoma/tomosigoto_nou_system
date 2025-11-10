'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { attendanceService } from '@/features/attendance/services/attendance-service';
import { Attendance, PracticeSchedule } from '@/features/attendance/types';
import { practiceScheduleService } from '@/features/schedule/services/practice-schedule-service';

interface AttendanceSummaryProps {
  currentDate: Date;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ currentDate }) => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dateString = currentDate.toISOString().split('T')[0];
        const schedule = await practiceScheduleService.getPracticeScheduleByDate(dateString);
        
        if (!schedule) {
          setPracticeSchedule(null);
          setAttendances([]);
          return;
        }

        const practiceScheduleData: PracticeSchedule = {
          id: schedule.id,
          schedule_date: schedule.schedule_date,
          start_time: schedule.start_time || '',
          end_time: schedule.end_time || '',
          division_count: (schedule as any).division_count || 1,
          title: schedule.title,
          description: schedule.description,
        };
        setPracticeSchedule(practiceScheduleData);

        const scheduleAttendances = await attendanceService.getAttendancesByPractice(schedule.id);
        setAttendances(scheduleAttendances);
      } catch (err) {
        console.error('出欠情報の取得に失敗:', err);
        setError(err instanceof Error ? err.message : '出欠情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

  const { stats, groupedAttendances } = useMemo(() => {
    const present = attendances.filter(a => a.status === 'present');
    const absent = attendances.filter(a => a.status === 'absent');
    const late = attendances.filter(a => a.status === 'late');
    const noShow = attendances.filter(a => a.status === 'no_show');

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
        absent,
        late,
        noShow,
      },
    };
  }, [attendances]);


  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">出欠情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
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
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            出欠情報詳細
          </h3>
          
            
            <div className="space-y-4">
              {groupedAttendances.absent.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-4 w-4 text-red-500" />
                    <h5 className="font-semibold text-slate-900">
                      欠席 ({groupedAttendances.absent.length}名)
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedAttendances.absent.map((attendance) => (
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
              )}

              {groupedAttendances.late.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <h5 className="font-semibold text-slate-900">
                      遅刻 ({groupedAttendances.late.length}名)
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedAttendances.late.map((attendance) => (
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
              )}
            </div>
        </div>
      )}

      {(!practiceSchedule || attendances.length === 0) && !loading && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">この日付の出欠情報はありません</p>
          </div>
        </div>
      )}
    </div>
  );
};