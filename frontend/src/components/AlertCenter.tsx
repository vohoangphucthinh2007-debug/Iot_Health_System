import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { AlertTriangle, HeartPulse, Wind, Cpu, X, Check, ShieldAlert } from "lucide-react";
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
 * Lắng nghe cảnh báo từ ESP32 (sau 10s xác minh nhầm lẫn)
 * và yêu cầu xác nhận thiết bị khi có >= 2 tài khoản cùng truy cập.
 */
export function AlertCenter() {
  const user = useAuthStore((s) => s.user);
  const activeAlert = useNotificationStore((s) => s.activeAlert);
  const dismiss = useNotificationStore((s) => s.dismissActiveAlert);
  const sirenStop = useRef<(() => void) | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [claimPrompt, setClaimPrompt] = useState<any>(null);
  const [shaking, setShaking] = useState(false);

  // Đếm ngược 10s để người đeo xác nhận có phải nhầm lẫn không trước khi báo động
  const [countdownInfo, setCountdownInfo] = useState<{ title: string; message: string; remaining: number } | null>(null);

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

  // Giảm bộ đếm 10s mỗi giây trên giao diện
  useEffect(() => {
    if (!countdownInfo) return;
    if (countdownInfo.remaining <= 0) {
      setCountdownInfo(null);
      return;
    }
    const t = setTimeout(() => {
      setCountdownInfo((prev) => (prev ? { ...prev, remaining: prev.remaining - 1 } : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [countdownInfo]);

  useEffect(() => {
    if (!user?._id) return;
    const raw = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = raw.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { query: { userId: user._id } });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("registerUser", user._id));

    const handle = (data: any, fallbackType: AlertType) => {
      // Khi cảnh báo chính thức nổ ra (sau 10s) → tắt thanh đếm ngược và bật báo động
      setCountdownInfo(null);
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
      toast.error(`🚨 ${title}`, { description: message, duration: 8000 });
      vibrate();
      setShaking(true);
      setTimeout(() => setShaking(false), 3500);
      playSiren(5);
      systemNotify(title, message);
    };

    socket.on("fallAlert", (d) => handle(d, "fall"));
    socket.on("healthAlert", (d) => handle(d, "hr_high"));

    // Nhận tín hiệu bắt đầu đếm ngược 10s xác nhận nhầm lẫn
    socket.on("alertCountdown", (d) => {
      setCountdownInfo({
        title: d?.title || "Đang xác minh cảnh báo (10s)",
        message: d?.message || "Nếu là nhầm lẫn, hãy bấm nút trên vòng tay hoặc bấm Huỷ bên dưới.",
        remaining: Number(d?.seconds) || 10,
      });
    });

    // Khi người đeo đã bấm huỷ trên ESP32 hoặc chỉ số đã về bình thường trong 10s
    socket.on("alertCountdownCancelled", (d) => {
      setCountdownInfo(null);
      if (d?.reason) {
        toast.info(`✅ ${d.reason}`, { duration: 4000 });
      }
    });

    // Khi có >= 2 user cùng truy cập và ESP32 gửi tín hiệu → hiện thông báo xác nhận
    socket.on("espClaimPrompt", (d) => {
      setClaimPrompt(d);
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
        duration: 6000,
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
      socket.off("alertCountdown");
      socket.off("alertCountdownCancelled");
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

  const cancelFalseAlarm = () => {
    if (socketRef.current && user?._id) {
      socketRef.current.emit("cancelPendingAlert", user._id);
    }
    setCountdownInfo(null);
  };

  return (
    <>
      {/* Thanh đếm ngược 10s xác nhận nhầm lẫn (chưa phát còi/rung) */}
      {countdownInfo && !activeAlert && (
        <div className="fixed inset-x-3 top-[74px] mx-auto max-w-[420px] z-[9995] rounded-2xl bg-amber-50 dark:bg-slate-900 border-2 border-amber-500 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-extrabold text-sm">
              {countdownInfo.remaining}s
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{countdownInfo.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {countdownInfo.message}
              </p>
              <button
                onClick={cancelFalseAlarm}
                className="mt-2.5 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3 transition-colors"
              >
                Nhầm lẫn — Huỷ cảnh báo ({countdownInfo.remaining}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận nhận tín hiệu ESP32 khi có >= 2 user cùng truy cập */}
      {claimPrompt && !activeAlert && (
        <div className="fixed inset-0 w-screen h-[100dvh] z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[360px] sm:max-w-md mx-auto rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 text-center shadow-2xl border-2 border-blue-500">
            <button
              onClick={() => setClaimPrompt(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mx-auto mb-3.5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 animate-pulse">
              <Cpu className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white px-4 leading-snug">
              {claimPrompt.title || "Xác nhận kết nối thiết bị ESP32"}
            </h2>
            <p className="mt-2.5 text-[13px] sm:text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {claimPrompt.message}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={() => setClaimPrompt(null)}
                className="w-full sm:flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 sm:py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Không phải tôi
              </button>
              <button
                onClick={confirmClaimEsp}
                className="w-full sm:flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 sm:py-3 text-sm text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Xác nhận nhận dữ liệu</span>
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
          <div className="fixed inset-0 w-screen h-[100dvh] z-[9999] flex items-center justify-center bg-red-900/75 backdrop-blur-sm p-4 alert-flash">
            <div
              className={`relative w-full max-w-[360px] sm:max-w-md mx-auto rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 text-center shadow-2xl border-4 ${shaking ? "alert-shake" : ""}`}
              style={{ borderColor: meta.color }}
            >
              <button
                onClick={dismiss}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              <div
                className="mx-auto mb-3.5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full animate-pulse"
                style={{ backgroundColor: meta.color + "22", color: meta.color }}
              >
                <Icon className="h-9 w-9 sm:h-11 sm:w-11" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold px-4 leading-snug" style={{ color: meta.color }}>
                {activeAlert.title}
              </h2>
              <p className="mt-2.5 text-[14px] sm:text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeAlert.message}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(activeAlert.time).toLocaleString("vi-VN")}
              </p>
              <button
                onClick={dismiss}
                className="mt-5 w-full rounded-xl py-3 text-white font-bold text-base shadow-md"
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
