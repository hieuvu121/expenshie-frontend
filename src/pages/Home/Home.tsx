import { useState, useEffect, useCallback, useMemo } from "react";
import PendingExpense from "../../components/displayBox/PendingExpense";
import MonthlyExpenseChart from "../../components/displayBox/MonthlyExpenseChart";
import StatisticsChart from "../../components/displayBox/StatisticsChart";
import RecentExpense, { type RecentExpenseItem } from "../../components/displayBox/RecentExpense";
import AISuggestions from "../../components/displayBox/AISuggestions";
import PageMeta from "../../components/common/PageMeta";
import JoinGroupModal from "../../components/household/JoinGroupModal";
import CreateGroupModal from "../../components/household/CreateGroupModal";
import { useHousehold } from "../../context/HouseholdContext";
import { useExpenseEventRefresh } from "../../hooks/useExpenseEventRefresh";
import { householdAPI } from "../../services/householdApi";
import type { ChartTabValue } from "../../components/common/ChartTab";

const DAILY_CATEGORIES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_CATEGORIES = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];
const MONTHLY_CATEGORIES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


export default function Home() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { households, activeHousehold } = useHousehold();
  const [recentExpenses, setRecentExpenses] = useState<RecentExpenseItem[]>([]);
  const [dailyTotals, setDailyTotals] = useState<number[]>(Array.from({ length: 7 }, () => 0));
  const [dailyApprovedTotals, setDailyApprovedTotals] = useState<number[]>(Array.from({ length: 7 }, () => 0));
  const [statisticsRange, setStatisticsRange] = useState<ChartTabValue>("DAILY");
  const [statisticsCategories, setStatisticsCategories] = useState<string[]>(DAILY_CATEGORIES);
  const [statisticsTotals, setStatisticsTotals] = useState<number[]>(Array.from({ length: 7 }, () => 0));
  const [statisticsApprovedTotals, setStatisticsApprovedTotals] = useState<number[]>(Array.from({ length: 7 }, () => 0));
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  const parseAmount = useCallback((value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  const toDailySeries = useCallback(
    (expenseItems: RecentExpenseItem[]) => {
      const totals = Array.from({ length: 7 }, () => 0);
      expenseItems.forEach((expense) => {
        if (!expense.date) return;
        const expenseDate = new Date(expense.date);
        if (Number.isNaN(expenseDate.getTime())) return;
        const weekIndex = (expenseDate.getDay() + 6) % 7;
        totals[weekIndex] += parseAmount(expense.amount);
      });
      return totals;
    },
    [parseAmount],
  );

  const mergeDailySeries = useCallback((...series: number[][]) => {
    const merged = Array.from({ length: 7 }, () => 0);
    series.forEach((data) => {
      data.forEach((value, index) => {
        merged[index] += value;
      });
    });
    return merged;
  }, []);

  const toWeeklySeries = useCallback(
    (expenseItems: RecentExpenseItem[]) => {
      const totals = Array.from({ length: 8 }, () => 0);
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const currentWeekStart = new Date(now);
      currentWeekStart.setHours(0, 0, 0, 0);
      currentWeekStart.setDate(now.getDate() - diffToMonday);

      const earliestWeekStart = new Date(currentWeekStart);
      earliestWeekStart.setDate(currentWeekStart.getDate() - 7 * 7);

      expenseItems.forEach((expense) => {
        if (!expense.date) return;
        const expenseDate = new Date(expense.date);
        if (Number.isNaN(expenseDate.getTime())) return;
        if (expenseDate < earliestWeekStart) return;

        const expenseWeekStart = new Date(expenseDate);
        expenseWeekStart.setHours(0, 0, 0, 0);
        expenseWeekStart.setDate(expenseDate.getDate() - ((expenseDate.getDay() + 6) % 7));

        const diffMs = expenseWeekStart.getTime() - earliestWeekStart.getTime();
        const index = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        if (index < 0 || index > 7) return;

        totals[index] += parseAmount(expense.amount);
      });

      return totals;
    },
    [parseAmount],
  );

  const toMonthlySeries = useCallback(
    (expenseItems: RecentExpenseItem[]) => {
      const totals = Array.from({ length: 12 }, () => 0);
      const currentYear = new Date().getFullYear();

      expenseItems.forEach((expense) => {
        if (!expense.date) return;
        const expenseDate = new Date(expense.date);
        if (Number.isNaN(expenseDate.getTime())) return;
        if (expenseDate.getFullYear() !== currentYear) return;

        const monthIndex = expenseDate.getMonth();
        totals[monthIndex] += parseAmount(expense.amount);
      });

      return totals;
    },
    [parseAmount],
  );

  const buildStatisticsSeries = useCallback(
    (
      allExpenses: RecentExpenseItem[],
      approvedExpenses: RecentExpenseItem[],
      dailyApprovedExpenses: RecentExpenseItem[],
      dailyPendingExpenses: RecentExpenseItem[],
      dailyRejectedExpenses: RecentExpenseItem[],
      weeklyApprovedExpenses: RecentExpenseItem[],
      weeklyPendingExpenses: RecentExpenseItem[],
      weeklyRejectedExpenses: RecentExpenseItem[],
    ) => {
      if (statisticsRange === "WEEKLY") {
        const weeklyApproved = toWeeklySeries(weeklyApprovedExpenses);
        const weeklyPending = toWeeklySeries(weeklyPendingExpenses);
        const weeklyRejected = toWeeklySeries(weeklyRejectedExpenses);
        setStatisticsCategories(WEEKLY_CATEGORIES);
        setStatisticsTotals(mergeDailySeries(weeklyApproved, weeklyPending, weeklyRejected));
        setStatisticsApprovedTotals(weeklyApproved);
        return;
      }

      if (statisticsRange === "MONTHLY") {
        setStatisticsCategories(MONTHLY_CATEGORIES);
        setStatisticsTotals(toMonthlySeries(allExpenses));
        setStatisticsApprovedTotals(toMonthlySeries(approvedExpenses));
        return;
      }

      const dailyApproved = toDailySeries(dailyApprovedExpenses);
      const dailyPending = toDailySeries(dailyPendingExpenses);
      const dailyRejected = toDailySeries(dailyRejectedExpenses);

      setStatisticsCategories(DAILY_CATEGORIES);
      setStatisticsTotals(mergeDailySeries(dailyApproved, dailyPending, dailyRejected));
      setStatisticsApprovedTotals(dailyApproved);
    },
    [statisticsRange, toDailySeries, toWeeklySeries, toMonthlySeries, mergeDailySeries],
  );

  const loadExpenses = useCallback(async () => {
    if (!activeHousehold?.id) {
      setRecentExpenses([]);
      setDailyTotals(Array.from({ length: 7 }, () => 0));
      setDailyApprovedTotals(Array.from({ length: 7 }, () => 0));
      setStatisticsTotals(Array.from({ length: 7 }, () => 0));
      setStatisticsApprovedTotals(Array.from({ length: 7 }, () => 0));
      return;
    }

    setIsExpensesLoading(true);
    setExpensesError(null);

    try {
      const [
        allExpensesPage,
        recentExpensesPage,
        approvedDailyExpenses,
        pendingDailyExpenses,
        rejectedDailyExpenses,
        approvedWeeklyExpenses,
        pendingWeeklyExpenses,
        rejectedWeeklyExpenses,
      ] =
        (await Promise.all([
          householdAPI.getHouseholdExpenses(activeHousehold.id),
          householdAPI.getHouseholdExpenses(activeHousehold.id, 8),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "DAILY", "APPROVED"),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "DAILY", "PENDING"),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "DAILY", "REJECTED"),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "WEEKLY", "APPROVED"),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "WEEKLY", "PENDING"),
          householdAPI.getExpenseByPeriod(activeHousehold.id, "WEEKLY", "REJECTED"),
        ])) as [
          Awaited<ReturnType<typeof householdAPI.getHouseholdExpenses>>,
          Awaited<ReturnType<typeof householdAPI.getHouseholdExpenses>>,
          RecentExpenseItem[],
          RecentExpenseItem[],
          RecentExpenseItem[],
          RecentExpenseItem[],
          RecentExpenseItem[],
          RecentExpenseItem[],
        ];

      const allExpenses: RecentExpenseItem[] = (allExpensesPage.data ?? []) as RecentExpenseItem[];
      const approvedExpenses: RecentExpenseItem[] = (recentExpensesPage.data ?? []) as RecentExpenseItem[];

      setRecentExpenses(approvedExpenses);

      const approvedSeries = toDailySeries(approvedDailyExpenses || []);
      const pendingSeries = toDailySeries(pendingDailyExpenses || []);
      const rejectedSeries = toDailySeries(rejectedDailyExpenses || []);

      setDailyApprovedTotals(approvedSeries);
      setDailyTotals(mergeDailySeries(approvedSeries, pendingSeries, rejectedSeries));

      buildStatisticsSeries(
        allExpenses || [],
        approvedExpenses || [],
        approvedDailyExpenses || [],
        pendingDailyExpenses || [],
        rejectedDailyExpenses || [],
        approvedWeeklyExpenses || [],
        pendingWeeklyExpenses || [],
        rejectedWeeklyExpenses || [],
      );
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : "Failed to load expenses.");
    } finally {
      setIsExpensesLoading(false);
    }
  }, [activeHousehold?.id, toDailySeries, mergeDailySeries, buildStatisticsSeries]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useExpenseEventRefresh(() => {
    void loadExpenses();
  });

  const dailyChartEmpty = useMemo(
    () => dailyTotals.every((value) => value === 0) && dailyApprovedTotals.every((value) => value === 0),
    [dailyTotals, dailyApprovedTotals],
  );

  const statisticsChartEmpty = useMemo(
    () => statisticsTotals.every((value) => value === 0) && statisticsApprovedTotals.every((value) => value === 0),
    [statisticsTotals, statisticsApprovedTotals],
  );

  // If user has no households after loading is complete, redirect to onboarding



  // Show loading state while fetching households


  return (
    <>
      <PageMeta
        title="React.js Expense Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Expense Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      {/* Header Section with Join Group Button and Create Group Button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard
          </h1>
          {households.length > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {households.length} {households.length === 1 ? "group" : "groups"} available
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create Group
          </button>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Join Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <PendingExpense />

          <MonthlyExpenseChart
            data={dailyTotals}
            isLoading={isExpensesLoading}
            error={expensesError}
            isEmpty={dailyChartEmpty}
          />
        </div>

        <div className="col-span-12 xl:col-span-5 flex">
          <RecentExpense
            expenses={recentExpenses}
            isLoading={isExpensesLoading}
            error={expensesError}
          />
        </div>

        <div className="col-span-12">
          <StatisticsChart
            series={[
              { name: "Total", data: statisticsTotals },
              { name: "Approved", data: statisticsApprovedTotals },
            ]}
            selectedRange={statisticsRange}
            onRangeChange={setStatisticsRange}
            categories={statisticsCategories}
            isLoading={isExpensesLoading}
            error={expensesError}
            isEmpty={statisticsChartEmpty}
          />
        </div>

        {activeHousehold?.id && (
          <div className="col-span-12">
            <AISuggestions householdId={activeHousehold.id} />
          </div>
        )}
      </div>

      {/* Join Group Modal */}
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
