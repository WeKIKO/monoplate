import { theme, type Theme } from "@monoplate/design-tokens";
import { createContext, useContext, type ReactNode } from "react";

const ThemeContext = createContext<Theme>(theme);
export function ThemeProvider({ children }: { children: ReactNode }) { return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>; }
export function useTheme() { return useContext(ThemeContext); }
