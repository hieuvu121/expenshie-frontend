// Use the configured backend URL, falling back to local API when unset.
const DEFAULT_API_BASE_URL = "http://localhost:8080/app/v1";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Save auth token to localStorage
 */
export const saveAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

/**
 * Remove auth token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem("authToken");
};

/**
 * Clear all locally persisted auth/session data
 */
export const clearAuthSession = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("activeHouseholdId");
  localStorage.removeItem("memberId");
  localStorage.removeItem("memberRole");
};

/**
 * Make authenticated API request
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("User is not authenticated. Please sign in.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...((options as any).headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const apiError = new Error(errorData.message || `API request failed: ${response.statusText}`) as Error & Record<string, unknown>;
    Object.assign(apiError, errorData);
    throw apiError;
  }

  return response;
};

/**
 * Log out current user on backend
 */
export const logoutUser = async (): Promise<void> => {
  await apiRequest("/logout", { method: "POST" });
};
