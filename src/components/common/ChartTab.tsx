export type ChartTabValue = "DAILY" | "WEEKLY" | "MONTHLY";

interface ChartTabProps {
  selected: ChartTabValue;
  onChange: (value: ChartTabValue) => void;
}

const ChartTab: React.FC<ChartTabProps> = ({ selected, onChange }) => {
  const getButtonClass = (option: ChartTabValue) =>
    selected === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        onClick={() => onChange("DAILY")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "DAILY"
        )}`}
      >
        Daily
      </button>

      <button
        onClick={() => onChange("WEEKLY")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "WEEKLY"
        )}`}
      >
        Weekly
      </button>

      <button
        onClick={() => onChange("MONTHLY")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900   dark:hover:text-white ${getButtonClass(
          "MONTHLY"
        )}`}
      >
        Monthly
      </button>
    </div>
  );
};

export default ChartTab;
