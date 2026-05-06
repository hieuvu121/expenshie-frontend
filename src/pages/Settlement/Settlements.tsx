import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { useHousehold } from "../../context/HouseholdContext";
import { useExpenseEventRefresh } from "../../hooks/useExpenseEventRefresh";
import { settlementAPI, type Settlement, type SettlementStats } from "../../services/settlementApi";

const getStoredNumber = (key: string): number | null => {
  const value = localStorage.getItem(key);
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatAmount = (amount: number | string, currency?: string | null) => {
  const currencyLabel = currency ? `${currency} ` : "";
  return `${currencyLabel}${amount}`;
};

const formatOptional = (value?: string | null) => value || "-";

const statusBadgeColor = (status: string) => {
  if (status === "COMPLETED") {
    return "success";
  }
  if (status === "AWAITING_APPROVAL") {
    return "info";
  }
  if (status === "PENDING") {
    return "warning";
  }
  return "info";
};

type PendingPeriod = "current" | "lastThree";

export default function Settlements() {
  const { activeHousehold } = useHousehold();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentStats, setCurrentStats] = useState<SettlementStats>({
    pendingSettlements: [],
    totalPendingAmount: 0,
  });
  const [lastThreeStats, setLastThreeStats] = useState<SettlementStats>({
    pendingSettlements: [],
    totalPendingAmount: 0,
  });
  const [awaitingApprovals, setAwaitingApprovals] = useState<Settlement[]>([]);
  const [pendingPeriod, setPendingPeriod] = useState<PendingPeriod>("current");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [isApproving, setIsApproving] = useState<number | null>(null);

  // Pagination state for "Pending Settlements" (client-side)
  const PENDING_PAGE_SIZE = 3;
  const [pendingPage, setPendingPage] = useState(0);

  // Pagination state for "All Settlements"
  const [pageIndex, setPageIndex] = useState(0);
  const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([null]);
  const [hasMoreSettlements, setHasMoreSettlements] = useState(false);
  const [nextSettlementCursor, setNextSettlementCursor] = useState<number | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const memberId = getStoredNumber("memberId");
  const householdId = activeHousehold?.id ?? getStoredNumber("activeHouseholdId");

  const loadSettlements = useCallback(async () => {
    if (!memberId || !householdId) {
      setError("Missing member or household information. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    // Reset pagination to first page
    setPageIndex(0);
    setCursorHistory([null]);

    try {
      const [settlementsResult, statsData, lastThreeStatsData] = await Promise.all([
        settlementAPI.getSettlements(memberId, householdId, null),
        settlementAPI.getCurrentMonthStats(memberId, householdId),
        settlementAPI.getLastThreeMonthsStats(memberId, householdId),
      ]);
      const approvals = await settlementAPI.getAwaitingApprovals(memberId, householdId);
      setSettlements(settlementsResult.data);
      setHasMoreSettlements(settlementsResult.hasMore);
      setNextSettlementCursor(settlementsResult.nextCursor);
      setCurrentStats(statsData);
      setLastThreeStats(lastThreeStatsData);
      setAwaitingApprovals(approvals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlements.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId, householdId]);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  useExpenseEventRefresh(() => {
    void loadSettlements();
  });

  // Reset pending page when switching period tabs
  useEffect(() => {
    setPendingPage(0);
  }, [pendingPeriod]);

  const handleToggleStatus = async (settlementId: number) => {
    if (!memberId) {
      setError("Missing member information. Please sign in again.");
      return;
    }

    setIsToggling(settlementId);
    setError(null);
    setSuccessMessage(null);

    try {
      await settlementAPI.toggleSettlementStatus(settlementId, memberId);
      setSuccessMessage("Settlement status updated successfully.");
      await loadSettlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsToggling(null);
    }
  };

  const handleApprove = async (settlementId: number) => {
    if (!memberId) {
      setError("Missing member information. Please sign in again.");
      return;
    }

    setIsApproving(settlementId);
    setError(null);
    setSuccessMessage(null);

    try {
      await settlementAPI.approveSettlement(settlementId, memberId);
      setSuccessMessage("Settlement approved successfully.");
      await loadSettlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve settlement.");
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async (settlementId: number) => {
    if (!memberId) {
      setError("Missing member information. Please sign in again.");
      return;
    }

    setIsApproving(settlementId);
    setError(null);
    setSuccessMessage(null);

    try {
      await settlementAPI.rejectSettlement(settlementId, memberId);
      setSuccessMessage("Settlement rejected successfully.");
      await loadSettlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject settlement.");
    } finally {
      setIsApproving(null);
    }
  };

  const selectedStats =
    pendingPeriod === "current" ? currentStats : lastThreeStats;

  // Pending settlements — client-side pagination
  const paginatedPendingSettlements = selectedStats.pendingSettlements.slice(
    pendingPage * PENDING_PAGE_SIZE,
    (pendingPage + 1) * PENDING_PAGE_SIZE,
  );

  const handleNextPage = async () => {
    if (!hasMoreSettlements || !memberId || !householdId || isLoadingPage) return;
    setIsLoadingPage(true);
    setError(null);
    try {
      const result = await settlementAPI.getSettlements(memberId, householdId, nextSettlementCursor);
      setSettlements(result.data);
      setHasMoreSettlements(result.hasMore);
      setCursorHistory((prev) => [...prev.slice(0, pageIndex + 1), nextSettlementCursor]);
      setNextSettlementCursor(result.nextCursor);
      setPageIndex((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load next page.");
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handlePrevPage = async () => {
    if (pageIndex <= 0 || !memberId || !householdId || isLoadingPage) return;
    const prevIndex = pageIndex - 1;
    const cursor = cursorHistory[prevIndex];
    setIsLoadingPage(true);
    setError(null);
    try {
      const result = await settlementAPI.getSettlements(memberId, householdId, cursor);
      setSettlements(result.data);
      setHasMoreSettlements(result.hasMore);
      setNextSettlementCursor(cursorHistory[pageIndex] ?? result.nextCursor);
      setPageIndex(prevIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load previous page.");
    } finally {
      setIsLoadingPage(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Settlements | Expense Management"
        description="View pending settlements and monthly statistics."
      />
      <PageBreadcrumb pageTitle="Settlements" />

      {error && (
        <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-600 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-400">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Pending Summary
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Totals for the selected period.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total pending</p>
              <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                {formatAmount(
                  selectedStats.totalPendingAmount,
                  selectedStats.pendingSettlements[0]?.currency
                )}
              </p>
            </div>
            <Badge color="warning">
              {selectedStats.pendingSettlements.length} pending
            </Badge>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Pending Settlements
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Filter by time range
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 text-sm dark:border-gray-800 dark:bg-gray-900/40">
              <button
                className={`rounded-md px-3 py-1.5 font-medium transition ${pendingPeriod === "current"
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                onClick={() => setPendingPeriod("current")}
                type="button"
              >
                Current month
              </button>
              <button
                className={`rounded-md px-3 py-1.5 font-medium transition ${pendingPeriod === "lastThree"
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                onClick={() => setPendingPeriod("lastThree")}
                type="button"
              >
                Last 3 months
              </button>
            </div>
            {isLoading && (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
          </div>

          <div className="mt-5 space-y-3 min-h-[calc(3*(5rem+0.75rem))]">
            {paginatedPendingSettlements.length === 0 && !isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No pending settlements found.
              </p>
            ) : (
              paginatedPendingSettlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Settlement #{settlement.id}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatAmount(settlement.amount, settlement.currency)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      To: {formatOptional(settlement.toMemberName)} • Category: {formatOptional(settlement.expenseCategory)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={statusBadgeColor(settlement.status)}>
                      {settlement.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(settlement.id)}
                      disabled={isToggling === settlement.id || settlement.status === "COMPLETED"}
                    >
                      {settlement.status === "PENDING"
                        ? "Request approval"
                        : settlement.status === "AWAITING_APPROVAL"
                          ? "Cancel request"
                          : "Completed"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pending Settlements Pagination */}
          {selectedStats.pendingSettlements.length > PENDING_PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingPage((p) => p - 1)}
                disabled={pendingPage === 0 || isLoading}
              >
                ← Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {pendingPage + 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingPage((p) => p + 1)}
                disabled={(pendingPage + 1) * PENDING_PAGE_SIZE >= selectedStats.pendingSettlements.length || isLoading}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Waiting For Your Approval
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Approve or reject settlement completion requests.
            </p>
          </div>
          {isLoading && (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {awaitingApprovals.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No settlements awaiting your approval.
            </p>
          ) : (
            awaitingApprovals.map((settlement) => (
              <div
                key={settlement.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Settlement #{settlement.id}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatAmount(settlement.amount, settlement.currency)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    From: {formatOptional(settlement.fromMemberName)} • Category: {formatOptional(settlement.expenseCategory)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={statusBadgeColor(settlement.status)}>
                    {settlement.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(settlement.id)}
                    disabled={isApproving === settlement.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(settlement.id)}
                    disabled={isApproving === settlement.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              All Settlements
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              See all your settlements and their statuses. You can also toggle status for each settlement.
            </p>
          </div>
          {(isLoading || isLoadingPage) && (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">To</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 && !isLoading && !isLoadingPage ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    No settlements found.
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr
                    key={settlement.id}
                    className="border-b border-gray-100 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300"
                  >
                    <td className="px-3 py-3">#{settlement.id}</td>
                    <td className="px-3 py-3">
                      {formatAmount(settlement.amount, settlement.currency)}
                    </td>
                    <td className="px-3 py-3">
                      {formatOptional(settlement.toMemberName)}
                    </td>
                    <td className="px-3 py-3">
                      {formatOptional(settlement.expenseCategory)}
                    </td>
                    <td className="px-3 py-3">
                      {settlement.date ?? "-"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge color={statusBadgeColor(settlement.status)}>
                        {settlement.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(settlement.id)}
                        disabled={isToggling === settlement.id || settlement.status === "COMPLETED"}
                      >
                        {settlement.status === "PENDING"
                          ? "Request approval"
                          : settlement.status === "AWAITING_APPROVAL"
                            ? "Cancel request"
                            : "Completed"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handlePrevPage()}
            disabled={pageIndex === 0 || isLoadingPage || isLoading}
          >
            ← Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pageIndex + 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleNextPage()}
            disabled={!hasMoreSettlements || isLoadingPage || isLoading}
          >
            Next →
          </Button>
        </div>
      </div>
    </>
  );
}
