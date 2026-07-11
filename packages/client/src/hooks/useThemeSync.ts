import { useEffect } from "react";
import { applyTheme, useUIStore } from "@/store/uiStore";

export function useThemeSync(): void {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme]);
}
