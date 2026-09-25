import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import http from "http"; 
import { Server } from "socket.io";
import { updateProfile } from "./controllers/authController.js"; 
import cors from "cors";
import mqtt from "mqtt"; // <-- 1. THÊM THƯ VIỆN MQTT Ở ĐÂY

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Tạo HTTP server từ app Express
const server = http.createServer(app);

// Danh sách các nguồn được phép truy cập (Chấp nhận cả Localhost và mạng LAN IP)
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: function (origin, callback) {
    // Cho phép các request không có origin (như Postman hoặc mobile app trực tiếp) hoặc nằm trong danh sách cho phép
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
// 2. THÊM CẦU NỐI MQTT ĐỂ LẮNG NGHE ESP32
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

mqttClient.on("message", (topic, message) => {
  if (topic === "smartband_s3/dev01/telemetry") {
    try {
      const dataStr = message.toString();
      const telemetryData = JSON.parse(dataStr);
      
      console.log(`📡 Nhận Telemetry từ MQTT - HR: ${telemetryData.hr}, SpO2: ${telemetryData.spo2}`);

      // Chuyển tiếp dữ liệu nhận từ MQTT xuống Frontend qua Socket.io
      io.emit("sensorData", {
        heartRate: telemetryData.hr,
        spO2: telemetryData.spo2
      });
    } catch (e) {
      console.error("[-] Lỗi phân tích cú pháp JSON từ MQTT:", e);
    }
  }
});
// ==========================================

// Giả lập tín hiệu từ phần cứng ESP32 bắn lên mỗi 2 giây (giữ nguyên code cũ của ông)

// public routes
app.use("/api/auth", authRoute);

app.put("/api/users/profile", protectedRoute, updateProfile);

// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);

// 4. QUAN TRỌNG: Thêm '0.0.0.0' để cho phép điện thoại và thiết bị ngoài kết nối vào Server
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Socket.io đang chạy trên cổng ${PORT} và sẵn sàng nhận kết nối mạng LAN!`);
  });
});