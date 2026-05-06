import { useEffect, useRef } from "react";
import { useHousehold } from "../context/HouseholdContext";
import { useExpenseEvents } from "./useExpenseEvents";

export const useExpenseEventRefresh = (onExpenseEvent: () => void) => {
  const { activeHousehold } = useHousehold();
  const { lastExpenseEvent } = useExpenseEvents();
  const latestHandlerRef = useRef(onExpenseEvent);

  useEffect(() => {
    latestHandlerRef.current = onExpenseEvent;
  }, [onExpenseEvent]);

  useEffect(() => {
    if (!lastExpenseEvent || !activeHousehold?.id) {
      return;
    }

    if (lastExpenseEvent.householdId !== activeHousehold.id) {
      return;
    }

    latestHandlerRef.current();
  }, [activeHousehold?.id, lastExpenseEvent]);
};
