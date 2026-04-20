"use client";

import { createContext, useContext, useState } from "react";
import type { SidebarKey } from "./sidebar.types";

interface LayoutContextType {
  active: SidebarKey;
  setActive: (key: SidebarKey) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<SidebarKey>("dashboard");

  return (
    <LayoutContext.Provider value={{ active, setActive }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used inside LayoutProvider");
  }
  return ctx;
}
