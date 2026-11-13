import Report from "../models/Report.js";
import DailyStat from "../models/DailyStat.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { askGeminiJSON, calcAge } from "../lib/gemini.js";

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
    const { displayName, phone, dob, gender, height, weight, healthGoal, deviceId } = req.body;

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
    if (deviceId !== undefined)    updateFields.deviceId = deviceId.trim();

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
      id:      r._id,
      date:    r.date,
      type:    r.type,
      status:  r.status,
      avgHr:   Math.round(r.avgHr || 0),
      avgSpo2: Math.round(r.avgSpo2 || 0),
      maxHr:   Math.round(r.maxHr || 0),
      minHr:   Math.round(r.minHr || 0),
      maxSpo2: Math.round(r.maxSpo2 || 0),
      minSpo2: Math.round(r.minSpo2 || 0),
      steps:   Math.round(r.steps || 0),
      // Nhận xét AI cá nhân hóa
      aiAnalysis: r.aiAnalysis || null
    }));

    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error("Lỗi getReports:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /api/users/today-stat — Lấy thống kê tích lũy trong ngày từ Database (số nguyên)
export const getTodayStat = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const stat = await DailyStat.findOne({ userId, date: today });

    if (!stat) {
      return res.status(200).json(null);
    }

    const avgHr = stat.count > 0 ? Math.round(stat.totalHr / stat.count) : 0;
    const avgSpo2 = stat.count > 0 ? Math.round(stat.totalSpo2 / stat.count) : 0;

    return res.status(200).json({
      avgHr:   Math.round(avgHr),
      avgSpo2: Math.round(avgSpo2),
      maxHr:   Math.round(stat.maxHr || 0),
      minHr:   Math.round(stat.minHr === 999 ? 0 : (stat.minHr || 0)),
      maxSpo2: Math.round(stat.maxSpo2 || 0),
      minSpo2: Math.round(stat.minSpo2 === 100 ? 0 : (stat.minSpo2 || 0)),
      steps:   Math.round(stat.steps || 0),
      count:   Math.round(stat.count || 0)
    });
  } catch (error) {
    console.error("Lỗi getTodayStat:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


// ==========================================
// AI: NHẬN ĐỊNH SỨC KHOẺ & TÍNH CALO (dùng Gemini API key ở server)
// ==========================================
const aiCache = new Map(); // key → { at, data }
const CACHE_MS = 2 * 60 * 1000;

const toInt = (v) => Math.round(Number(v) || 0);

function profileOf(user) {
  return {
    age: calcAge(user.dob),
    gender: user.gender && user.gender !== "Chưa chọn" ? user.gender : null,
    height: user.height || null,
    weight: user.weight || null,
    goal: user.healthGoal || "Duy trì sức khỏe",
  };
}

// Công thức dự phòng: sải chân ≈ 0.415 × chiều cao; ~0.57 kcal/kg/km
function localCalories(steps, p) {
  const h = p.height || 165;
  const w = p.weight || 60;
  const distanceM = Math.round(steps * h * 0.415 / 100);
  const calories = Math.round(0.57 * w * (distanceM / 1000));
  return { calories, distanceM };
}

// POST /api/users/calories  { steps, avgHr }
export const getCalories = async (req, res) => {
  try {
    const user = req.user;
    const steps = toInt(req.body?.steps);
    const avgHr = toInt(req.body?.avgHr);
    const p = profileOf(user);
    const local = localCalories(steps, p);

    if (steps <= 0) return res.status(200).json({ calories: 0, distanceM: 0, source: "none", note: "" });
    if (!p.height || !p.weight) {
      return res.status(200).json({ ...local, source: "estimate", missingProfile: true,
        note: "Hãy nhập chiều cao & cân nặng trong hồ sơ để tính calo chính xác hơn." });
    }

    const key = `cal_${user._id}_${Math.round(steps / 50)}_${p.height}_${p.weight}_${p.age}`;
    const hit = aiCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return res.status(200).json(hit.data);

    let data = { ...local, source: "formula", note: "" };
    try {
      const prompt = `Bạn là chuyên gia sinh lý vận động. Tính lượng calo (kcal) người dùng đã tiêu thụ từ hoạt động đi bộ/di chuyển hôm nay dựa vào dữ liệu vòng tay.
Hồ sơ: tuổi ${p.age ?? "không rõ"}, giới tính ${p.gender ?? "không rõ"}, chiều cao ${p.height} cm, cân nặng ${p.weight} kg, mục tiêu: ${p.goal}.
Dữ liệu: ${steps} bước, nhịp tim trung bình ${avgHr || "không rõ"} BPM.
Chỉ trả về 1 JSON (không markdown): {"calories": <số nguyên kcal>, "distanceM": <số nguyên mét>, "note": "<1 câu giải thích ngắn tiếng Việt>"}`;
      const ai = await askGeminiJSON(prompt);
      const cal = toInt(ai.calories);
      // Chặn kết quả AI lệch quá xa công thức (tránh số vô lý)
      if (cal > 0 && cal >= local.calories / 3 && cal <= local.calories * 3 + 20) {
        data = { calories: cal, distanceM: toInt(ai.distanceM) || local.distanceM, source: "ai", note: String(ai.note || "") };
      }
    } catch (e) {
      console.error("⚠️ Lỗi AI tính calo, dùng công thức:", e.message);
    }
    aiCache.set(key, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getCalories:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// POST /api/users/ai-insight  { avgHr, minHr, maxHr, avgSpo2, minSpo2, maxSpo2, steps, distanceKm, calories }
export const getAiInsight = async (req, res) => {
  try {
    const user = req.user;
    const b = req.body || {};
    const s = {
      avgHr: toInt(b.avgHr), minHr: toInt(b.minHr), maxHr: toInt(b.maxHr),
      avgSpo2: toInt(b.avgSpo2), minSpo2: toInt(b.minSpo2), maxSpo2: toInt(b.maxSpo2),
      steps: toInt(b.steps), distanceKm: toInt(b.distanceKm), calories: toInt(b.calories),
    };
    if (!s.avgHr && !s.avgSpo2 && !s.steps) {
      return res.status(200).json({ empty: true, summary: "Chưa có dữ liệu đo để AI phân tích." });
    }
    const p = profileOf(user);

    const key = `ins_${user._id}_${s.avgHr}_${s.avgSpo2}_${Math.round(s.steps / 100)}`;
    const hit = aiCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return res.status(200).json(hit.data);

    const prompt = `Bạn là trợ lý sức khỏe cá nhân. Hãy nhận định dữ liệu đo hôm nay từ vòng tay của người dùng và đưa ra khuyến nghị.
Hồ sơ: tuổi ${p.age ?? "không rõ"}, giới tính ${p.gender ?? "không rõ"}, cao ${p.height ?? "không rõ"} cm, nặng ${p.weight ?? "không rõ"} kg, mục tiêu: ${p.goal}.
Dữ liệu hôm nay: nhịp tim TB ${s.avgHr} (min ${s.minHr}, max ${s.maxHr}) BPM; SpO2 TB ${s.avgSpo2}% (min ${s.minSpo2}%); ${s.steps} bước; quãng đường ~${s.distanceKm} km; calo tiêu thụ ~${s.calories} kcal.
Điều chỉnh ngưỡng đánh giá theo tuổi và mục tiêu. Chỉ trả về 1 JSON (không markdown):
{"overall":"Tốt"|"Bình thường"|"Cảnh báo","summary":"1-2 câu tổng quan","heartRate":"nhận định nhịp tim","spo2":"nhận định SpO2","activity":"nhận định số bước & quãng đường & calo","advice":["khuyến nghị 1","khuyến nghị 2","khuyến nghị 3"]}
Không chẩn đoán bệnh; nếu chỉ số bất thường hãy khuyên đi khám.`;
    let data;
    try {
      const ai = await askGeminiJSON(prompt);
      data = {
        overall: ai.overall || "Bình thường",
        summary: ai.summary || "",
        heartRate: ai.heartRate || "",
        spo2: ai.spo2 || "",
        activity: ai.activity || "",
        advice: Array.isArray(ai.advice) ? ai.advice.slice(0, 5).map(String) : [],
      };
    } catch (e) {
      console.error("⚠️ Lỗi AI nhận định:", e.message);
      return res.status(503).json({ message: "AI tạm thời không phản hồi, vui lòng thử lại sau." });
    }
    aiCache.set(key, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getAiInsight:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
