import Report from "../models/Report.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

// GET /api/users/me
export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { displayName, phone, dob, gender, height, weight, healthGoal } = req.body;

    const targetId = req.user?._id || req.user?.userId || req.user?.id;
    if (!targetId) {
      return res.status(401).json({ message: "Lỗi: Không lấy được ID từ Token!" });
    }

    const updateFields = {};
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (phone !== undefined)       updateFields.phone = phone;
    if (dob !== undefined)         updateFields.dob = dob;
    if (gender !== undefined)      updateFields.gender = gender;
    if (height !== undefined)      updateFields.height = height ? Number(height) : null;
    if (weight !== undefined)      updateFields.weight = weight ? Number(weight) : null;
    if (healthGoal !== undefined)  updateFields.healthGoal = healthGoal;

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-hashedPassword");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng trong database" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ Lỗi cập nhật profile:", error);
    return res.status(500).json({ message: "Lỗi Server", detail: error.message });
  }
};

// PUT /api/users/settings
export const updateSettings = async (req, res) => {
  try {
    const targetId = req.user?._id || req.user?.userId || req.user?.id;
    if (!targetId) {
      return res.status(401).json({ message: "Lỗi: Không lấy được ID từ Token!" });
    }

    const { heartRateTracking, spo2Tracking, healthAlerts, waterReminder, dataAnalysis, autoBackup } = req.body;

    const settingsUpdate = {};
    if (heartRateTracking !== undefined) settingsUpdate["settings.heartRateTracking"] = heartRateTracking;
    if (spo2Tracking !== undefined)      settingsUpdate["settings.spo2Tracking"] = spo2Tracking;
    if (healthAlerts !== undefined)      settingsUpdate["settings.healthAlerts"] = healthAlerts;
    if (waterReminder !== undefined)     settingsUpdate["settings.waterReminder"] = waterReminder;
    if (dataAnalysis !== undefined)      settingsUpdate["settings.dataAnalysis"] = dataAnalysis;
    if (autoBackup !== undefined)        settingsUpdate["settings.autoBackup"] = autoBackup;

    const updatedUser = await User.findByIdAndUpdate(
      targetId,
      { $set: settingsUpdate },
      { new: true }
    ).select("-hashedPassword");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json(updatedUser.settings);
  } catch (error) {
    console.error("❌ Lỗi cập nhật settings:", error);
    return res.status(500).json({ message: "Lỗi Server", detail: error.message });
  }
};

// PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const targetId = req.user?._id || req.user?.userId || req.user?.id;
    if (!targetId) return res.status(401).json({ message: "Không tìm thấy ID người dùng" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi Server", detail: error.message });
  }
};

// GET /api/users/reports
export const getReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });

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
