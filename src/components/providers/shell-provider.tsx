"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type TopbarVariant = "light" | "dark";

interface ShellContextValue {
  theme: Theme;
  topbarVariant: TopbarVariant;
  sidebarCollapsed: boolean;
  filial: string;
  setTheme: (theme: Theme) => void;
  setTopbarVariant: (variant: TopbarVariant) => void;
  toggleSidebar: () => void;
  setFilial: (id: string) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [topbarVariant, setTopbarVariantState] = useState<TopbarVariant>("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filial, setFilialState] = useState("matriz");

  useEffect(() => {
    const savedTheme = localStorage.getItem("nx-theme") as Theme | null;
    const savedTopbar = localStorage.getItem("nx-topbar") as TopbarVariant | null;
    const savedFilial = localStorage.getItem("nx-filial");
    if (savedTheme) setThemeState(savedTheme);
    if (savedTopbar) setTopbarVariantState(savedTopbar);
    if (savedFilial) setFilialState(savedFilial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nx-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-topbar", topbarVariant);
    localStorage.setItem("nx-topbar", topbarVariant);
  }, [topbarVariant]);

  const setTheme = useCallback((value: Theme) => setThemeState(value), []);
  const setTopbarVariant = useCallback(
    (value: TopbarVariant) => setTopbarVariantState(value),
    [],
  );
  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    [],
  );
  const setFilial = useCallback((id: string) => {
    setFilialState(id);
    localStorage.setItem("nx-filial", id);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      topbarVariant,
      sidebarCollapsed,
      filial,
      setTheme,
      setTopbarVariant,
      toggleSidebar,
      setFilial,
    }),
    [
      theme,
      topbarVariant,
      sidebarCollapsed,
      filial,
      setTheme,
      setTopbarVariant,
      toggleSidebar,
      setFilial,
    ],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell deve ser usado dentro de ShellProvider");
  }
  return ctx;
}
