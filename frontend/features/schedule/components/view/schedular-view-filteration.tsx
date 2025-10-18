"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

import AddEventModal from "../../modals/add-event-modal";
import MonthView from "./month/month-view";
import { useModal } from "@/features/schedule/providers/modal-context";
import { ClassNames, CustomComponents } from "@/features/schedule/types/index";
import CustomModal from "@/features/schedule/components/custom-modal";

// Animation settings for Framer Motion
const animationConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: "spring" as const, stiffness: 250, damping: 20 },
};

export default function SchedulerViewFilteration({
  stopDayEventSummary = false,
  CustomComponents,
  classNames,
}: {
  stopDayEventSummary?: boolean;
  CustomComponents?: CustomComponents;
  classNames?: ClassNames;
}) {
  const { setOpen } = useModal();

  function handleAddEvent(selectedDay?: number) {
    // Create the modal content with proper data
    const startDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      selectedDay ?? new Date().getDate(),
      0,
      0,
      0,
      0
    );

    const endDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      selectedDay ?? new Date().getDate(),
      23,
      59,
      59,
      999
    );

    // Create a wrapper component to handle data passing
    const ModalWrapper = () => {
      const title =
        CustomComponents?.CustomEventModal?.CustomAddEventModal?.title ||
        "Add Event";

      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
        </div>
      );
    };

    // Open the modal with the content
    setOpen(
      <CustomModal title="Add Event">
        <AddEventModal
          CustomAddEventModal={
            CustomComponents?.CustomEventModal?.CustomAddEventModal?.CustomForm
          }
        />{" "}
      </CustomModal>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full">
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div {...animationConfig}>
              <MonthView
                classNames={classNames?.buttons}
                prevButton={
                  CustomComponents?.customButtons?.CustomPrevButton
                }
                nextButton={
                  CustomComponents?.customButtons?.CustomNextButton
                }
                CustomEventComponent={
                  CustomComponents?.CustomEventComponent
                }
                CustomEventModal={CustomComponents?.CustomEventModal}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
