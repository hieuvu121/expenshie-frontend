import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { householdAPI } from "../../services/householdApi";

interface AISuggestionsProps {
    householdId: number | string;
}

const PREVIEW_PARAGRAPHS = 2;

export default function AISuggestions({ householdId }: AISuggestionsProps) {
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        setIsExpanded(false);

        try {
            const result = await householdAPI.getExpenseSuggestions(householdId);
            setSuggestions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch suggestions");
        } finally {
            setIsLoading(false);
        }
    };

    const previewText = (() => {
        if (!suggestions || isExpanded) return suggestions;
        const paragraphs = suggestions.split(/\n\n+/);
        if (paragraphs.length <= PREVIEW_PARAGRAPHS) return suggestions;
        return paragraphs.slice(0, PREVIEW_PARAGRAPHS).join("\n\n") + "\n\n...";
    })();

    const needsExpand = (() => {
        if (!suggestions) return false;
        return suggestions.split(/\n\n+/).length > PREVIEW_PARAGRAPHS;
    })();

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                        💡 AI Expense Insights
                    </span>
                </div>
                {!suggestions && (
                    <button
                        onClick={handleFetchSuggestions}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="mr-2 h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
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
                                Getting Insights...
                            </>
                        ) : (
                            "Get AI Suggestions"
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400">Error: {error}</p>
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <svg
                        className="h-8 w-8 animate-spin text-brand-500"
                        xmlns="http://www.w3.org/2000/svg"
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
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                        Analyzing your spending...
                    </span>
                </div>
            )}

            {suggestions && !isLoading && (
                <>
                    <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-white prose-strong:text-gray-800 dark:prose-strong:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {previewText ?? ""}
                        </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-3">
                        {needsExpand && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
                            >
                                {isExpanded ? "Show Less ▲" : "Show More ▼"}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSuggestions(null);
                                setIsExpanded(false);
                            }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            Refresh
                        </button>
                    </div>
                </>
            )}

            {!suggestions && !isLoading && !error && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Click the button above to get AI-powered insights about your household expenses.
                </p>
            )}
        </div>
    );
}
