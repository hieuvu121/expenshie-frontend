import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import JoinGroupModal from "../components/household/JoinGroupModal";
import CreateGroupModal from "../components/household/CreateGroupModal";
import { useHousehold } from "../context/HouseholdContext";
import { GroupIcon } from "../icons";

export default function NoGroupsOnboarding() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { households } = useHousehold();
  const navigate = useNavigate();

  // If user joins/creates a group, redirect to dashboard
  useEffect(() => {
    if (households.length > 0) {
      navigate("/", { replace: true });
    }
  }, [households, navigate]);

  

  return (
    <>
      <PageMeta
        title="Welcome | TailAdmin - React.js Admin Dashboard Template"
        description="Create or join a group to get started"
      />

      <div className="flex min-h-screen items-center justify-center px-4 py-6">
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-full bg-brand-100 dark:bg-brand-900/20">
            <GroupIcon className="w-10 h-10 text-brand-500 dark:text-brand-400" />
          </div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-bold text-gray-800 dark:text-white/90">
            Welcome to Expense Manager
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Create a new group or join an existing one to start managing expenses with others.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-theme-xs hover:bg-brand-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create New Group
            </button>

            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full inline-flex items-center justify-center rounded-lg border-2 border-brand-500 px-6 py-3 text-base font-semibold text-brand-500 dark:text-brand-400 dark:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Join Existing Group
            </button>
          </div>

          {/* Info Text */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            You can always create or join more groups later from the dashboard.
          </p>
        </div>
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
