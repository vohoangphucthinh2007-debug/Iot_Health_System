import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date:    { type: String, required: true }, // VD: "25/09/2026"
  type:    { type: String, default: "Báo cáo hàng ngày" },
  avgHr:   { type: Number, default: 0 },
  avgSpo2: { type: Number, default: 0 },
  maxHr:   { type: Number, default: 0 },
  minHr:   { type: Number, default: 0 },
  maxSpo2: { type: Number, default: 0 },
  minSpo2: { type: Number, default: 0 },
  steps:   { type: Number, default: 0 },
  status:  { type: String, default: "Hoàn thành" },

  // Nhận xét AI cá nhân hóa
  aiAnalysis: {
    status:       { type: String, default: "" },  // "Tốt" | "Bình thường" | "Cảnh báo"
    summary:      { type: String, default: "" },  // Câu nhận xét tổng quan
    advice:       { type: String, default: "" },  // Lời khuyên cụ thể
    warning_flag: { type: Boolean, default: false } // true nếu có chỉ số nguy hiểm
  }
});

export default mongoose.model("Report", reportSchema);
