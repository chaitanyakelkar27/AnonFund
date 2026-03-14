"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "anonfund.theme";

function applyTheme(theme: ThemeMode): void {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [theme, setThemeState] = useState<ThemeMode>("dark");

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const savedTheme = window.localStorage.getItem(STORAGE_KEY);
        if (savedTheme === "dark" || savedTheme === "light") {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
            return;
        }

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: ThemeMode = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyTheme(initialTheme);
    }, []);

    const setTheme = (nextTheme: ThemeMode) => {
        setThemeState(nextTheme);
        applyTheme(nextTheme);

        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}
