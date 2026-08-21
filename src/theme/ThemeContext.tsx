import React,{createContext,useContext}from"react";

// Single source of truth for the dark/light appearance preference. Before
// this, HomeScreen fetched `workspace.preferences.appearance` on its own and
// kept it in local state — every other screen either didn't fetch it at all
// or fetched its own separate copy that never stayed in sync (ProfileScreen's
// theme toggle would save to the database but the Home screen behind it
// wouldn't update until its next full remount). Appearance now lives once in
// App.tsx and is provided down through context, so a toggle from Profile or
// Settings is reflected everywhere immediately.
type ThemeValue = { dark: boolean; setDark: (value: boolean) => void };
const ThemeContext = createContext<ThemeValue>({ dark: false, setDark: () => {} });

export function ThemeProvider({ dark, setDark, children }: { dark: boolean; setDark: (value: boolean) => void; children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
