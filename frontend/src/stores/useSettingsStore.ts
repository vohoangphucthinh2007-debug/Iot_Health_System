import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  darkMode: boolean;
  heartRateTracking: boolean;
  spo2Tracking: boolean;
  healthAlerts: boolean;
  waterReminder: boolean;
  dataAnalysis: boolean;
  autoBackup: boolean;

  toggleSetting: (key: Omit<keyof SettingsState, "toggleSetting" | "setDarkMode">) => void;
  setDarkMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      heartRateTracking: true,
      spo2Tracking: true,
      healthAlerts: true,
      waterReminder: true,
      dataAnalysis: true,
      autoBackup: true,

      setDarkMode: (value) => set({ darkMode: value }),

      toggleSetting: (key) =>
        set((state) => ({ [key as string]: !state[key as keyof SettingsState] })),
    }),
    {
      name: "app-settings", // key trong localStorage
    }
  )
);
