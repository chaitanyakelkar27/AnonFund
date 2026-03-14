"use client";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle({ className }: { className?: string } = {}): React.JSX.Element {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className={className}
        >
            {theme === "dark" ? "Light" : "Dark"} Theme
        </button>
    );
}
