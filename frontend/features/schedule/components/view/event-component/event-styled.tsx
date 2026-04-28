"use client";

import React from "react";
import { Badge } from "@/components/ui/feedback/badge";
import { Button } from "@/components/ui/forms/button";
import { useModal } from "@/features/schedule/providers/modal-context";
import AddEventModal from "@/features/schedule/modals/add-event-modal";
import PracticeDetailModal from "@/features/schedule/modals/practice-detail-modal";
import { Event, CustomEventModal } from "@/features/schedule/types";
import { TrashIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { useScheduler } from "@/features/schedule/providers/schedular-provider";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import CustomModal from "@/features/schedule/components/CustomModal";

// Function to format date
const formatDate = (date: Date) => {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

// Function to format time only
const formatTime = (date: Date) => {
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

// Color variants based on event type
const variantColors = {
  primary: {
    bg: "bg-blue-100",
    border: "border-blue-200",
    text: "text-black",
  },
  danger: {
    bg: "bg-red-100",
    border: "border-red-200",
    text: "text-red-800",
  },
  success: {
    bg: "bg-green-100",
    border: "border-green-200",
    text: "text-green-800",
  },
  warning: {
    bg: "bg-yellow-100",
    border: "border-yellow-200",
    text: "text-yellow-800",
  },
};

interface EventStyledProps extends Event {
  minmized?: boolean;
  CustomEventComponent?: React.FC<Event>;
  disableClick?: boolean;
  onEventClick?: (event: Event) => void;
}

export default function EventStyled({
  event,
  onDelete,
  CustomEventModal,
}: {
  event: EventStyledProps;
  CustomEventModal?: CustomEventModal;
  onDelete?: (id: string) => void;
}) {
  const { setOpen } = useModal();
  const { handlers } = useScheduler();

  // Determine if delete button should be shown
  // Hide it for minimized events to save space, show on hover instead
  const shouldShowDeleteButton = !event?.minmized;

  // 練習スケジュールかどうかを判定する関数
  function isPracticeScheduleEvent(event: Event): boolean {
    // 練習スケジュールイベントはmetadataプロパティを持つ
    const hasMetadata = (event as any).metadata && (
      (event as any).metadata.scheduleType || 
      (event as any).metadata.venues ||
      (event as any).metadata.sessionCount ||
      (event as any).metadata.divisionCount
    );
    
    // タイトルに練習関連のキーワードが含まれる
    const hasPracticeInTitle = (
      event.title.includes('練習') ||
      event.title.includes('Practice') ||
      event.title.includes('practice') ||
      event.title.includes('レッスン') ||
      event.title.includes('Lesson')
    );
    
    // 説明に練習関連のキーワードが含まれる
    const hasPracticeInDescription = event.description && (
      event.description.includes('練習') ||
      event.description.includes('Practice') ||
      event.description.includes('practice') ||
      event.description.includes('レッスン') ||
      event.description.includes('Lesson')
    );
    
    // 練習スケジュールサービスから来たイベントかどうか
    const isFromPracticeService = event.id && (
      event.id.length === 36 || // UUID形式
      event.id.startsWith('practice-') ||
      event.id.includes('schedule')
    );
    
    return hasMetadata || hasPracticeInTitle || hasPracticeInDescription || isFromPracticeService;
  }

  // Handler function
  function handleEditEvent(event: Event) {
    // 練習スケジュールの場合は練習詳細モーダルを表示
    if (isPracticeScheduleEvent(event)) {
      setOpen(
        <CustomModal title="練習スケジュール詳細">
          <PracticeDetailModal />
        </CustomModal>,
        async () => {
          return {
            practiceId: event.id,
            ...event,
          };
        }
      );
    } else {
      // 通常のイベントの場合は編集モーダルを表示
      setOpen(
        <CustomModal title="Edit Event">
          <AddEventModal
            CustomAddEventModal={
              CustomEventModal?.CustomAddEventModal?.CustomForm
            }
          />
        </CustomModal>,
        async () => {
          return {
            ...event,
          };
        }
      );
    }
  }

  // Get background color class based on variant
  const getBackgroundColor = (variant: string | undefined) => {
    const variantKey = variant as keyof typeof variantColors || "primary";
    const colors = variantColors[variantKey] || variantColors.primary;
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  return (
    <div
      key={event?.id}
      className={cn(
        "w-full z-50 relative group rounded-lg flex flex-col flex-grow",
        event?.minmized ? "" : "",
        event?.disableClick ? "cursor-default" : "cursor-pointer"
      )}
    >
      {event.CustomEventComponent ? (
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            if (event?.disableClick) {
              return;
            }
            if (event?.onEventClick) {
              event.onEventClick(event);
            } else {
              handleEditEvent({
                id: event?.id,
                title: event?.title,
                startDate: event?.startDate,
                endDate: event?.endDate,
                description: event?.description,
                variant: event?.variant,
              });
            }
          }}
        >
          <event.CustomEventComponent {...event} />
        </div>
      ) : (
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            if (event?.disableClick) {
              return;
            }
            if (event?.onEventClick) {
              event.onEventClick(event);
            } else {
              handleEditEvent({
                id: event?.id,
                title: event?.title,
                startDate: event?.startDate,
                endDate: event?.endDate,
                description: event?.description,
                variant: event?.variant,
              });
            }
          }}
          className={cn(
            "w-full p-2 rounded",
            getBackgroundColor(event?.variant),
            event?.minmized ? "flex-grow overflow-hidden" : "min-h-fit"
          )}
        >
          <div className={cn("flex flex-col h-full", event?.minmized && "justify-center")}>
            <div className="font-semibold text-xs truncate">
              {event?.title || "Untitled Event"}
            </div>

            {!event?.minmized && event?.description && (
              <div className="my-2 text-sm">{event?.description}</div>
            )}
            
            {!event?.minmized && (
              <div className="text-xs space-y-1 mt-2">
                <div className="flex items-center">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {formatDate(event?.startDate)}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="mr-1 h-3 w-3" />
                  {formatDate(event?.endDate)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
