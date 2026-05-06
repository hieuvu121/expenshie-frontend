import { Client } from "@stomp/stompjs";
import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAuthToken } from "../services/coreApi";
import {
  getExpenseWebSocketUrl,
  type ReceivedExpenseSocketEvent,
} from "../services/websocket";
import { useHousehold } from "./HouseholdContext";

type ConnectionState = "disconnected" | "connecting" | "connected";

interface ExpenseEventsContextType {
  connectionState: ConnectionState;
  lastExpenseEvent: ReceivedExpenseSocketEvent | null;
}

const ExpenseEventsContext = createContext<ExpenseEventsContextType | undefined>(undefined);
const MAX_TRANSPORT_RETRIES_AFTER_CONNECT = 3;

export const ExpenseEventsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeHousehold } = useHousehold();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastExpenseEvent, setLastExpenseEvent] = useState<ReceivedExpenseSocketEvent | null>(null);
  const clientRef = useRef<Client | null>(null);
  const hasConnectedRef = useRef(false);
  const transportErrorCountRef = useRef(0);
  const token = getAuthToken();

  useEffect(() => {
    const previousClient = clientRef.current;
    if (previousClient) {
      clientRef.current = null;
      void previousClient.deactivate();
    }

    if (!activeHousehold?.id || !token) {
      hasConnectedRef.current = false;
      transportErrorCountRef.current = 0;
      setConnectionState("disconnected");
      setLastExpenseEvent(null);
      return;
    }

    let isMounted = true;
    hasConnectedRef.current = false;
    transportErrorCountRef.current = 0;
    const client = new Client({
      brokerURL: getExpenseWebSocketUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      debug: () => undefined,
      onConnect: () => {
        if (!isMounted) {
          return;
        }

        hasConnectedRef.current = true;
        transportErrorCountRef.current = 0;
        setConnectionState("connected");
        client.subscribe(`/topic/households/${activeHousehold.id}/expense`, (message) => {
          try {
            const parsed = JSON.parse(message.body) as Omit<
              ReceivedExpenseSocketEvent,
              "receivedAt"
            >;
            setLastExpenseEvent({
              ...parsed,
              receivedAt: Date.now(),
            });
          } catch (error) {
            console.error("Failed to parse expense websocket event:", error);
          }
        });
      },
      onDisconnect: () => {
        if (isMounted) {
          setConnectionState("disconnected");
        }
      },
      onStompError: (frame) => {
        console.error("Expense websocket STOMP error:", frame.headers.message || frame.body);
        if (isMounted) {
          setConnectionState("disconnected");
        }
      },
      onWebSocketClose: () => {
        if (isMounted) {
          setConnectionState("disconnected");
        }
      },
      onWebSocketError: () => {
        transportErrorCountRef.current += 1;
        const allowRetry =
          hasConnectedRef.current &&
          transportErrorCountRef.current < MAX_TRANSPORT_RETRIES_AFTER_CONNECT;

        if (allowRetry) {
          return;
        }

        if (isMounted) {
          setConnectionState("disconnected");
        }

        client.reconnectDelay = 0;
        void client.deactivate();
      },
    });

    clientRef.current = client;
    setConnectionState("connecting");
    client.activate();

    return () => {
      isMounted = false;
      if (clientRef.current === client) {
        clientRef.current = null;
      }
      hasConnectedRef.current = false;
      transportErrorCountRef.current = 0;
      setConnectionState("disconnected");
      void client.deactivate();
    };
  }, [activeHousehold?.id, token]);

  const value = useMemo(
    () => ({
      connectionState,
      lastExpenseEvent,
    }),
    [connectionState, lastExpenseEvent],
  );

  return <ExpenseEventsContext.Provider value={value}>{children}</ExpenseEventsContext.Provider>;
};

export { ExpenseEventsContext };
