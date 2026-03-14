"use client";

import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
    return <>{children}</>;
}
