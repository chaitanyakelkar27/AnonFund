"use client";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle({ className }: { className?: string } = {}): React.JSX.Element {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className={className}
        >
            {isDark ? (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M12 4.5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1V6a1 1 0 0 1-2 0V4.5Zm0 13.5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1V20a1 1 0 0 1-2 0v-2ZM4.5 11a1 1 0 0 1 1-1H7a1 1 0 0 1 0 2H5.5a1 1 0 0 1-1-1Zm11.5 0a1 1 0 0 1 1-1H18.5a1 1 0 0 1 0 2H17a1 1 0 0 1-1-1ZM6.343 6.343a1 1 0 0 1 1.414 0L8.96 7.546a1 1 0 0 1-1.414 1.414L6.343 7.757a1 1 0 0 1 0-1.414Zm8.697 8.697a1 1 0 0 1 1.414 0l1.204 1.204a1 1 0 1 1-1.414 1.414l-1.204-1.204a1 1 0 0 1 0-1.414Zm0-8.697a1 1 0 0 1 0 1.414l-1.204 1.204a1 1 0 0 1-1.414-1.414l1.204-1.204a1 1 0 0 1 1.414 0ZM6.343 17.657a1 1 0 0 1 0-1.414l1.204-1.204a1 1 0 0 1 1.414 1.414l-1.204 1.204a1 1 0 0 1-1.414 0ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
                    />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M20.5 15.5a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z"
                    />
                </svg>
            )}
        </button>
    );
}
