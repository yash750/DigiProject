import React, { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "dark",  label: "Dark",  icon: "🌙" },
];

const ThemeContext = createContext(null);
const STORAGE_KEY = "am_theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
