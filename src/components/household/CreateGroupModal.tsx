import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useHousehold } from "../../context/HouseholdContext";
import { householdAPI, isAuthenticated } from "../../services/api";
import { GroupIcon } from "../../icons";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdGroupName, setCreatedGroupName] = useState<string | null>(null);
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);

  const { refreshHouseholds, addHousehold } = useHousehold();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setError(null);
      setSuccess(false);
      setCreatedGroupName(null);
      setCreatedGroupCode(null);
    }
  }, [isOpen]);

  /**
   * Validate group name
   */
  const validateGroupName = (name: string): boolean => {
    const trimmedName = name.trim();
    
    // Check if name is between 3 and 50 characters
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setSuccess(false);
    setCreatedGroupName(null);
    setCreatedGroupCode(null);

    // Validate authentication
    if (!isAuthenticated()) {
      setError("You must be signed in to create a group. Please sign in first.");
      return;
    }

    // Validate group name
    const trimmedName = groupName.trim();
    
    if (!trimmedName) {
      setError("Group name is required");
      return;
    }

    if (!validateGroupName(trimmedName)) {
      setError("Group name must be between 3 and 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend API to create household
      const response = await householdAPI.createHousehold(trimmedName);
      
      // Add household to context
      const newHousehold = {
        id: response.id,
        name: response.name,
        code: response.code || "", // The backend should return the code
        role: response.role,
        memberId: response.memberId,
      };
      
      addHousehold(newHousehold);
      setCreatedGroupName(response.name);
      setCreatedGroupCode(response.code || "");
      setSuccess(true);

      // Refresh households list
      await refreshHouseholds();

      // Close modal after delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCreatedGroupName(null);
        setCreatedGroupCode(null);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create group. Please try again.";
      setError(errorMessage);
      console.error("Error creating household:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGroupName(value);
    
    // Clear error when user starts typing
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
            Create a Group
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a new group and invite others to join
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
              Group Created!
            </h3>
            {createdGroupName && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-brand-500">{createdGroupName}</span> has been created successfully
                </p>
                {createdGroupCode && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Share code: <span className="font-mono font-medium text-brand-600 dark:text-brand-400">{createdGroupCode}</span>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Redirecting...
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Group Name Input */}
              <div>
                <Label htmlFor="groupName">
                  Group Name <span className="text-error-500">*</span>
                </Label>
                <input
                  id="groupName"
                  name="groupName"
                  type="text"
                  placeholder="e.g., Family Expenses"
                  value={groupName}
                  onChange={handleNameChange}
                  disabled={isSubmitting}
                  maxLength={50}
                  autoFocus
                  className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
                    error
                      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
                      : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    3-50 characters required
                  </p>
                  {groupName.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {groupName.length}/50
                    </span>
                  )}
                </div>
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
                You will be set as the admin of this group. You can invite others using the share code.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
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
                disabled={isSubmitting || !groupName.trim() || !validateGroupName(groupName)}
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
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
