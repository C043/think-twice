"use client";

import { createContext, useContext } from "react";
import { AppSettings, DEFAULT_SETTINGS } from "@/lib/settings";

const SettingsContext = createContext<AppSettings>(DEFAULT_SETTINGS);

/**
 * Seeded by the root layout, which reads the row on the server. A context and
 * not a client-side fetch: prices and dates are part of the server-rendered
 * markup, so the value has to be known before the first paint or the list
 * hydrates against different text.
 */
export function SettingsProvider({
  settings,
  children,
}: {
  settings: AppSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): AppSettings {
  return useContext(SettingsContext);
}
