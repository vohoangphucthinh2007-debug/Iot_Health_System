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
}
