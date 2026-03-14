"use client";

import { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }): React.JSX.Element {
    return <>{children}</>;
}
