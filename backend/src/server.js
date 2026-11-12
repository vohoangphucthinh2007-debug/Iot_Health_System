import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mqtt from "mqtt";
import cron from "node-cron";
import Report from "./models/Report.js";
import DailyStat from "./models/DailyStat.js";
import User from "./models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Khởi tạo Gemini AI — API key chỉ ở .env, không bao giờ lộ ra client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

// Tạo HTTP server từ app Express
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://iot-health-system-red.vercel.app"
];

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://192.168.")) {
      callback(null, true);
    } else {
      callback(new Error("Bị chặn bởi CORS"));
    }
  },
  credentials: true
}));

// Khởi tạo Socket.io đồng bộ CORS với Express
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://192.168.")) {
        callback(null, true);
      } else {
        callback(new Error("Bị chặn bởi CORS"));
      }
    },
    credentials: true,
  },
});

// Xử lý kết nối WebSockets
io.on("connection", (socket) => {
  console.log("🟢 Có thiết bị vừa kết nối WebSockets:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔴 Thiết bị ngắt kết nối:", socket.id);
  });
});

// ==========================================
// CẤU NỐI MQTT & LƯU DB NHÁP
// ==========================================
// ESP32 publish lên broker.emqx.io với base topic: bioband/vtt132109/dev01
const MQTT_BASE    = "bioband/vtt132109/dev01";
const TOPIC_TELEM  = `${MQTT_BASE}/telemetry`;   // dữ liệu sức khỏe (1 lần/giây)
const TOPIC_ALERT  = `${MQTT_BASE}/fall/alert`;  // cảnh báo ngã

const mqttClient = mqtt.connect("mqtt://broker.emqx.io:1883");

mqttClient.on("connect", () => {
  console.log("🟢 Backend đã kết nối thành công tới MQTT Broker!");
  mqttClient.subscribe(TOPIC_TELEM, (err) => {
    if (!err) console.log(`📡 Đã subscribe topic: ${TOPIC_TELEM}`);
  });
  mqttClient.subscribe(TOPIC_ALERT, (err) => {
    if (!err) console.log(`🚨 Đã subscribe topic: ${TOPIC_ALERT}`);
  });
});

mqttClient.on("message", async (topic, message) => {
  // ── Telemetry: dữ liệu sức khoẻ từ ESP32 ──────────────────────────────
  if (topic === TOPIC_TELEM) {
    try {
      const d = JSON.parse(message.toString());

      // ESP32 gửi "bpm" (không phải "hr"), "spo2", "steps" (nếu có)
      const hr    = d.bpm   || 0;
      const spo2  = d.spo2  || 0;
      const steps = d.steps || 0;

      console.log(`📡 Nhận MQTT - HR: ${hr} BPM, SpO2: ${spo2}%, Bước: ${steps}`);

      // Chuyển tiếp dữ liệu sức khoẻ xuống Frontend qua Socket.io
      io.emit("sensorData", { heartRate: hr, spO2: spo2, steps });

      // Chuyển tiếp thông số thiết bị ESP32 (nếu có)
      // ESP gửi: rssi, heap (free RAM), uptime, ip, battery
      if (d.rssi !== undefined || d.heap !== undefined || d.battery !== undefined ||
          d.uptime !== undefined || d.ip !== undefined || d.ram !== undefined) {
        io.emit("deviceInfo", {
          ram:      d.heap      ?? d.ram      ?? null,  // heap = free RAM (bytes)
          ramTotal: d.ramTotal               ?? null,
          battery:  d.battery               ?? null,
          rssi:     d.rssi                  ?? null,
          uptime:   d.uptime                ?? null,
          temp:     d.temp                  ?? null,
          ip:       d.ip                    ?? null,
        });
      }

      // Lưu vào DB nháp để cuối ngày tính tổng
      if (hr > 0 && spo2 > 0) {
        const today = new Date().toISOString().split('T')[0];
        const user = await User.findOne();

        if (user) {
          await DailyStat.findOneAndUpdate(
            { userId: user._id, date: today },
            {
              $inc: { totalHr: hr, totalSpo2: spo2, count: 1 },
              $max: { maxHr: hr, maxSpo2: spo2 },
              $min: { minHr: hr, minSpo2: spo2 },
              $set: { steps }
            },
            { upsert: true, new: true }
          );
        }
      }
    } catch (e) {
      console.error("[-] Lỗi xử lý MQTT telemetry:", e);
    }
  }

  // ── Fall Alert: cảnh báo ngã từ ESP32 ─────────────────────────────────
  if (topic === TOPIC_ALERT) {
    try {
      const alert = JSON.parse(message.toString());
      console.log(`🚨 Cảnh báo ngã từ ESP32:`, alert);
      // Gửi cảnh báo ngã lên Frontend để hiển thị thông báo
      io.emit("fallAlert", {
        state:  alert.state  || "Unknown",
        reason: alert.reason || "",
        falls:  alert.falls  || 0,
      });
    } catch (e) {
      console.error("[-] Lỗi xử lý MQTT fall alert:", e);
    }
  }
});

// ==========================================
// HÀM TÍNH TUỔI TỪ NGÀY SINH (YYYY-MM-DD)
// ==========================================
function calculateAge(dob) {
  if (!dob) return "Không rõ";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ==========================================
// HÀM GỌI GEMINI AI TẠO NHẬN XÉT SỨC KHOẺ
// ==========================================
async function generateAIAnalysis(user, stat) {
  const avgHr   = stat.count > 0 ? Math.round(stat.totalHr   / stat.count) : 0;
  const avgSpo2 = stat.count > 0 ? Math.round(stat.totalSpo2 / stat.count) : 0;
  const age     = calculateAge(user.dob);

  // Map healthGoal → mô tả mức độ hoạt động
  const activityMap = {
    "Duy trì sức khỏe":     "Vận động ở mức độ trung bình, duy trì lối sống lành mạnh",
    "Giảm cân":              "Đang tích cực tăng cường vận động để giảm cân",
    "Tăng cơ":               "Tập luyện thể lực và tăng cơ bắp thường xuyên",
    "Cải thiện tim mạch":    "Tập cardio và cải thiện sức bền tim mạch"
  };
  const activityLevel = activityMap[user.healthGoal] || "Mức độ vận động trung bình";

  const prompt = `Bạn là một trợ lý y tế cá nhân chuyên phân tích dữ liệu sức khỏe từ vòng đeo tay thông minh.

THÔNG TIN CÁ NHÂN HÓA CỦA NGƯỜI DÙNG:
- Tuổi: ${age}
- Giới tính: ${user.gender || "Không rõ"}
- Mức độ hoạt động thể chất: ${activityLevel}
- Mục tiêu sức khỏe: ${user.healthGoal || "Duy trì sức khỏe"}

HƯỚNG DẪN ĐÁNH GIÁ:
Hãy tự động điều chỉnh ngưỡng Nhịp tim (BPM) và SpO2 tiêu chuẩn để đánh giá sao cho phù hợp nhất với ĐỘ TUỔI, MỨC ĐỘ VẬN ĐỘNG và MỤC TIÊU SỨC KHOẺ của người dùng này.

DỮ LIỆU ĐO LƯỜNG TRONG NGÀY:
- Nhịp tim: Trung bình ${avgHr} BPM, Min ${stat.minHr === 999 ? "N/A" : stat.minHr}, Max ${stat.maxHr}.
- SpO2: Trung bình ${avgSpo2}%, Min ${stat.minSpo2}%, Max ${stat.maxSpo2}%.
- Số bước chân: ${stat.steps} bước.
- Tổng số lần đo: ${stat.count} lần.

YÊU CẦU ĐẦU RA:
Đưa ra đánh giá sức khỏe cá nhân hóa. TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (không bọc trong markdown, không giải thích thêm):
{
  "status": "Tốt" | "Bình thường" | "Cảnh báo",
  "summary": "1 câu nhận xét tổng quan ngắn gọn có xét đến ngữ cảnh cá nhân",
  "advice": "1 câu lời khuyên cụ thể mang tính cá nhân hóa",
  "warning_flag": true | false
}`;

  const result = await geminiModel.generateContent(prompt);
  const rawText = result.response.text().trim();

  // Parse JSON — xử lý trường hợp AI vẫn wrap trong ```json
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ");
  return JSON.parse(jsonMatch[0]);
}

// ==========================================
// CRONJOB: TỰ ĐỘNG CHỐT BÁO CÁO LÚC 23:59
// ==========================================
cron.schedule("59 23 * * *", async () => {
  console.log("🕑 Đang tổng hợp báo cáo ngày...");
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = await DailyStat.find({ date: today });

    for (let stat of stats) {
      const avgHr   = stat.count > 0 ? Math.round(stat.totalHr   / stat.count) : 0;
      const avgSpo2 = stat.count > 0 ? Math.round(stat.totalSpo2 / stat.count) : 0;
      const reportDate = new Date().toLocaleDateString('vi-VN');

      // Lấy thông tin user để cá nhân hóa prompt
      const user = await User.findById(stat.userId);

      // Gọi Gemini AI để tạo nhận xét
      let aiAnalysis = { status: "", summary: "", advice: "", warning_flag: false };
      if (user && avgHr > 0) {
        try {
          aiAnalysis = await generateAIAnalysis(user, stat);
          console.log(`✅ AI nhận xét cho user ${user.displayName}:`, aiAnalysis.status);
        } catch (aiErr) {
          console.error("⚠️ Lỗi gọi Gemini AI:", aiErr.message);
        }
      }

      // Tạo báo cáo chính thức kèm nhận xét AI
      await Report.create({
        userId:  stat.userId,
        date:    reportDate,
        type:    "Báo cáo hàng ngày",
        status:  "Hoàn thành",
        avgHr,
        avgSpo2,
        maxHr:   stat.maxHr,
        minHr:   stat.minHr === 999 ? 0 : stat.minHr,
        maxSpo2: stat.maxSpo2,
        minSpo2: stat.minSpo2,
        steps:   stat.steps,
        aiAnalysis
      });

      // Xóa bản nháp sau khi tính toán xong
      await DailyStat.deleteOne({ _id: stat._id });
    }
    console.log(`✅ Đã chốt xong báo cáo cho ngày ${today}`);
  } catch (error) {
    console.error("❌ Lỗi khi sinh báo cáo tự động:", error);
  }
});

// ==========================================
// ROUTES
// ==========================================
app.use("/api/auth", authRoute);

app.use(protectedRoute);
app.use("/api/users", userRoute);

// Chạy server
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Socket.io đang chạy trên cổng ${PORT} và sẵn sàng nhận kết nối!`);
  });
});
