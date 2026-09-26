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
import DailyStat from "./models/DailyStat.js"; // Import model lưu nháp
import User from "./models/User.js"; // Import model User để lấy ID

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Tạo HTTP server từ app Express
const server = http.createServer(app);

// Danh sách các nguồn được phép truy cập
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://iot-health-system-red.vercel.app"
];

// middlewares
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

// 2. Khởi tạo Socket.io đồng bộ CORS với Express
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

// 3. Xử lý kết nối WebSockets
io.on("connection", (socket) => {
  console.log("🟢 Có thiết bị vừa kết nối WebSockets:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Thiết bị ngắt kết nối:", socket.id);
  });
});

// ==========================================
// 4. CẦU NỐI MQTT & LƯU DB NHÁP
// ==========================================
const mqttClient = mqtt.connect("mqtt://broker.emqx.io:1883");

mqttClient.on("connect", () => {
  console.log("🟢 Backend đã kết nối thành công tới MQTT Broker!");
  mqttClient.subscribe("smartband_s3/dev01/telemetry", (err) => {
    if (!err) {
      console.log("📡 Đã subscribe topic: smartband_s3/dev01/telemetry");
    }
  });
});

// Thêm async vào đây để dùng được await cho MongoDB
mqttClient.on("message", async (topic, message) => {
  if (topic === "smartband_s3/dev01/telemetry") {
    try {
      const dataStr = message.toString();
      const telemetryData = JSON.parse(dataStr);
      
      const hr = telemetryData.hr || 0;
      const spo2 = telemetryData.spo2 || 0;
      const steps = telemetryData.steps || 0;
      const calories = telemetryData.calories || 0;
      
      console.log(`📡 Nhận MQTT - HR: ${hr}, SpO2: ${spo2}, Bước: ${steps}, Calo: ${calories}`);

      // Chuyển tiếp TẤT CẢ dữ liệu nhận từ MQTT xuống Frontend qua Socket.io
      io.emit("sensorData", {
        heartRate: hr,
        spO2: spo2,
        steps: steps,
        calories: calories
      });

      // LƯU VÀO DB NHÁP ĐỂ CUỐI NGÀY TÍNH TRUNG BÌNH
      if (hr > 0 && spo2 > 0) {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Tìm 1 user mặc định để gán dữ liệu (vì hệ thống hiện tại đang gửi chung)
        const user = await User.findOne(); 
        
        if (user) {
          await DailyStat.findOneAndUpdate(
            { userId: user._id, date: today },
            { 
              $inc: { totalHr: hr, totalSpo2: spo2, count: 1 }, // Cộng dồn để tính trung bình
              $max: { maxHr: hr }, // Lưu kỷ lục cao nhất
              $min: { minSpo2: spo2 }, // Lưu kỷ lục thấp nhất
              $set: { steps: steps, calories: calories } // Cập nhật số bước mới nhất
            },
            { upsert: true, new: true } // Nếu chưa có thì tự tạo mới
          );
        }
      }
    } catch (e) {
      console.error("[-] Lỗi xử lý dữ liệu MQTT:", e);
    }
  }
});

// ==========================================
// 5. CRONJOB: TỰ ĐỘNG CHỐT BÁO CÁO LÚC 23:59
// ==========================================
cron.schedule("59 23 * * *", async () => {
  console.log("🕒 Đang tổng hợp báo cáo ngày...");
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = await DailyStat.find({ date: today });

    for (let stat of stats) {
      // Tính trung bình
      const avgHr = stat.count > 0 ? Math.round(stat.totalHr / stat.count) : 0;
      const avgSpo2 = stat.count > 0 ? Math.round(stat.totalSpo2 / stat.count) : 0;

      // Format ngày hiển thị cho đẹp: DD/MM/YYYY
      const reportDate = new Date().toLocaleDateString('vi-VN'); 

      // Tạo báo cáo chính thức
      await Report.create({
        userId: stat.userId,
        date: reportDate,
        type: "Báo cáo hàng ngày",
        status: "Hoàn thành",
        avgHr: avgHr,
        avgSpo2: avgSpo2,
        steps: stat.steps,
        calo: stat.calories
      });

      // Xóa bản nháp sau khi tính toán xong cho sạch DB
      await DailyStat.deleteOne({ _id: stat._id });
    }
    console.log(`✅ Đã chốt xong báo cáo cho ngày ${today}`);
  } catch (error) {
    console.error("❌ Lỗi khi sinh báo cáo tự động:", error);
  }
});
// ==========================================

// public routes
app.use("/api/auth", authRoute);


// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);

// Chạy server
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Socket.io đang chạy trên cổng ${PORT} và sẵn sàng nhận kết nối!`);
  });
});