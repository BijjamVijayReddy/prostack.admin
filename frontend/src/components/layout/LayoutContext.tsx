"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import type { SidebarKey } from "./sidebar.types";

interface LayoutContextType {
  active: SidebarKey;
  setActive: (key: SidebarKey) => void; // kept for compatibility
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const active: SidebarKey =
    pathname === "/" ? "dashboard"
    : pathname.startsWith("/students") ? "students"
    : pathname.startsWith("/enquiry") ? "enquiry"
    : pathname.startsWith("/placements") ? "placements"
    : "dashboard";

  return (
    <LayoutContext.Provider value={{ active, setActive: () => {} }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used inside LayoutProvider");
  return ctx;
}