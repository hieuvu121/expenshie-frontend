import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

export interface RecentExpenseItem {
  id?: number | string;
  createdBy?: string | null;
  category?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  date?: string | null;
}

interface RecentExpenseProps {
  expenses: RecentExpenseItem[];
  isLoading?: boolean;
  error?: string | null;
}

const formatAmount = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  const parsed = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(parsed)) return String(amount);
  return parsed.toFixed(2);
};

export default function RecentExpense({
  expenses,
  isLoading = false,
  error = null,
}: RecentExpenseProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 height-full w-full">
      <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Expense
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Latest expense records
            </p>
          </div>

          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>

            <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View All
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Export
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          {/* Table Head */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <span>Member</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Table Body: fixed min height (9 rows), but only render real rows */}
          <div
            className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-transparent"
          >
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-error-600 dark:text-error-400">
                {error}
              </div>
            ) : expenses.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No recent expenses.
              </div>
            ) : (
              expenses.map((row) => (
                <div
                  key={row.id ?? `${row.createdBy}-${row.category}-${row.amount}-${row.date}`}
                  className="grid grid-cols-3 gap-3 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {row.createdBy || "Unknown"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {row.category || "Uncategorized"}
                  </span>
                  <span className="text-right font-semibold text-gray-800 dark:text-white/90">
                    {row.currency ? `${row.currency} ` : ""}
                    {formatAmount(row.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
