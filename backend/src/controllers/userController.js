import Report from "../models/Report.js";
export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const getReports = async (req, res) => {
  try {
    const userId = req.user._id;
    // Tìm tất cả báo cáo của user này, sắp xếp ngày mới nhất lên đầu
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    
    // Format lại dữ liệu cho chuẩn với Frontend
    const formattedReports = reports.map(r => ({
      id: r._id,
      date: r.date,
      type: r.type,
      status: r.status,
      avgHr: r.avgHr,
      avgSpo2: r.avgSpo2,
      steps: r.steps,
      calo: r.calo
    }));

    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error("Lỗi getReports:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
