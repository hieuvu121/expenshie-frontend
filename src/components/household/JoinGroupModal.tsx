import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useHousehold } from "../../context/HouseholdContext";
import { householdAPI, isAuthenticated } from "../../services/api";
import { GroupIcon } from "../../icons";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [joinedGroupName, setJoinedGroupName] = useState<string | null>(null);

  const { refreshHouseholds, addHousehold, households, activeHousehold, setActiveHousehold, isLoading } = useHousehold();

  // Reset form when modal opens/closes and refresh households for the user
  useEffect(() => {
    if (isOpen) {
      setInviteCode("");
      setError(null);
      setSuccess(false);
      setJoinedGroupName(null);

      // Ensure we have the latest households when the modal opens
      if (isAuthenticated()) {
        refreshHouseholds().catch((err) => console.error("Failed to refresh households:", err));
      }
    }
  }, [isOpen]);

  // Handler to "re-join" (switch to) an already-joined household with one click
  const handleRejoin = async (household: { id: number; name: string; code?: string; role?: string }) => {
    setError(null);

    if (!isAuthenticated()) {
      setError("You must be signed in to join a group. Please sign in first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Set the selected household active and refresh the list
      setActiveHousehold(household as any);
      await refreshHouseholds();

      setSuccess(true);
      setJoinedGroupName(household.name);

      // Close modal shortly after success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setJoinedGroupName(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to switch household:", err);
      setError("Failed to join the selected group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Validate invite code format
   * Based on backend: UUID substring of 8 characters
   */
  const validateInviteCode = (code: string): boolean => {
    const trimmedCode = code.trim();
    
    // Check if code is exactly 8 characters
    if (trimmedCode.length !== 8) {
      return false;
    }

    // Check if code contains only alphanumeric characters
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(trimmedCode);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setSuccess(false);
    setJoinedGroupName(null);

    // Validate authentication
    if (!isAuthenticated()) {
      setError("You must be signed in to join a group. Please sign in first.");
      return;
    }

    // Validate invite code
    const trimmedCode = inviteCode.trim();
    
    if (!trimmedCode) {
      setError("Invite code is required");
      return;
    }

    if (!validateInviteCode(trimmedCode)) {
      setError("Invalid invite code format. Code must be exactly 8 alphanumeric characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend API to join household
      const response = await householdAPI.joinHousehold(trimmedCode);
      
      // Add household to context
      const newHousehold = {
        id: response.householdId,
        name: response.householdName,
        code: trimmedCode,
        role: response.role,
        memberId: response.memberId,
      };
      
      addHousehold(newHousehold);
      setJoinedGroupName(response.householdName);
      setSuccess(true);

      // Refresh households list
      await refreshHouseholds();

      // Close modal after delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setJoinedGroupName(null);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join group. Please check the invite code and try again.";
      setError(errorMessage);
      console.error("Error joining household:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change with validation
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to uppercase, remove spaces, and limit to 8 characters
    const upperValue = value.toUpperCase().replace(/\s/g, "").slice(0, 8);
    setInviteCode(upperValue);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Handle paste event to format code
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const formatted = pastedText.toUpperCase().replace(/\s/g, "").slice(0, 8);
    setInviteCode(formatted);
    if (error) {
      setError(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-brand-100 dark:bg-brand-900/20">
            <GroupIcon className="w-8 h-8 text-brand-500 dark:text-brand-400" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Join a Group
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the invite code to join an existing group
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-success-100 dark:bg-success-900/20">
              <svg
                className="w-8 h-8 text-success-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Successfully Joined!
            </h3>
            {joinedGroupName && (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                You've joined <span className="font-medium text-brand-500">{joinedGroupName}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Redirecting...
            </p>
          </div>
        ) : (
          /* Existing groups + Form */
          <>
            {/* List of groups the user has already joined */}
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Your Groups</h4>
              {isLoading ? (
                <p className="text-sm text-gray-500">Loading your groups...</p>
              ) : households && households.length > 0 ? (
                <div className="space-y-2">
                  {households.map((h) => {
                    const isCurrent = activeHousehold?.id === h.id;
                    return (
                      <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white/90">{h.name}</div>
                          <div className="text-xs text-gray-500">
                            Code:{" "}
                            <span className="font-mono font-medium text-brand-600 dark:text-brand-400">
                              {h.code || "Unavailable"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">Admin: {h.role === 'ROLE_ADMIN' ? 'You' : 'Unknown'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRejoin(h)}
                          disabled={isSubmitting || isCurrent}
                          className={isCurrent ? "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 cursor-default" : "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"}
                        >
                          {isCurrent ? 'Currently' : 'Join'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">You haven't joined any groups yet. Use the code below to join a group.</p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Invite Code Input */}
                <div>
                  <Label htmlFor="inviteCode">
                    Invite Code <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    placeholder="ABCD1234"
                    value={inviteCode}
                    onChange={handleCodeChange}
                    onPaste={handlePaste}
                    disabled={isSubmitting}
                    maxLength={8}
                    autoFocus
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-center text-lg font-mono tracking-widest uppercase shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                      error
                        ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
                        : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {inviteCode.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs text-gray-400">
                        {inviteCode.length}/8
                      </span>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mt-2 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-error-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-xs text-error-500">{error}</p>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Enter the 8-character invite code provided by the group admin
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteCode.trim() || inviteCode.length !== 8}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    "Join Group"
                  )}
                </button>
              </div>
            </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
