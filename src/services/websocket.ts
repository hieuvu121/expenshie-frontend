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

/**
 * STOMP endpoint. notification-service registers it at /ws and the gateway
 * routes /ws/** there, so the path is /ws — NOT under the /app/v1 API prefix.
 * (It previously derived `<apiBase>/chat`, which matched no gateway route.)
 *
 * Resolved against the page origin so it follows whatever host and scheme the
 * app is served from, and upgrades to wss: automatically under HTTPS.
 */
export const getExpenseWebSocketUrl = () => {
  const origin = new URL(window.location.origin);
  const protocol = origin.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${origin.host}/ws`;
};
