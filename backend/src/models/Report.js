import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // VD: "25/09/2026"
  type: { type: String, default: "Báo cáo hàng ngày" },
  avgHr: { type: Number, default: 0 },
  avgSpo2: { type: Number, default: 0 },
  totalSteps: { type: Number, default: 0 },
  totalCalories: { type: Number, default: 0 },
  status: { type: String, default: "Hoàn thành" }
});

export default mongoose.model("Report", reportSchema);