import { apiRequest } from "./coreApi";

interface SplitRequestDTO {
  memberId: number;
  amount: number;
}

interface CreateExpenseRequestDTO {
  amount: number;
  date: string;
  category: string;
  description?: string;
  currency: string;
  method: string;
  splits: SplitRequestDTO[];
}

interface MemberDTO {
  memberId: number;
  fullName: string;
  role: string;
}

export interface HouseholdSummary {
  id: number;
  name: string;
  code: string;
  role: string;
  memberId?: number;
}

export interface Expense {
  id: number;
  title?: string;
  category?: string;
  description?: string;
  status?: string;
  method?: string;
  amount?: number | string;
  date?: string;
  currency?: string;
  createdBy?: string;
}

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
type ExpenseRange = "DAILY" | "WEEKLY" | "MONTHLY";

export interface CursorPageResponse<T> {
  data: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

export const householdAPI = {
  /**
   * Get all households for current user
   */
  getMyHouseholds: async (): Promise<HouseholdSummary[]> => {
    const response = await apiRequest("/households/my");
    return response.json();
  },

  /**
   * Get all household members for a household
   */
  getHouseholdMembers: async (householdId: number | string): Promise<MemberDTO[]> => {
    const response = await apiRequest(`/member/${householdId}/members`);
    return response.json();
  },

  /**
   * Join a household using invite code
   */
  joinHousehold: async (code: string) => {
    const response = await apiRequest("/households/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return response.json();
  },

  /**
   * Create a new household
   */
  createHousehold: async (name: string) => {
    const response = await apiRequest("/households/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  /**
   * Create a new expense in a household
   */
  createExpense: async (householdId: number | string, expenseData: CreateExpenseRequestDTO) => {
    const response = await apiRequest(`/households/${householdId}/expenses`, {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
    return response.json();
  },

  updateExpense: async (
    householdId: number | string,
    expenseId: number | string,
    expenseData: CreateExpenseRequestDTO,
  ) => {
    const response = await apiRequest(`/households/${householdId}/expenses/${expenseId}/update`, {
      method: "PATCH",
      body: JSON.stringify(expenseData),
    });
    return response.json();
  },

  /**
   * Create a new expense from an AI paragraph prompt
   */
  createExpenseWithAI: async (householdId: number | string, paragraph: string) => {
    const response = await apiRequest(`/households/${householdId}/expenses/ai`, {
      method: "POST",
      body: JSON.stringify(paragraph),
    });
    return response.json();
  },
  /**
   * Get paginated expenses for a household using cursor-based pagination.
   * Omit cursor to fetch the first page.
   */
  getHouseholdExpenses: async (
    householdId: number | string,
    limit = 10,
    cursor?: number | null,
  ): Promise<CursorPageResponse<Expense>> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor != null) params.set("cursor", String(cursor));
    const response = await apiRequest(`/households/${householdId}/expenses?${params}`);
    return response.json();
  },

  getHouseholdExpensesByStatus: async (
    householdId: number | string,
    status: ExpenseStatus,
  ) => {
    const response = await apiRequest(`/households/${householdId}/expenses?status=${status}`);
    return response.json();
  },

  getPendingExpenses: async (
    householdId: number | string,
    limit = 2,
    cursor?: number | null,
  ): Promise<CursorPageResponse<Expense>> => {
    const params = new URLSearchParams({ status: "PENDING", limit: String(limit) });
    if (cursor != null) params.set("cursor", String(cursor));
    const response = await apiRequest(`/households/${householdId}/expenses?${params}`);
    return response.json();
  },

  getExpenseByPeriod: async (
    householdId: number | string,
    range: ExpenseRange,
    status: ExpenseStatus,
  ) => {
    const response = await apiRequest(`/households/${householdId}/expenses/${range}/${status}`);
    return response.json();
  },

  approveExpense: async (householdId: number | string, expenseId: number | string) => {
    const response = await apiRequest(`/households/${householdId}/expenses/${expenseId}/approve`, {
      method: "PATCH",
    });
    return response.json();
  },

  rejectExpense: async (householdId: number | string, expenseId: number | string) => {
    const response = await apiRequest(`/households/${householdId}/expenses/${expenseId}/reject`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      return { success: true };
    }
    return response.json();
  },

  /**
   * Get AI-generated expense suggestions for a household
   */
  getExpenseSuggestions: async (householdId: number | string): Promise<string> => {
    const response = await apiRequest(`/households/${householdId}/suggestions`);
    return response.text();
  },
};
