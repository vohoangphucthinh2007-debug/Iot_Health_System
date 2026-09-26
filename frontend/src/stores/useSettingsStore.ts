import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

type SettingKey = "heartRateTracking" | "spo2Tracking" | "healthAlerts" | "waterReminder" | "dataAnalysis" | "autoBackup";

interface SettingsState {
  darkMode: boolean;
  heartRateTracking: boolean;
  spo2Tracking: boolean;
  healthAlerts: boolean;
  waterReminder: boolean;
  dataAnalysis: boolean;
  autoBackup: boolean;
  isSyncingSettings: boolean;

  setDarkMode: (value: boolean) => void;
  toggleSetting: (key: SettingKey) => void;
  syncSettingsFromUser: (userSettings: Partial<Record<SettingKey, boolean>>) => void;
}

// Debounce helper — đợi 800ms sau lần gọi cuối mới thực sự gửi request
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debounceSyncToServer = (settings: Record<SettingKey, boolean>) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await api.put("users/settings", settings);
    } catch (err) {
      console.error("❌ Lỗi sync settings lên server:", err);
    }
  }, 800);
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      heartRateTracking: true,
      spo2Tracking: true,
      healthAlerts: true,
      waterReminder: true,
      dataAnalysis: true,
      autoBackup: true,
      isSyncingSettings: false,

      setDarkMode: (value) => set({ darkMode: value }),

      // Toggle local ngay lập tức, rồi debounce gửi lên DB
      toggleSetting: (key: SettingKey) => {
        set((state) => ({ [key]: !state[key] }));

        // Lấy state mới sau khi toggle để gửi lên server
        setTimeout(() => {
          const state = get();
          const settingsToSync: Record<SettingKey, boolean> = {
            heartRateTracking: state.heartRateTracking,
            spo2Tracking: state.spo2Tracking,
            healthAlerts: state.healthAlerts,
            waterReminder: state.waterReminder,
            dataAnalysis: state.dataAnalysis,
            autoBackup: state.autoBackup,
          };
          debounceSyncToServer(settingsToSync);
        }, 0);
      },

      // Đồng bộ settings từ server về (gọi sau khi fetchMe)
      syncSettingsFromUser: (userSettings) => {
        if (userSettings) {
          set({
            heartRateTracking: userSettings.heartRateTracking ?? get().heartRateTracking,
            spo2Tracking: userSettings.spo2Tracking ?? get().spo2Tracking,
            healthAlerts: userSettings.healthAlerts ?? get().healthAlerts,
            waterReminder: userSettings.waterReminder ?? get().waterReminder,
            dataAnalysis: userSettings.dataAnalysis ?? get().dataAnalysis,
            autoBackup: userSettings.autoBackup ?? get().autoBackup,
          });
        }
      },
    }),
    {
      name: "app-settings",
      partialize: (state) => ({
        darkMode: state.darkMode,
        heartRateTracking: state.heartRateTracking,
        spo2Tracking: state.spo2Tracking,
        healthAlerts: state.healthAlerts,
        waterReminder: state.waterReminder,
        dataAnalysis: state.dataAnalysis,
        autoBackup: state.autoBackup,
      }),
    }
  )
);
