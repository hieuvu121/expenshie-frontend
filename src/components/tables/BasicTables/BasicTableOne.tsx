import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useHousehold } from "../../../context/HouseholdContext";
import { useExpenseEventRefresh } from "../../../hooks/useExpenseEventRefresh";
import { householdAPI, type Expense } from "../../../services/householdApi";
import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";

export default function BasicTableOne() {
  const { activeHousehold } = useHousehold();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([null]); // stack of cursors, index 0 = first page
  const [currentPage, setCurrentPage] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>("");

  const isAdmin = localStorage.getItem("memberRole") === "ROLE_ADMIN";

  const fetchPage = useCallback(async (cursor: number | null) => {
    if (!activeHousehold?.id) return;
    setLoading(true);
    try {
      const result = await householdAPI.getHouseholdExpenses(activeHousehold.id, 10, cursor);
      setExpenses(result.data ?? []);
      setNextCursor(result.nextCursor ?? null);
      setHasMore(result.hasMore ?? false);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [activeHousehold?.id]);

  const refreshExpenses = useCallback(async () => {
    if (!activeHousehold?.id) {
      setExpenses([]);
      return;
    }
    setCursorHistory([null]);
    setCurrentPage(0);
    await fetchPage(null);
  }, [activeHousehold?.id, fetchPage]);

  const goToNextPage = async () => {
    if (!hasMore || nextCursor == null || loading) return;
    const newPage = currentPage + 1;
    const cursorToFetch = nextCursor;
    setCursorHistory((prev) => {
      const updated = [...prev];
      updated[newPage] = cursorToFetch;
      return updated;
    });
    setCurrentPage(newPage);
    setHasMore(false); // optimistically disable Next until response arrives
    await fetchPage(cursorToFetch);
  };

  const goToPrevPage = async () => {
    if (currentPage === 0 || loading) return;
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    await fetchPage(cursorHistory[newPage] ?? null);
  };

  useEffect(() => {
    void refreshExpenses();
  }, [refreshExpenses]);

  useExpenseEventRefresh(() => {
    void refreshExpenses();
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Created By
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Currency
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                {isAdmin && (
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                    No expenses found for this household.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {exp.createdBy || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {exp.category || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {exp.currency || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {exp.date ? new Date(exp.date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={
                          exp.status === "APPROVED"
                            ? "success"
                            : exp.status === "PENDING"
                              ? "warning"
                              : "error"
                        }
                      >
                        {exp.status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDescription(
                            exp.description && exp.description.trim().length > 0
                              ? exp.description
                              : "No description provided for this expense."
                          );
                          setIsDescriptionModalOpen(true);
                        }}
                      >
                        Description
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {typeof exp.amount === "number" ? exp.amount.toFixed(2) : exp.amount ?? "-"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/edit-expense", { state: { expense: exp } })}
                            disabled={actionLoadingId === exp.id}
                          >
                            Edit
                          </Button>
                              {exp.status === "PENDING" && (
                                <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!activeHousehold?.id || !exp.id) {
                                    return;
                                  }
                                  setActionError(null);
                                  setActionLoadingId(exp.id);
                                  try {
                                    await householdAPI.approveExpense(activeHousehold.id, exp.id);
                                    await refreshExpenses();
                                  } catch (err) {
                                    setActionError(err instanceof Error ? err.message : "Failed to approve expense.");
                                  } finally {
                                    setActionLoadingId(null);
                                  }
                                }}
                                disabled={actionLoadingId === exp.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!activeHousehold?.id || !exp.id) {
                                    return;
                                  }
                                  setActionError(null);
                                  setActionLoadingId(exp.id);
                                  try {
                                    await householdAPI.rejectExpense(activeHousehold.id, exp.id);
                                    await refreshExpenses();
                                  } catch (err) {
                                    setActionError(err instanceof Error ? err.message : "Failed to reject expense.");
                                  } finally {
                                    setActionLoadingId(null);
                                  }
                                }}
                                disabled={actionLoadingId === exp.id}
                              >
                                Reject
                              </Button>
                                </>
                              )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {actionError && (
            <div className="px-5 py-3 text-sm text-error-600 dark:text-error-400">
              {actionError}
            </div>
          )}

          {hasMore || currentPage > 0 ? (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
              <Button
                size="sm"
                variant="outline"
                onClick={goToPrevPage}
                disabled={currentPage === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage + 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={goToNextPage}
                disabled={!hasMore || loading}
              >
                Next
              </Button>
            </div>
          ) : null}

          <Modal
            isOpen={isDescriptionModalOpen}
            onClose={() => setIsDescriptionModalOpen(false)}
            className="max-w-[600px] m-4 p-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Expense Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {selectedDescription}
              </p>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDescriptionModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}
