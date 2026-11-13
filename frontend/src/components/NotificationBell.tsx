import { useEffect, useRef, useState } from "react";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { ALERT_META } from "@/components/AlertCenter";

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleString("vi-VN");
}

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { notifications, hasUnread, markAllRead, remove, clearAll } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        markAllRead(); // đóng bảng → coi như đã đọc, nhưng nội dung vẫn giữ trong danh sách
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, markAllRead]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          if (open) markAllRead();
          setOpen(!open);
        }}
        className={className || "w-10 h-10 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center relative shadow-sm shrink-0"}
        aria-label="Thông báo"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-800">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-[70px] sm:top-full sm:mt-2 mx-auto sm:mx-0 max-w-[380px] sm:w-[360px] z-[100] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden text-left">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="font-bold text-slate-800 dark:text-white">Thông báo</div>
            <div className="flex gap-3 text-xs text-slate-500">
              <button onClick={markAllRead} className="flex items-center gap-1 hover:text-blue-600"><CheckCheck className="w-3.5 h-3.5" />Đã đọc</button>
              <button onClick={clearAll} className="flex items-center gap-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" />Xoá hết</button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">Bạn không có thông báo nào</div>
            ) : (
              notifications.map((n) => {
                const meta = ALERT_META[n.type] || ALERT_META.fall;
                const Icon = meta.Icon;
                return (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/60 ${n.read ? "" : "bg-red-50/60 dark:bg-red-500/10"}`}>
                    <div className="mt-0.5 w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.color + "22", color: meta.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 dark:text-white">{n.title}</div>
                      <div className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</div>
                      {n.type === "esp_claim" && (
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("claim-esp-device"));
                            remove(n.id);
                            setOpen(false);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          Xác nhận nhận dữ liệu
                        </button>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">{timeAgo(n.time)}</div>
                    </div>
                    <button onClick={() => remove(n.id)} className="self-start text-slate-300 hover:text-red-500" aria-label="Xoá">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

