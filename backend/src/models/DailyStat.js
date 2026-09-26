import mongoose from "mongoose";

const dailyStatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Định dạng: "YYYY-MM-DD"
  totalHr: { type: Number, default: 0 },
  totalSpo2: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  maxHr: { type: Number, default: 0 },
  minSpo2: { type: Number, default: 100 },
  steps: { type: Number, default: 0 },
  calories: { type: Number, default: 0 }
});

export default mongoose.model("DailyStat", dailyStatSchema);