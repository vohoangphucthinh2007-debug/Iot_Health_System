import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    avatarId: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
    },
    dob: {
      type: String, // Lưu dạng ISO string (YYYY-MM-DD)
      default: "",
    },
    gender: {
      type: String,
      enum: ["Nam", "Nữ", "Khác", "Chưa chọn", ""],
      default: "Chưa chọn",
    },
    height: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    healthGoal: {
      type: String,
      default: "Duy trì sức khỏe",
    },
    // Cài đặt ứng dụng
    settings: {
      heartRateTracking: { type: Boolean, default: true },
      spo2Tracking:      { type: Boolean, default: true },
      healthAlerts:      { type: Boolean, default: true },
      waterReminder:     { type: Boolean, default: true },
      dataAnalysis:      { type: Boolean, default: true },
      autoBackup:        { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
