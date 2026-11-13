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

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith("http://192.168.")) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
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
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Bị chặn bởi CORS"));
      }
    },
    credentials: true,
  },
});

// ==========================================
// CẤU NỐI MQTT & WEBSOCKET CHO TỪNG USER
// ==========================================
// Base topic mẫu: bioband/<deviceId>/dev01
const MQTT_TOPICS = [
  "bioband/+/dev01/telemetry",
  "bioband/+/telemetry",
  "bioband/+/dev01/fall/alert",
  "bioband/+/fall/alert",
  "bioband/+/dev01/history",
  "bioband/+/history",
  "bioband/vtt132109/dev01/telemetry",
  "bioband/vtt132109/dev01/fall/alert",
  "bioband/vtt132109/dev01/history",
];

// Quản lý các user đang online trên web dashboard (để gán dữ liệu ESP32 cho đúng user đang dùng)
const activeOnlineUsers = new Map(); // socket.id -> userId
let latestActiveUserId = null;       // user gần nhất vừa mở dashboard
let confirmedEspUserId = null;       // user đã bấm "Xác nhận" khi có >= 2 tài khoản cùng online
let lastOnlineSetKey = "";           // theo dõi tập hợp user online để phát hiện khi có user mới vào
let lastClaimPromptAt = 0;           // chống spam gửi thông báo xác nhận liên tục

function getUniqueOnlineUserIds() {
  return [...new Set(Array.from(activeOnlineUsers.values()).map(String))];
}

function handleOnlineUsersChanged() {
  const uniqueIds = getUniqueOnlineUserIds();
  const currentKey = uniqueIds.slice().sort().join(",");

  // Nếu user đã xác nhận thoát khỏi web → xoá trạng thái xác nhận
  if (confirmedEspUserId && !uniqueIds.includes(String(confirmedEspUserId))) {
    confirmedEspUserId = null;
  }

  // Nếu chỉ còn 1 user online → tự động gán cho user đó
  if (uniqueIds.length === 1) {
    confirmedEspUserId = uniqueIds[0];
    latestActiveUserId = uniqueIds[0];
  }

  // Nếu có >= 2 user online và danh sách user vừa thay đổi (có người mới truy cập cùng lúc)
  if (uniqueIds.length >= 2 && currentKey !== lastOnlineSetKey) {
    confirmedEspUserId = null;
    lastClaimPromptAt = 0; // cho phép gửi thông báo xác nhận ngay lập tức
  }
  lastOnlineSetKey = currentKey;
}

function promptOnlineUsersToClaimEsp(uniqueIds) {
  const now = Date.now();
  if (now - lastClaimPromptAt < 12000) return; // tối đa 12s nhắc 1 lần
  lastClaimPromptAt = now;
  const payload = {
    id: `esp_claim_${now}`,
    type: "esp_claim",
    title: "Xác nhận kết nối thiết bị ESP32",
    message: `Hiện có ${uniqueIds.length} tài khoản đang truy cập cùng lúc và thiết bị ESP32 đang truyền tín hiệu. Hãy bấm xác nhận nếu bạn là người đang đo để dữ liệu lưu về tài khoản của bạn.`,
    onlineCount: uniqueIds.length,
    time: new Date().toISOString(),
  };
  uniqueIds.forEach((uid) => {
    io.to(`user_${uid}`).emit("espClaimPrompt", payload);
  });
}

// Hàm tìm đúng user: Ưu tiên tài khoản đang đăng nhập trên Web Dashboard
async function findUserByTopic(topic) {
  const uniqueIds = getUniqueOnlineUserIds();

  // 1a. Có >= 2 user đang cùng truy cập: chỉ truyền cho user ĐÃ XÁC NHẬN
  if (uniqueIds.length >= 2) {
    if (confirmedEspUserId && uniqueIds.includes(String(confirmedEspUserId))) {
      try {
        const confirmedUser = await User.findById(confirmedEspUserId);
        if (confirmedUser) return confirmedUser;
      } catch (_) {}
    }
    // Chưa ai xác nhận → gửi thông báo cho tất cả các user đang online để ai xác nhận thì nhận dữ liệu
    promptOnlineUsersToClaimEsp(uniqueIds);
    return null;
  }

  // 1b. Chỉ có 1 user đang online trên web dashboard
  if (uniqueIds.length === 1) {
    try {
      const activeUser = await User.findById(uniqueIds[0]);
      if (activeUser) return activeUser;
    } catch (_) {}
  }

  // 2. User vừa hoạt động gần nhất (trong trường hợp web vừa tạm refresh)
  if (latestActiveUserId) {
    try {
      const lastUser = await User.findById(latestActiveUserId);
      if (lastUser) return lastUser;
    } catch (_) {}
  }

  // 3. Khớp theo mã thiết bị deviceId hoặc username từ topic MQTT (bioband/<deviceId>/...)
  const parts = topic.split('/');
  if (parts.length >= 2) {
    const devId = parts[1];
    const user = await User.findOne({
      $or: [
        { deviceId: devId },
        { username: devId.toLowerCase() },
      ]
    });
    if (user) return user;
  }

  // 4. Fallback cuối cùng: user đầu tiên trong DB
  return await User.findOne();
}

// Xử lý kết nối WebSockets — phòng riêng biệt theo userId
io.on("connection", (socket) => {
  const userId = socket.handshake.query?.userId || socket.handshake.auth?.userId;
  if (userId) {
    const uid = String(userId);
    socket.join(`user_${uid}`);
    activeOnlineUsers.set(socket.id, uid);
    latestActiveUserId = uid;
    handleOnlineUsersChanged();
    console.log(`🟢 User ${uid} đã đăng nhập và vào phòng WebSockets: user_${uid}`);
  } else {
    console.log("🟢 Có client kết nối WebSockets:", socket.id);
  }

  // Đăng ký userId khi client gửi event
  socket.on("registerUser", (uid) => {
    if (uid) {
      const idStr = String(uid);
      socket.join(`user_${idStr}`);
      activeOnlineUsers.set(socket.id, idStr);
      latestActiveUserId = idStr;
      handleOnlineUsersChanged();
      console.log(`🟢 Đã đăng ký socket ${socket.id} cho user: ${idStr}`);
    }
  });

  // User bấm "Xác nhận" nhận dữ liệu từ ESP32 khi có nhiều người cùng online
  socket.on("claimEspDevice", async (uid) => {
    const idStr = String(uid || activeOnlineUsers.get(socket.id) || "");
    if (!idStr) return;
    confirmedEspUserId = idStr;
    latestActiveUserId = idStr;
    let displayName = "Người dùng";
    try {
      const u = await User.findById(idStr);
      if (u) displayName = u.displayName || u.username;
    } catch (_) {}
    console.log(`✅ User [${displayName}] (${idStr}) đã xác nhận nhận tín hiệu từ ESP32.`);
    const uniqueIds = getUniqueOnlineUserIds();
    uniqueIds.forEach((onlineUid) => {
      io.to(`user_${onlineUid}`).emit("espClaimed", {
        userId: idStr,
        displayName,
        time: new Date().toISOString(),
      });
    });
  });

  // User bấm "Huỷ cảnh báo (Nhầm lẫn)" trong 10s đếm ngược trên web
  socket.on("cancelPendingAlert", (uid) => {
    const idStr = String(uid || activeOnlineUsers.get(socket.id) || "");
    if (!idStr) return;
    cancelAllPendingAlertsForUser(idStr, "Người đeo đã xác nhận nhầm lẫn");
  });

  socket.on("disconnect", () => {
    activeOnlineUsers.delete(socket.id);
    handleOnlineUsersChanged();
    console.log("🔴 Thiết bị ngắt kết nối:", socket.id);
  });
});

const mqttClient = mqtt.connect("mqtt://broker.emqx.io:1883");

mqttClient.on("connect", () => {
  console.log("🟢 Backend đã kết nối thành công tới MQTT Broker!");
  MQTT_TOPICS.forEach((t) => {
    mqttClient.subscribe(t, (err) => {
      if (!err) console.log(`📡 Đã subscribe topic: ${t}`);
    });
  });
});

// Hàm lấy chuỗi ngày định dạng YYYY-MM-DD theo giờ Việt Nam (Asia/Ho_Chi_Minh)
export function getLocalDateString(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// ==========================================
// CẢNH BÁO TÉ NGÃ & CHỈ SỐ BẤT THƯỜNG (CÓ 10 GIÂY XÁC NHẬN NHẦM LẪN)
// ==========================================
const HR_HIGH = 120, HR_LOW = 40, SPO2_LOW = 90;
const VERIFY_DELAY_MS = 10 * 1000;   // 10 giây chờ người đeo xác nhận có phải nhầm lẫn không
const ALERT_COOLDOWN_MS = 60 * 1000; // mỗi loại cảnh báo tối đa 1 lần/phút/user

// Quản lý trạng thái chờ 10s cho nhịp tim / SpO2: `${userId}_${type}` → { startAt, suppressedUntil }
const anomalyPending = new Map();
const lastAlertAt = new Map();       // `${userId}_${type}` → timestamp

// Quản lý trạng thái chờ 10s cho cảnh báo té ngã từ ESP32: `userId` → { timer, alertData, startedAt, lastEspState }
const pendingFallAlerts = new Map();

function isNormalEspState(stateStr) {
  if (!stateStr) return false;
  const s = String(stateStr).toLowerCase();
  return s === "idle" || s === "normal" || s === "monitoring" || s === "ok" || s === "cancelled";
}

function cancelAllPendingAlertsForUser(uid, reason = "Đã huỷ cảnh báo") {
  const idStr = String(uid);
  // 1. Huỷ cảnh báo té ngã đang chờ 10s
  const pendingFall = pendingFallAlerts.get(idStr);
  if (pendingFall) {
    clearTimeout(pendingFall.timer);
    pendingFallAlerts.delete(idStr);
  }
  // 2. Huỷ các cảnh báo nhịp tim / SpO2 đang đếm ngược 10s (tạm ngưng 30s để không bật lại ngay)
  for (const t of ["hr_high", "hr_low", "spo2_low"]) {
    const key = `${idStr}_${t}`;
    anomalyPending.set(key, { startAt: null, suppressedUntil: Date.now() + 30000 });
  }
  io.to(`user_${idStr}`).emit("alertCountdownCancelled", { reason });
  console.log(`🛑 Đã huỷ cảnh báo trong 10s xác nhận cho user ${idStr}: ${reason}`);
}

function scheduleFallAlertWith10sVerify(user, alertPayload) {
  const uid = String(user._id);
  const stateStr = String(alertPayload.state || "Unknown");

  // Nếu ESP32 báo trạng thái đã về Idle / Normal → người đeo đã bấm huỷ trên vòng tay
  if (isNormalEspState(stateStr)) {
    const existing = pendingFallAlerts.get(uid);
    if (existing) {
      clearTimeout(existing.timer);
      pendingFallAlerts.delete(uid);
      io.to(`user_${uid}`).emit("alertCountdownCancelled", {
        type: "fall",
        reason: "Người đeo đã xác nhận nhầm lẫn trên thiết bị ESP32",
      });
      console.log(`✅ User ${user.username} đã huỷ cảnh báo ngã trên ESP32 trong thời gian 10s.`);
    }
    return;
  }

  // Nếu đang có bộ đếm 10s cho lần ngã này rồi → chỉ cập nhật thông tin mới nhất (ví dụ Countdown -> Alarm)
  const existing = pendingFallAlerts.get(uid);
  if (existing) {
    existing.alertData = { ...existing.alertData, ...alertPayload };
    existing.lastEspState = stateStr;
    return;
  }

  console.log(`⏳ Bắt đầu đếm ngược 10s xác nhận cảnh báo ngã cho user ${user.username}...`);
  io.to(`user_${uid}`).emit("alertCountdown", {
    type: "fall",
    title: "Phát hiện nghi ngờ té ngã",
    message: "Hệ thống sẽ phát cảnh báo sau 10 giây. Nếu là nhầm lẫn, hãy bấm nút huỷ trên vòng tay hoặc bấm Huỷ bên dưới.",
    seconds: 10,
    startedAt: Date.now(),
  });

  const timer = setTimeout(() => {
    const item = pendingFallAlerts.get(uid);
    pendingFallAlerts.delete(uid);
    if (!item) return;

    // Sau 10s vẫn chưa bị huỷ → chính thức phát cảnh báo lên web
    const a = item.alertData || alertPayload;
    console.log(`🚨 [SAU 10S] Phát cảnh báo ngã chính thức cho user ${user.username}:`, a);
    io.to(`user_${uid}`).emit("fallAlert", {
      id: `fall_${Date.now()}`,
      type: "fall",
      title: "Phát hiện té ngã!",
      message: `Thiết bị xác nhận té ngã sau 10s không phản hồi${a.reason ? ` (${a.reason})` : ""}. Hãy kiểm tra ngay tình trạng người đeo vòng!`,
      state: a.state || "Alarm",
      reason: a.reason || "",
      falls: a.falls || 0,
      time: new Date().toISOString(),
    });
  }, VERIFY_DELAY_MS);

  pendingFallAlerts.set(uid, {
    timer,
    alertData: alertPayload,
    startedAt: Date.now(),
    lastEspState: stateStr,
  });
}

function checkHealthAnomaly(user, hr, spo2, espState) {
  const uid = String(user._id);

  // Nếu đang có cảnh báo ngã chờ 10s mà telemetry từ ESP32 báo state đã về Idle/Normal (sau ít nhất 1.5s) → huỷ cảnh báo ngã
  const pendingFall = pendingFallAlerts.get(uid);
  if (pendingFall && espState && isNormalEspState(espState) && Date.now() - pendingFall.startedAt > 1500) {
    clearTimeout(pendingFall.timer);
    pendingFallAlerts.delete(uid);
    io.to(`user_${uid}`).emit("alertCountdownCancelled", {
      type: "fall",
      reason: "Người đeo đã bấm huỷ cảnh báo trên thiết bị ESP32",
    });
    console.log(`✅ Telemetry báo state=${espState}: Đã huỷ cảnh báo ngã trong 10s cho user ${user.username}.`);
  }

  if (user.settings && user.settings.healthAlerts === false) return;

  const now = Date.now();
  const checks = [
    { type: "hr_high", bad: hr > HR_HIGH, title: "Nhịp tim tăng cao bất thường",
      message: `Nhịp tim duy trì ở mức cao ${hr} BPM (vượt ngưỡng ${HR_HIGH} BPM) liên tục hơn 10 giây. Hãy nghỉ ngơi, hít thở sâu; nếu kéo dài hoặc kèm khó chịu hãy liên hệ y tế.` },
    { type: "hr_low", bad: hr > 0 && hr < HR_LOW, title: "Nhịp tim thấp bất thường",
      message: `Nhịp tim duy trì ở mức thấp ${hr} BPM (dưới ngưỡng ${HR_LOW} BPM) liên tục hơn 10 giây. Nếu bạn thấy chóng mặt, mệt hoặc choáng hãy liên hệ y tế.` },
    { type: "spo2_low", bad: spo2 > 0 && spo2 < SPO2_LOW, title: "SpO₂ thấp bất thường",
      message: `SpO₂ duy trì ở mức thấp ${spo2}% (dưới ngưỡng ${SPO2_LOW}%) liên tục hơn 10 giây. Hãy kiểm tra vòng tay đeo đúng vị trí; nếu khó thở hãy đi khám ngay.` },
  ];

  for (const c of checks) {
    const key = `${uid}_${c.type}`;
    const state = anomalyPending.get(key) || { startAt: null, suppressedUntil: 0 };

    if (!c.bad) {
      // Chỉ số đã về bình thường trước khi hết 10s → huỷ đếm ngược, không báo động
      if (state.startAt) {
        anomalyPending.set(key, { startAt: null, suppressedUntil: state.suppressedUntil });
        io.to(`user_${uid}`).emit("alertCountdownCancelled", {
          type: c.type,
          reason: "Chỉ số đã ổn định trở lại trong 10 giây xác minh",
        });
      }
      continue;
    }

    // Nếu người dùng vừa bấm "Nhầm lẫn" hoặc đang trong thời gian cooldown
    if (now < state.suppressedUntil) continue;
    if (now - (lastAlertAt.get(key) || 0) < ALERT_COOLDOWN_MS) continue;

    // Bắt đầu đếm ngược 10s khi mới phát hiện bất thường
    if (!state.startAt) {
      anomalyPending.set(key, { startAt: now, suppressedUntil: 0 });
      console.log(`⏳ Bắt đầu chờ 10s xác nhận ${c.type} cho user ${user.username} (HR=${hr}, SpO2=${spo2})...`);
      io.to(`user_${uid}`).emit("alertCountdown", {
        type: c.type,
        title: `Đang kiểm tra: ${c.title}`,
        message: `Phát hiện chỉ số bất thường (HR: ${hr} BPM, SpO₂: ${spo2}%). Hệ thống sẽ báo động nếu tình trạng còn tiếp diễn sau 10 giây.`,
        seconds: 10,
        startedAt: now,
      });
      continue;
    }

    // Đã qua đủ 10 giây mà cảnh báo vẫn còn tiếp diễn → phát cảnh báo chính thức trên web
    if (now - state.startAt >= VERIFY_DELAY_MS) {
      anomalyPending.set(key, { startAt: null, suppressedUntil: 0 });
      lastAlertAt.set(key, now);
      console.log(`🚨 [SAU 10S] Cảnh báo ${c.type} cho user ${user.username}: HR=${hr}, SpO2=${spo2}`);
      io.to(`user_${uid}`).emit("healthAlert", {
        id: `${c.type}_${now}`,
        type: c.type,
        title: c.title,
        message: c.message,
        hr, spo2,
        time: new Date().toISOString(),
      });
    }
  }
}

mqttClient.on("message", async (topic, message) => {
  // ── Telemetry: dữ liệu sức khoẻ từ ESP32 ──────────────────────────────
  if (topic.endsWith("/telemetry")) {
    try {
      const d = JSON.parse(message.toString());

      // ESP32 gửi "bpm", "spo2", "steps" — đảm bảo chuyển thành số nguyên
      const hr    = Math.round(Number(d.bpm || d.heartRate || d.hr) || 0);
      const spo2  = Math.round(Number(d.spo2 || d.spO2) || 0);
      const steps = Math.round(Number(d.steps) || 0);

      // Tìm đúng user sở hữu thiết bị này
      const targetUser = await findUserByTopic(topic);
      if (!targetUser) return;

      console.log(`📡 Nhận MQTT [User: ${targetUser.username}] - HR: ${hr} BPM, SpO2: ${spo2}%, Bước: ${steps}`);

      const userRoom = `user_${targetUser._id}`;

      // Chuyển tiếp dữ liệu sức khoẻ RIÊNG cho user này qua Socket.io (toàn bộ là số nguyên)
      io.to(userRoom).emit("sensorData", { heartRate: hr, spO2: spo2, steps });

      // Chuyển tiếp thông số thiết bị ESP32 (làm tròn số nguyên)
      if (d.rssi !== undefined || d.heap !== undefined || d.battery !== undefined ||
        d.uptime !== undefined || d.ip !== undefined || d.ram !== undefined) {
        io.to(userRoom).emit("deviceInfo", {
          ram:      d.heap !== undefined ? Math.round(d.heap) : (d.ram !== undefined ? Math.round(d.ram) : null),
          ramTotal: d.ramTotal !== undefined ? Math.round(d.ramTotal) : null,
          battery:  d.battery !== undefined ? Math.round(d.battery) : null,
          rssi:     d.rssi !== undefined ? Math.round(d.rssi) : null,
          uptime:   d.uptime !== undefined ? Math.round(d.uptime) : null,
          temp:     d.temp !== undefined ? Math.round(d.temp) : null,
          ip:       d.ip ?? null,
        });
      }

      // Phát hiện chỉ số bất thường (chờ 10s xác nhận trước khi báo lên web)
      checkHealthAnomaly(targetUser, hr, spo2, d.state);

      // Lưu vào DB nháp theo từng user và từng ngày riêng biệt
      if (hr > 0 && spo2 > 0) {
        const today = getLocalDateString();
        await DailyStat.findOneAndUpdate(
          { userId: targetUser._id, date: today },
          {
            $inc: { totalHr: hr, totalSpo2: spo2, count: 1 },
            $max: { maxHr: hr, maxSpo2: spo2 },
            $min: { minHr: hr, minSpo2: spo2 },
            $set: { steps }
          },
          { upsert: true, new: true }
        );
      }
    } catch (e) {
      console.error("[-] Lỗi xử lý MQTT telemetry:", e);
    }
  }

  // ── Fall Alert: cảnh báo ngã từ ESP32 (chờ 10s xác nhận nhầm lẫn) ──────
  if (topic.endsWith("/fall/alert")) {
    try {
      const alert = JSON.parse(message.toString());
      const targetUser = await findUserByTopic(topic);
      if (targetUser) {
        console.log(`📡 Nhận tín hiệu fall/alert từ ESP32 cho user ${targetUser.username}:`, alert);
        scheduleFallAlertWith10sVerify(targetUser, alert);
      }
    } catch (e) {
      console.error("[-] Lỗi xử lý MQTT fall alert:", e);
    }
  }

  // ── History: ảnh chụp biểu đồ 60s gần nhất từ ESP32 ──────────────────
  if (topic.endsWith("/history")) {
    try {
      const hist = JSON.parse(message.toString());
      if (Array.isArray(hist.bpm)) {
        hist.bpm = hist.bpm.map(v => Math.round(Number(v) || 0));
      }
      if (Array.isArray(hist.spo2)) {
        hist.spo2 = hist.spo2.map(v => Math.round(Number(v) || 0));
      }
      const targetUser = await findUserByTopic(topic);
      if (targetUser) {
        io.to(`user_${targetUser._id}`).emit("sensorHistory", hist);
      }
    } catch (e) {
      console.error("[-] Lỗi xử lý MQTT history:", e);
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
  const avgHr = stat.count > 0 ? Math.round(stat.totalHr / stat.count) : 0;
  const avgSpo2 = stat.count > 0 ? Math.round(stat.totalSpo2 / stat.count) : 0;
  const age = calculateAge(user.dob);

  // Map healthGoal → mô tả mức độ hoạt động
  const activityMap = {
    "Duy trì sức khỏe": "Vận động ở mức độ trung bình, duy trì lối sống lành mạnh",
    "Giảm cân": "Đang tích cực tăng cường vận động để giảm cân",
    "Tăng cơ": "Tập luyện thể lực và tăng cơ bắp thường xuyên",
    "Cải thiện tim mạch": "Tập cardio và cải thiện sức bền tim mạch"
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
// HÀM TỔNG HỢP VÀ GỬI DỮ LIỆU CHO AI BÁO CÁO TỰ ĐỘNG
// ==========================================
export async function processDailyReportForStats(stats, dateStr, reportDisplayDate) {
  for (let stat of stats) {
    // CHỈ TẠO BÁO CÁO NẾU USER CÓ DỮ LIỆU ĐO THỰC TẾ TRONG NGÀY ĐÓ
    if (!stat || stat.count <= 0 || stat.totalHr <= 0) {
      console.log(`⏩ Bỏ qua user ${stat.userId} vì không có dữ liệu đo được trong ngày ${dateStr}`);
      continue;
    }

    const user = await User.findById(stat.userId);
    if (!user) continue;

    // Kiểm tra xem đã có báo cáo cho ngày này chưa (tránh tạo trùng lặp)
    const existingReport = await Report.findOne({ userId: user._id, date: reportDisplayDate });
    if (existingReport) {
      console.log(`ℹ️ User [${user.displayName || user.username}] đã có báo cáo ngày ${reportDisplayDate}, bỏ qua.`);
      continue;
    }

    const avgHr   = Math.round(stat.totalHr   / stat.count);
    const avgSpo2 = Math.round(stat.totalSpo2 / stat.count);

    console.log(`🤖 Tự động trích xuất dữ liệu ngày ${dateStr} của user [${user.displayName || user.username}] gửi cho AI...`);

    // Gửi riêng dữ liệu của user này cho Gemini AI phân tích cá nhân hóa
    let aiAnalysis = { status: "", summary: "", advice: "", warning_flag: false };
    try {
      aiAnalysis = await generateAIAnalysis(user, stat);
      console.log(`✅ AI phân tích xong cho user [${user.displayName || user.username}]:`, aiAnalysis.status);
    } catch (aiErr) {
      console.error(`⚠️ Lỗi gọi Gemini AI cho user ${user.username}:`, aiErr.message);
    }

    // Tự động tạo và lưu báo cáo chính thức vào ô dữ liệu riêng của user này (toàn bộ chỉ số là số nguyên)
    await Report.create({
      userId:  stat.userId,
      date:    reportDisplayDate,
      type:    "Báo cáo hàng ngày",
      status:  "Hoàn thành",
      avgHr:   Math.round(avgHr),
      avgSpo2: Math.round(avgSpo2),
      maxHr:   Math.round(stat.maxHr || 0),
      minHr:   Math.round(stat.minHr === 999 ? 0 : (stat.minHr || 0)),
      maxSpo2: Math.round(stat.maxSpo2 || 0),
      minSpo2: Math.round(stat.minSpo2 === 100 ? 0 : (stat.minSpo2 || 0)),
      steps:   Math.round(stat.steps || 0),
      aiAnalysis
    });
    console.log(`🎉 Đã tự động tạo báo cáo ngày ${reportDisplayDate} cho user [${user.displayName || user.username}]`);

    // Báo cho frontend của user đó qua Socket.io nếu đang mở web
    io.to(`user_${user._id}`).emit("newReportReady", { date: reportDisplayDate });

    // ── QUY TẮC XOAY VÒNG 15 NGÀY (FIFO) ─────────────────────────────────
    // 1. Duy trì tối đa 15 báo cáo gần nhất trong collection Report của user này
    const userReports = await Report.find({ userId: stat.userId }).sort({ createdAt: -1 });
    if (userReports.length > 15) {
      const excessReports = userReports.slice(15);
      const reportIdsToDelete = excessReports.map(r => r._id);
      await Report.deleteMany({ _id: { $in: reportIdsToDelete } });
      console.log(`🧹 Đã xóa ${reportIdsToDelete.length} báo cáo cũ nhất của user [${user.username}] (duy trì 15 ngày)`);
    }

    // 2. Duy trì tối đa 15 ngày dữ liệu sức khỏe trong collection DailyStat của user này
    const userDailyStats = await DailyStat.find({ userId: stat.userId }).sort({ date: -1 });
    if (userDailyStats.length > 15) {
      const excessDaily = userDailyStats.slice(15);
      const dailyIdsToDelete = excessDaily.map(d => d._id);
      await DailyStat.deleteMany({ _id: { $in: dailyIdsToDelete } });
      console.log(`🧹 Đã xóa ${dailyIdsToDelete.length} ngày DailyStat cũ nhất của user [${user.username}] (duy trì 15 ngày)`);
    }
  }
}

// Kiểm tra bù báo cáo nếu server bị tắt đúng thời điểm 23:59 hôm trước hoặc có ngày chưa chốt
async function checkMissedDailyReports() {
  try {
    const todayStr = getLocalDateString();
    
    // Tìm tất cả DailyStat của các ngày TRƯỚC HÔM NAY mà có dữ liệu đo thực tế
    const missedStats = await DailyStat.find({ 
      date: { $lt: todayStr }, 
      count: { $gt: 0 }, 
      totalHr: { $gt: 0 } 
    });

    if (missedStats.length > 0) {
      console.log(`🔍 Phát hiện ${missedStats.length} bản ghi sức khoẻ các ngày trước chưa chốt báo cáo. Đang tự động xử lý...`);
      for (const stat of missedStats) {
        const [y, m, d] = stat.date.split('-');
        const displayDate = `${d}/${m}/${y}`;
        await processDailyReportForStats([stat], stat.date, displayDate);
      }
    }
  } catch (e) {
    console.error("Lỗi khi kiểm tra báo cáo chưa chốt:", e);
  }
}

// ==========================================
// CRONJOB: TỰ ĐỘNG CHỐT BÁO CÁO LÚC 23:59 MỖI ĐÊM THEO GIỜ VIỆT NAM (KHÔNG CẦN BẤM NÚT)
// ==========================================
cron.schedule("59 23 * * *", async () => {
  console.log("🕑 23:59 (Giờ VN) — Tự động quét dữ liệu trong ngày của từng user để gửi AI...");
  try {
    const today = getLocalDateString();
    const reportDate = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // Chỉ tìm những user CÓ DỮ LIỆU ĐO THỰC TẾ trong ngày hôm nay (count > 0, totalHr > 0)
    const stats = await DailyStat.find({ date: today, count: { $gt: 0 }, totalHr: { $gt: 0 } });
    await processDailyReportForStats(stats, today, reportDate);
    console.log(`✅ Đã chốt xong báo cáo tự động cho ngày ${today}.`);
  } catch (error) {
    console.error("❌ Lỗi khi sinh báo cáo tự động 23:59:", error);
  }
}, {
  timezone: "Asia/Ho_Chi_Minh"
});

// ==========================================
// ROUTES
// ==========================================
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "IoT Health System Backend is live!" });
});

// Cho phép cả /api/auth và /auth để frontend cấu hình URL kiểu nào cũng chạy
app.use("/api/auth", authRoute);
app.use("/auth", authRoute);

// Cho phép cả /api/users và /users (chỉ bảo vệ các routes này, không chặn toàn server)
app.use("/api/users", protectedRoute, userRoute);
app.use("/users", protectedRoute, userRoute);

// Chạy server
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Socket.io đang chạy trên cổng ${PORT} và sẵn sàng nhận kết nối!`);
    checkMissedDailyReports();
  });
});
