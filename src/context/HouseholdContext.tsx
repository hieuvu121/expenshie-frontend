import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { householdAPI, isAuthenticated } from "../services/api";

interface Household {
  id: number;
  name: string;
  code: string;
  role: string;
  memberId?: number;
}

interface HouseholdContextType {
  households: Household[];
  activeHousehold: Household | null;
  isLoading: boolean;
  error: string | null;
  refreshHouseholds: () => Promise<void>;
  setActiveHousehold: (household: Household | null) => void;
  addHousehold: (household: Household) => void;
  clearHouseholds: () => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHousehold, setActiveHouseholdState] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);


  /**
   * Fetch households from backend
   */
  const refreshHouseholds = async () => {
    setIsLoading(true);
    setError(null);

    if (!isAuthenticated()) {
      setHouseholds([]);
      setActiveHousehold(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await householdAPI.getMyHouseholds();
      setHouseholds(data);

      // Prefer saved active household id so we pick the DB-returned object (with up-to-date role)
      const savedHouseholdId = localStorage.getItem("activeHouseholdId");
      if (savedHouseholdId) {
        const found = data.find((h: Household) => h.id.toString() === savedHouseholdId);
        if (found) {
          setActiveHouseholdState(found);
        } else if (data.length > 0) {
          setActiveHouseholdState(data[0]);
        } else {
          setActiveHouseholdState(null);
        }
      } else {
        // If there is an existing activeHousehold selection, refresh it from server data to get latest role
        if (activeHousehold) {
          const refreshed = data.find((h: Household) => h.id === activeHousehold.id);
          if (refreshed) {
            setActiveHouseholdState(refreshed);
          } else if (data.length > 0) {
            setActiveHouseholdState(data[0]);
          } else {
            setActiveHouseholdState(null);
          }
        } else {
          if (data.length > 0) setActiveHouseholdState(data[0]);
          else setActiveHouseholdState(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch households");
      console.error("Error fetching households:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new household to the list (after joining)
   */
  const addHousehold = (household: Household) => {
    setHouseholds((prev) => {
      // Check if household already exists
      if (prev.some((h) => h.id === household.id)) {
        return prev;
      }
      return [...prev, household];
    });

    // Set the newly joined household as active
    // Use the exact object (to include role) returned by backend when possible
    setActiveHouseholdState(household);
  };

  /**
   * Clear households and active selection (used on login to force onboarding)
   */
  const clearHouseholds = () => {
    setHouseholds([]);
    setActiveHousehold(null);
    localStorage.removeItem("activeHouseholdId");
    localStorage.removeItem("memberId");
    localStorage.removeItem("memberRole");
  };

  // Load households on mount and when authentication changes
  useEffect(() => {
    console.log("HouseholdProvider mounting, checking authentication...");
    if (isAuthenticated()) {
      console.log("User is authenticated, fetching households...");
      refreshHouseholds();
    } else {
      console.log("User is not authenticated");
      setIsLoading(false);
    }
  }, []);

  // Save active household to localStorage
  useEffect(() => {
    if (activeHousehold) {
      localStorage.setItem("activeHouseholdId", activeHousehold.id.toString());
      console.log("Saved activeHouseholdId to localStorage:", activeHousehold.id);

      if (activeHousehold.memberId) {
        localStorage.setItem("memberId", activeHousehold.memberId.toString());
        console.log("Saved memberId to localStorage:", activeHousehold.memberId);
      } else {
        console.warn("No memberId in activeHousehold:", activeHousehold);
      }

      if (activeHousehold.role) {
        localStorage.setItem("memberRole", activeHousehold.role);
      }
    }
  }, [activeHousehold]);

  // Load active household from localStorage on mount
  useEffect(() => {
    const savedHouseholdId = localStorage.getItem("activeHouseholdId");
    if (savedHouseholdId && households.length > 0) {
      const household = households.find((h) => h.id.toString() === savedHouseholdId);
      if (household) {
        setActiveHouseholdState(household);
      }
    }
  }, [households]);

  return (
    <HouseholdContext.Provider
      value={{
        households,
        activeHousehold,
        isLoading,
        error,
        refreshHouseholds,
        setActiveHousehold: (household: Household | null) => {
          // When consumers set active household, prefer the canonical object from `households`
          if (household && households.length > 0) {
            const found = households.find((h) => h.id === household.id);
            if (found) {
              setActiveHouseholdState(found);
              return;
            }
          }
          setActiveHouseholdState(household);
        },
        addHousehold,
        clearHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};

