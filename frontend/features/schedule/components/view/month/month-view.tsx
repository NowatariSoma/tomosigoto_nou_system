"use client";

import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/forms/button";
import { Card } from "@/components/ui/layout/card";
import { Badge } from "@/components/ui/feedback/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import { useScheduler } from "@/features/schedule/providers/schedular-provider";
import { useModal } from "@/features/schedule/providers/modal-context";
import AddEventModal from "@/features/schedule/modals/add-event-modal";
import ShowMoreEventsModal from "@/features/schedule/modals/show-more-events-modal";
import EventStyled from "../event-component/event-styled";
import { Event, CustomEventModal } from "@/features/schedule/types";
import CustomModal from "@/features/schedule/components/custom-modal";
import { usePracticeScheduleEvents } from "@/features/schedule/hooks/use-practice-schedule-calendar";

const pageTransitionVariants = {
  enter: (direction: number) => ({
    opacity: 0,
  }),
  center: {
    opacity: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    transition: {
      opacity: { duration: 0.2 },
    },
  }),
};

export default function MonthView({
  prevButton,
  nextButton,
  CustomEventComponent,
  CustomEventModal,
  classNames,
}: {
  prevButton?: React.ReactNode;
  nextButton?: React.ReactNode;
  CustomEventComponent?: React.FC<Event>;
  CustomEventModal?: CustomEventModal;
  classNames?: { prev?: string; next?: string; addEvent?: string };
}) {
  const { getters, weekStartsOn } = useScheduler();
  const { setOpen } = useModal();
  const router = useRouter();

  // 練習スケジュールデータを取得
  const {
    events: practiceEvents,
    rawEvents,
    loading,
    error,
    currentYear,
    currentMonth,
    totalCount,
    fetchMonthSchedules,
  } = usePracticeScheduleEvents();

  const [currentDate, setCurrentDate] = useState(new Date());

  // useEffect内でデバッグログを出力（レンダリングサイクルに影響しない）
  useEffect(() => {
    console.log('MonthView Debug:', {
      practiceEventsCount: practiceEvents.length,
      rawEventsCount: rawEvents.length,
      loading,
      error,
      totalCount,
      currentYear,
      currentMonth,
      firstEvent: practiceEvents[0] ? { id: practiceEvents[0].id, title: practiceEvents[0].title } : null,
    });
  }, [practiceEvents, rawEvents, loading, error, totalCount, currentYear, currentMonth]);
  const [direction, setDirection] = useState<number>(0);

  const daysInMonth = getters.getDaysInMonth(
    currentDate.getMonth(),
    currentDate.getFullYear()
  );

  const handlePrevMonth = useCallback(() => {
    setDirection(-1);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
    // 新しい月の練習スケジュールを取得
    fetchMonthSchedules(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [currentDate, fetchMonthSchedules]);

  const handleNextMonth = useCallback(() => {
    setDirection(1);
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
    // 新しい月の練習スケジュールを取得
    fetchMonthSchedules(newDate.getFullYear(), newDate.getMonth() + 1);
  }, [currentDate, fetchMonthSchedules]);

  // 月が変わったときに練習スケジュールを取得
  useEffect(() => {
    fetchMonthSchedules(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, fetchMonthSchedules]);

  // 日付クリック時に詳細表示に遷移
  function handleDateClick(selectedDay: number) {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay
    );
    const dateStr = clickedDate.toISOString().split('T')[0]; // YYYY-MM-DD形式
    router.push(`/schedule?date=${dateStr}`);
  }

  function handleAddEvent(selectedDay: number) {
    // Create date range for the selected day
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      0,
      0,
      0
    );

    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      23,
      59,
      59
    );

    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal
          CustomAddEventModal={
            CustomEventModal?.CustomAddEventModal?.CustomForm
          }
        />
      </CustomModal>,
      async () => {
        return {
          startDate,
          endDate,
          title: "",
          id: "",
          variant: "primary",
        };
      }
    );
  }

  function handleShowMoreEvents(dayEvents: Event[]) {
    setOpen(
      <CustomModal title={dayEvents && dayEvents[0]?.startDate.toDateString()}>
        <ShowMoreEventsModal />
      </CustomModal>,
      async () => {
        return {
          dayEvents,
        };
      }
    );
  }

  const containerVariants = {
    enter: { opacity: 0 },
    center: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const daysOfWeek =
    weekStartsOn === "monday"
      ? ["月", "火", "水", "木", "金", "土", "日"]
      : ["日", "月", "火", "水", "木", "金", "土"];

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const startOffset =
    (firstDayOfMonth.getDay() - (weekStartsOn === "monday" ? 1 : 0) + 7) % 7;

  // Calculate previous month's last days for placeholders
  const prevMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );
  const lastDateOfPrevMonth = new Date(
    prevMonth.getFullYear(),
    prevMonth.getMonth() + 1,
    0
  ).getDate();

  // Calculate how many days from next month to show
  const totalCells = Math.ceil((startOffset + daysInMonth.length) / 7) * 7;
  const nextMonthDays = totalCells - startOffset - daysInMonth.length;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <motion.h2
          key={currentDate.getMonth()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl md:text-3xl my-2 sm:my-5 tracking-tighter font-bold"
        >
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </motion.h2>
        <div className="flex justify-between items-center gap-2 sm:gap-3">
          {prevButton ? (
            <div onClick={handlePrevMonth}>{prevButton}</div>
          ) : (
            <Button
              variant="outline"
              className={classNames?.prev}
              onClick={handlePrevMonth}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
          )}
          {nextButton ? (
            <div onClick={handleNextMonth}>{nextButton}</div>
          ) : (
            <Button
              variant="outline"
              className={classNames?.next}
              onClick={handleNextMonth}
              size="sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
          custom={direction}
          variants={{
            ...pageTransitionVariants,
            center: {
              ...pageTransitionVariants.center,
              transition: {
                opacity: { duration: 0.2 },
                staggerChildren: 0.02,
              },
            },
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className="grid grid-cols-7"
        >
          {daysOfWeek.map((day, idx) => {
            const dayIndex = weekStartsOn === "monday" ? (idx + 1) % 7 : idx;
            const isSunday = dayIndex === 0;
            const isSaturday = dayIndex === 6;
            return (
              <div
                key={idx}
                className={`text-center my-1 sm:my-2 md:my-3 text-xs sm:text-base md:text-lg tracking-tighter font-medium opacity-40 ${
                  isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
            );
          })}

          {Array.from({ length: startOffset }).map((_, idx) => {
            const prevMonthDay = lastDateOfPrevMonth - startOffset + idx + 1;
            const prevMonthDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - 1,
              prevMonthDay
            );
            const dayOfWeek = prevMonthDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <motion.div
                key={`offset-${idx}`}
                className="hover:z-50 border-none min-h-[calc((100vh-280px)/6)] sm:min-h-[calc((100vh-300px)/6)] md:min-h-[calc((100vh-300px)/6)] group flex flex-col"
                variants={itemVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Card className="shadow-none cursor-default overflow-hidden relative p-1 sm:p-2 md:p-3 lg:p-4 border-t border-l-0 border-r-0 border-b-0 border-border/50 bg-transparent h-full rounded-none">
                  <div className={clsx(
                    "font-semibold relative text-sm sm:text-xl md:text-2xl lg:text-3xl mb-1 opacity-40 text-center",
                    isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : "text-muted-foreground"
                  )}>
                    {prevMonthDay}
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {daysInMonth.map((dayObj) => {
            // 既存のスケジューラーイベントと練習スケジュールイベントを統合
            const schedulerEvents = getters.getEventsForDay(dayObj.day, currentDate);
            const dayPracticeEvents = practiceEvents.filter(event => {
              const eventDate = new Date(event.startDate);
              const matches = eventDate.getDate() === dayObj.day &&
                     eventDate.getMonth() === currentDate.getMonth() &&
                     eventDate.getFullYear() === currentDate.getFullYear();
              
              // デバッグ用ログ（10月12日と13日のみ）
              if (dayObj.day === 12 || dayObj.day === 13) {
                console.log(`Day ${dayObj.day} Filter:`, {
                  eventTitle: event.title,
                  eventStartDate: event.startDate,
                  eventDateParsed: eventDate,
                  eventDay: eventDate.getDate(),
                  eventMonth: eventDate.getMonth(),
                  eventYear: eventDate.getFullYear(),
                  currentDay: dayObj.day,
                  currentMonth: currentDate.getMonth(),
                  currentYear: currentDate.getFullYear(),
                  matches
                });
              }
              
              return matches;
            });
            
            // 全てのイベントを統合
            const dayEvents = [...schedulerEvents, ...dayPracticeEvents];
            
            // デバッグ用ログ（10月12日と13日のみ）
            if (dayObj.day === 12 || dayObj.day === 13) {
              console.log(`Day ${dayObj.day} Final:`, {
                schedulerEventsCount: schedulerEvents.length,
                dayPracticeEventsCount: dayPracticeEvents.length,
                totalDayEventsCount: dayEvents.length,
                dayEvents: dayEvents.map(e => ({ id: e.id, title: e.title }))
              });
            }
            
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayObj.day);
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <motion.div
                className="hover:z-50 border-none min-h-[calc((100vh-280px)/6)] sm:min-h-[calc((100vh-300px)/6)] md:min-h-[calc((100vh-300px)/6)] group flex flex-col"
                key={dayObj.day}
                variants={itemVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Card
                  className="cursor-pointer overflow-hidden relative flex flex-col h-full border-t border-l-0 border-r-0 border-b-0 border-border/50 rounded-none shadow-none"
                  onClick={() => handleDateClick(dayObj.day)}
                >
                  <div
                    className={clsx(
                      "font-semibold relative z-10 text-sm sm:text-xl md:text-2xl lg:text-3xl mb-1 pt-1 sm:pt-2 text-center",
                      new Date().getDate() === dayObj.day &&
                        new Date().getMonth() === currentDate.getMonth() &&
                        new Date().getFullYear() === currentDate.getFullYear()
                        ? "text-secondary-500"
                        : isSunday
                        ? "text-red-600"
                        : isSaturday
                        ? "text-blue-600"
                        : dayEvents.length > 0
                        ? "text-primary-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {dayObj.day}
                  </div>
                  <div className="flex-grow flex flex-col gap-1 w-full relative z-10 px-1 sm:px-2">
                    <AnimatePresence mode="wait">
                      {dayEvents?.length > 0 && dayEvents.map((event, index) => (
                        <motion.div
                          key={event.id}
                          className="w-full"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <EventStyled
                            event={{
                              ...event,
                              CustomEventComponent,
                              minmized: true,
                            }}
                            CustomEventModal={CustomEventModal}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Next month days */}
          {Array.from({ length: nextMonthDays }).map((_, idx) => {
            const nextMonthDay = idx + 1;
            const nextMonthDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              nextMonthDay
            );
            const dayOfWeek = nextMonthDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <motion.div
                key={`next-${idx}`}
                className="hover:z-50 border-none min-h-[calc((100vh-280px)/6)] sm:min-h-[calc((100vh-300px)/6)] md:min-h-[calc((100vh-300px)/6)] group flex flex-col"
                variants={itemVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <Card className="shadow-none cursor-default overflow-hidden relative p-1 sm:p-2 md:p-3 lg:p-4 border-t border-l-0 border-r-0 border-b-0 border-border/50 bg-transparent h-full rounded-none">
                  <div className={clsx(
                    "font-semibold relative text-sm sm:text-xl md:text-2xl lg:text-3xl mb-1 opacity-40 text-center",
                    isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : "text-muted-foreground"
                  )}>
                    {nextMonthDay}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
