import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import MultiSelect from "../../components/form/MultiSelect";
import Radio from "../../components/form/input/Radio";

import { useHousehold } from "../../context/HouseholdContext";
import { householdAPI } from "../../services/householdApi";

type SplitMethod = "EQUAL" | "AMOUNT";

interface Member {
  id: number;
  name: string;
}

interface ExpenseState {
  id: number;
  amount?: number | string;
  date?: string;
  category?: string;
  description?: string;
  currency?: string;
  method?: string;
}

export default function EditExpense() {
  const { activeHousehold } = useHousehold();
  const location = useLocation();
  const navigate = useNavigate();

  const expense = location.state?.expense as ExpenseState | undefined;

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (!activeHousehold?.id) {
      setMembers([]);
      return;
    }
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const memberData = await householdAPI.getHouseholdMembers(activeHousehold.id);
        setMembers(memberData.map((m: { memberId: number; fullName: string }) => ({
          id: m.memberId,
          name: m.fullName,
        })));
      } catch {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [activeHousehold?.id]);

  const formatDate = (value?: string) => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
  };

  const currencyOptions = useMemo(() => [
    { value: "AUD", label: "AUD" },
    { value: "VND", label: "VND" },
    { value: "USD", label: "USD" },
  ], []);

  const categoryOptions = useMemo(() => [
    { value: "FOOD", label: "Food" },
    { value: "TRANSPORT", label: "Transport" },
    { value: "RENT", label: "Rent" },
    { value: "BILLS", label: "Bills" },
    { value: "SHOPPING", label: "Shopping" },
    { value: "ENTERTAINMENT", label: "Entertainment" },
    { value: "OTHER", label: "Other" },
  ], []);

  const memberMultiOptions = useMemo(() =>
    members.map((m) => ({ value: String(m.id), text: m.name, selected: false })),
    [members]
  );

  // Form state — pre-filled from expense passed via navigation
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount !== undefined ? String(expense.amount) : "");
  const [currency, setCurrency] = useState(expense?.currency || "AUD");
  const [date, setDate] = useState(formatDate(expense?.date));
  const [category, setCategory] = useState(expense?.category || "FOOD");
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>((expense?.method as SplitMethod) || "EQUAL");
  const [splitValues, setSplitValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedParticipants = useMemo(
    () => members.filter((m) => participants.includes(String(m.id))),
    [members, participants]
  );

  const setSplitValue = (userId: number | string, value: string) => {
    const num = Number(value);
    const key = String(userId);
    setSplitValues((prev) => ({ ...prev, [key]: Number.isFinite(num) ? num : 0 }));
  };

  const amountNumber = Number(amount);

  const calculateSplits = (): Array<{ memberId: number; amount: number }> => {
    const participantIds = selectedParticipants.map((p) => p.id);
    const splitCount = participantIds.length;

    if (splitMethod === "EQUAL") {
      return participantIds.map((memberId) => ({
        memberId,
        amount: Math.round((amountNumber / splitCount) * 100) / 100,
      }));
    }
    return participantIds.map((memberId) => ({
      memberId,
      amount: splitValues[String(memberId)] || 0,
    }));
  };

  const totalSplitAmount = selectedParticipants
    .map((p) => splitValues[String(p.id)] || 0)
    .reduce((a, b) => a + b, 0);

  const isSplitAmountValid =
    splitMethod === "EQUAL" ||
    (splitMethod === "AMOUNT" && Math.abs(totalSplitAmount - amountNumber) < 0.01);

  const canSubmit =
    activeHousehold &&
    expense?.id &&
    !isLoading &&
    amountNumber > 0 &&
    (participants.length === 0 || isSplitAmountValid);

  const handleSubmit = async () => {
    if (!canSubmit || !activeHousehold || !expense?.id) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const splits = participants.length > 0 ? calculateSplits() : undefined;

      await householdAPI.updateExpense(activeHousehold.id, expense.id, {
        amount: amountNumber,
        date,
        category,
        description: description.trim(),
        method: splitMethod,
        currency,
        splits,
      });

      setSuccessMessage("Expense updated successfully!");
      setTimeout(() => {
        navigate("/basic-tables");
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update expense.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!expense) {
    return (
      <div className="p-6 text-gray-600 dark:text-gray-300">
        No expense data found.{" "}
        <button
          className="text-brand-500 underline"
          onClick={() => navigate("/basic-tables")}
        >
          Go back to Expense List
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Edit Expense | Expense Management" description="Edit an existing expense" />
      <PageBreadcrumb pageTitle="Edit Expense" />

      {successMessage && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT: Expense Details */}
        <div className="space-y-6">
          <ComponentCard title="Expense Details">
            <div className="space-y-6">
              <div>
                <Label>Description</Label>
                <Input
                  type="text"
                  placeholder="Dinner, Groceries, Electricity bill..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {amountNumber <= 0 && amount !== "" && (
                    <p className="mt-2 text-sm text-red-500">Amount must be greater than 0.</p>
                  )}
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    options={currencyOptions}
                    placeholder="Select currency"
                    defaultValue={currency}
                    onChange={(v) => setCurrency(v)}
                    className="dark:bg-dark-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    options={categoryOptions}
                    placeholder="Select category"
                    defaultValue={category}
                    onChange={(v) => setCategory(v)}
                    className="dark:bg-dark-900"
                  />
                </div>
              </div>

              {/* Participants — optional for update */}
              <div>
                {loadingMembers ? (
                  <p className="text-sm text-gray-500">Loading members...</p>
                ) : (
                  <MultiSelect
                    label="Update Participants (optional)"
                    options={memberMultiOptions}
                    defaultSelected={participants}
                    onChange={(values) => setParticipants(values)}
                  />
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to keep existing splits unchanged.
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* Split method — only shown if participants selected */}
          {participants.length > 0 && (
            <ComponentCard title="Split Method">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-8">
                  <Radio
                    id="split-equal"
                    name="split"
                    value="EQUAL"
                    checked={splitMethod === "EQUAL"}
                    onChange={() => setSplitMethod("EQUAL")}
                    label="Split equally"
                  />
                  <Radio
                    id="split-amount"
                    name="split"
                    value="AMOUNT"
                    checked={splitMethod === "AMOUNT"}
                    onChange={() => setSplitMethod("AMOUNT")}
                    label="By amount"
                  />
                </div>

                {splitMethod === "AMOUNT" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total must equal {amountNumber.toFixed(2)} {currency}.
                    </p>
                    <div className="space-y-3">
                      {selectedParticipants.map((p) => (
                        <div key={p.id} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{p.name}</p>
                          <div className="sm:col-span-2">
                            <Input
                              type="number"
                              placeholder="0"
                              value={splitValues[String(p.id)] !== undefined ? String(splitValues[String(p.id)]) : ""}
                              onChange={(e) => setSplitValue(p.id, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Allocated:</p>
                        <p className={`text-sm font-semibold ${isSplitAmountValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {totalSplitAmount.toFixed(2)} / {amountNumber.toFixed(2)} {currency}
                        </p>
                      </div>
                    </div>

                    {!isSplitAmountValid && (
                      <p className="mt-2 text-sm text-red-500">
                        Total allocated must equal {amountNumber.toFixed(2)} {currency}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ComponentCard>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="space-y-6">
          <ComponentCard title="Actions">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/basic-tables")}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
