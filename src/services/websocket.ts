import { API_BASE_URL } from "./coreApi";

export interface ExpenseSocketEventData {
  id?: number;
  amount?: number | string | null;
  category?: string | null;
  createdBy?: string | null;
  currency?: string | null;
  date?: string | null;
  description?: string | null;
  method?: string | null;
  status?: string | null;
}

export interface ExpenseSocketEvent {
  type: string;
  householdId: number;
  data: ExpenseSocketEventData;
}

export interface ReceivedExpenseSocketEvent extends ExpenseSocketEvent {
  receivedAt: number;
}

const normalizePath = (pathname: string) => pathname.replace(/\/$/, "");

export const getExpenseWebSocketUrl = () => {
  const apiUrl = new URL(API_BASE_URL, window.location.origin);
  const basePath = normalizePath(apiUrl.pathname);
  const websocketPath = `${basePath}/chat`.replace(/\/{2,}/g, "/");
  const websocketProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";

  return `${websocketProtocol}//${apiUrl.host}${websocketPath}`;
};
