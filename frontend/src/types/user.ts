export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  dob?: string;
  gender?: string;
  height?: number | string;
  weight?: number | string;
  healthGoal?: string;
  settings?: {
    heartRateTracking: boolean;
    spo2Tracking: boolean;
    healthAlerts: boolean;
    waterReminder: boolean;
    dataAnalysis: boolean;
    autoBackup: boolean;
  };
}
