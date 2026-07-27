import {
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ThemeContext, type ThemeMode } from "./theme";

function initialMode(): ThemeMode {
  const stored = localStorage.getItem("portfolio-theme");
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem("portfolio-theme", mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => {
        setMode((current) => (current === "dark" ? "light" : "dark"));
      },
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
