import { useContext } from "react";
import { ExpenseEventsContext } from "../context/ExpenseEventsContext";

export const useExpenseEvents = () => {
  const context = useContext(ExpenseEventsContext);

  if (context === undefined) {
    throw new Error("useExpenseEvents must be used within an ExpenseEventsProvider");
  }

  return context;
};
