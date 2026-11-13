import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { AlertTriangle, HeartPulse, Wind, Cpu, X, Check } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore, type AlertType } from "@/stores/useNotificationStore";

// ---------- Âm thanh còi báo động (Web Audio, không cần file) ----------
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playSiren(seconds = 5) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  gain.gain.value = 0.25;
  osc.connect(gain).connect(ctx.destination);
  const t0 = ctx.currentTime;
  // còi 2 tông luân phiên 880Hz ↔ 660Hz
  for (let i = 0; i < seconds * 2; i++) {
    osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t0 + i * 0.5);
  }
  osc.start(t0);
  osc.stop(t0 + seconds);
}

function vibrate() {
  if ("vibrate" in navigator) {
    // rung mạnh, lặp nhiều nhịp (~4 giây)
    navigator.vibrate([600, 200, 600, 200, 600, 200, 600, 200, 600]);
  }
}

function shakeScreen() {
  document.body.classList.remove("alert-shake");
  void document.body.offsetWidth; // restart animation
  document.body.classList.add("alert-shake");
  setTimeout(() => document.body.classList.remove("alert-shake"), 3500);
}

function systemNotify(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, requireInteraction: true, tag: "health-alert" } as any);
    }
  } catch { /* ignore */ }
}

export const ALERT_META: Record<AlertType, { color: string; Icon: any }> = {
  fall: { color: "#ef4444", Icon: AlertTriangle },
  hr_high: { color: "#f97316", Icon: HeartPulse },
  hr_low: { color: "#3b82f6", Icon: HeartPulse },
  spo2_low: { color: "#06b6d4", Icon: Wind },
  esp_claim: { color: "#2563eb", Icon: Cpu },
};

/**
 * Lắng nghe cảnh báo từ ESP32 và yêu cầu xác nhận thiết bị khi có >= 2 tài khoản cùng truy cập.
 */
export function AlertCenter() {
  const user = useAuthStore((s) => s.user);
  const activeAlert = useNotificationStore((s) => s.activeAlert);
  const dismiss = useNotificationStore((s) => s.dismissActiveAlert);
  const sirenStop = useRef<(() => void) | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [claimPrompt, setClaimPrompt] = useState<any>(null);

  // Mở khoá âm thanh sau lần chạm đầu tiên + xin quyền thông báo hệ thống
  useEffect(() => {
    const unlock = () => {
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    const raw = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = raw.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { query: { userId: user._id } });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("registerUser", user._id));

    const handle = (data: any, fallbackType: AlertType) => {
      const type: AlertType = data?.type || fallbackType;
      const title = data?.title || "Cảnh báo sức khoẻ";
      const message = data?.message || "";
      useNotificationStore.getState().addNotification({
        id: data?.id || `${type}_${Date.now()}`,
        type,
        title,
        message,
        time: data?.time || new Date().toISOString(),
      });
      toast.error(`🚨 ${title}`, { description: message, duration: 10000 });
      vibrate();
      shakeScreen();
      playSiren(5);
      systemNotify(title, message);
    };

    socket.on("fallAlert", (d) => handle(d, "fall"));
    socket.on("healthAlert", (d) => handle(d, "hr_high"));

    // Khi có >= 2 user cùng truy cập và ESP32 gửi tín hiệu → hiện thông báo xác nhận
    socket.on("espClaimPrompt", (d) => {
      setClaimPrompt(d);
      // Lưu vào chuông nhưng không bật popup báo động đỏ
      const store = useNotificationStore.getState();
      const exists = store.notifications.some((n) => n.type === "esp_claim" && !n.read);
      if (!exists) {
        useNotificationStore.setState((s) => ({
          notifications: [
            {
              id: d?.id || `esp_claim_${Date.now()}`,
              type: "esp_claim" as AlertType,
              title: d?.title || "Xác nhận kết nối thiết bị ESP32",
              message: d?.message || "Có nhiều tài khoản đang truy cập. Bấm xác nhận để nhận dữ liệu ESP32 về tài khoản này.",
              time: d?.time || new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ].slice(0, 50),
          hasUnread: true,
        }));
      }
      toast.info("📡 Xác nhận kết nối ESP32", {
        description: "Có nhiều tài khoản đang mở trang. Hãy xác nhận nếu bạn đang sử dụng thiết bị.",
        duration: 8000,
      });
    });

    // Khi 1 user đã bấm xác nhận → đóng popup ở tất cả các máy và thông báo kết quả
    socket.on("espClaimed", (d) => {
      setClaimPrompt(null);
      if (String(d?.userId) === String(user._id)) {
        toast.success("✅ Đã xác nhận! Dữ liệu từ ESP32 sẽ được truyền và lưu cho tài khoản của bạn.");
      } else {
        toast.info(`ℹ️ Thiết bị ESP32 đã được xác nhận bởi tài khoản: ${d?.displayName || "Người dùng khác"}.`);
      }
    });

    const onClaimFromBell = () => {
      socket.emit("claimEspDevice", user._id);
      setClaimPrompt(null);
    };
    window.addEventListener("claim-esp-device", onClaimFromBell);

    return () => {
      window.removeEventListener("claim-esp-device", onClaimFromBell);
      socket.off("fallAlert");
      socket.off("healthAlert");
      socket.off("espClaimPrompt");
      socket.off("espClaimed");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  // Rung lặp lại khi popup cảnh báo khẩn cấp còn mở
  useEffect(() => {
    if (!activeAlert) return;
    const t = setInterval(vibrate, 4500);
    sirenStop.current = () => clearInterval(t);
    return () => clearInterval(t);
  }, [activeAlert]);

  const confirmClaimEsp = () => {
    if (socketRef.current && user?._id) {
      socketRef.current.emit("claimEspDevice", user._id);
    }
    setClaimPrompt(null);
  };

  return (
    <>
      {/* Popup xác nhận nhận tín hiệu ESP32 khi có >= 2 user cùng truy cập */}
      {claimPrompt && !activeAlert && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 text-center shadow-2xl border-2 border-blue-500">
            <button
              onClick={() => setClaimPrompt(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 animate-pulse">
              <Cpu className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {claimPrompt.title || "Xác nhận kết nối thiết bị ESP32"}
            </h2>
            <p className="mt-3 text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {claimPrompt.message}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setClaimPrompt(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Không phải tôi
              </button>
              <button
                onClick={confirmClaimEsp}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Xác nhận nhận dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup cảnh báo khẩn cấp (té ngã / nhịp tim / SpO2 bất thường) */}
      {activeAlert && (() => {
        const meta = ALERT_META[activeAlert.type] || ALERT_META.fall;
        const Icon = meta.Icon;
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-900/70 backdrop-blur-sm p-4 alert-flash">
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 text-center shadow-2xl border-4" style={{ borderColor: meta.color }}>
              <button onClick={dismiss} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full animate-pulse" style={{ backgroundColor: meta.color + "22", color: meta.color }}>
                <Icon className="h-11 w-11" />
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: meta.color }}>{activeAlert.title}</h2>
              <p className="mt-3 text-[15px] text-slate-700 dark:text-slate-200">{activeAlert.message}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(activeAlert.time).toLocaleString("vi-VN")}</p>
              <button
                onClick={dismiss}
                className="mt-6 w-full rounded-xl py-3 text-white font-bold text-base"
                style={{ backgroundColor: meta.color }}
              >
                Đã biết
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default AlertCenter;
