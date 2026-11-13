import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { calcAgeFromDob } from "@/lib/health";

type Tab = "dashboard" | "heart" | "spo2" | "statistics" | "reports" | "device" | "profile";

const STEPS: { icon: string; title: string; text: string; tab?: Tab }[] = [
  { icon: "👋", title: "Chào mừng bạn đến với CSSK!", text: "Hãy dành 1 phút làm quen với các phần chính của trang web. Bạn có thể nhấn “Bỏ qua” bất cứ lúc nào.", tab: "dashboard" },
  { icon: "🏠", title: "Tổng quan", text: "Xem nhanh nhịp tim, SpO₂, số bước chân và trạng thái sức khoẻ hiện tại, cập nhật trực tiếp từ vòng tay ESP32.", tab: "dashboard" },
  { icon: "❤️", title: "Nhịp tim", text: "Biểu đồ nhịp tim theo thời gian thực (màu đỏ) cùng chỉ số trung bình, cao nhất, thấp nhất.", tab: "heart" },
  { icon: "🫁", title: "SpO₂", text: "Theo dõi nồng độ oxy trong máu (màu xanh ngọc). Dưới 90% hệ thống sẽ cảnh báo bạn.", tab: "spo2" },
  { icon: "📊", title: "Thống kê sức khoẻ", text: "Xem quãng đường, calo tiêu thụ và nhấn “AI nhận định” để nhận khuyến nghị cá nhân hoá về nhịp tim, SpO₂, bước chân.", tab: "statistics" },
  { icon: "📄", title: "Báo cáo", text: "Cuối mỗi ngày AI tự động tổng hợp báo cáo riêng cho bạn — không cần bấm nút nào.", tab: "reports" },
  { icon: "📟", title: "Thiết bị", text: "Kiểm tra pin, WiFi, bộ nhớ và trạng thái kết nối của vòng tay.", tab: "device" },
  { icon: "🔔", title: "Chuông thông báo & cảnh báo", text: "Khi phát hiện té ngã hoặc nhịp tim/SpO₂ bất thường, trang web sẽ hiện cảnh báo, rung, phát còi và lưu chi tiết vào chuông để bạn xem lại.", tab: "dashboard" },
];

export default function OnboardingTour({ onStepTab }: { onStepTab?: (t: Tab) => void }) {
  const { user, setUser } = useAuthStore();
  const key = user?._id ? `onboarding_done_${user._id}` : "";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Hiện hướng dẫn ngay khi biết user (kể cả user tải chậm) và user này chưa xem
  useEffect(() => {
    if (key && !localStorage.getItem(key)) {
      setStep(0);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [key]);

  const existingAge = calcAgeFromDob(user?.dob);
  const [age, setAge] = useState<string>(existingAge ? String(existingAge) : "");
  const [gender, setGender] = useState<string>(user?.gender && user.gender !== "Chưa chọn" ? user.gender : "");
  const [height, setHeight] = useState<string>(user?.height ? String(user.height) : "");
  const [weight, setWeight] = useState<string>(user?.weight ? String(user.weight) : "");

  if (!open || !key) return null;

  const isForm = step === STEPS.length;
  const total = STEPS.length + 1;

  const finish = () => {
    localStorage.setItem(key, "1");
    setOpen(false);
    onStepTab?.("dashboard");
  };

  const goto = (n: number) => {
    setStep(n);
    const t = STEPS[n]?.tab;
    if (t) onStepTab?.(t);
  };

  const save = async () => {
    const a = Number(age), h = Number(height), w = Number(weight);
    if (age && (a < 5 || a > 120)) return toast.error("Tuổi không hợp lệ (5–120)");
    if (height && (h < 80 || h > 250)) return toast.error("Chiều cao không hợp lệ (80–250 cm)");
    if (weight && (w < 20 || w > 300)) return toast.error("Cân nặng không hợp lệ (20–300 kg)");
    const body: any = {};
    if (age) body.dob = `${new Date().getFullYear() - a}-01-01`;
    if (gender) body.gender = gender;
    if (height) body.height = h;
    if (weight) body.weight = w;
    if (Object.keys(body).length === 0) return finish();
    try {
      setSaving(true);
      const res = await api.put("users/profile", body);
      setUser(res.data);
      toast.success("Đã lưu thông tin sức khoẻ của bạn!");
      finish();
    } catch {
      toast.error("Không lưu được thông tin, bạn có thể cập nhật lại trong Hồ sơ cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-[15px] outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center bg-black/55 p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-400">Bước {step + 1}/{total}</div>
          <button onClick={finish} className="text-sm text-slate-400 hover:text-slate-700 dark:hover:text-white">Bỏ qua</button>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 mb-5 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        {!isForm ? (
          <>
            <div className="text-5xl mb-3">{STEPS[step].icon}</div>
            <h3 className="text-xl font-bold mb-2">{STEPS[step].title}</h3>
            <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">{STEPS[step].text}</p>
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button onClick={() => goto(step - 1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-3 font-semibold">Quay lại</button>
              )}
              <button onClick={() => goto(step + 1 === STEPS.length ? STEPS.length : step + 1)} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold">Tiếp tục</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">🧑‍⚕️</div>
            <h3 className="text-xl font-bold mb-1">Thông tin sức khoẻ của bạn</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4">AI sẽ dùng tuổi, giới tính, chiều cao, cân nặng để tính calo tiêu thụ và đưa ra nhận định phù hợp. Có thể bỏ qua và nhập sau trong Hồ sơ cá nhân.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[13px] font-semibold">Tuổi
                <input type="number" inputMode="numeric" min={5} max={120} value={age} onChange={(e) => setAge(e.target.value)} className={inputCls + " mt-1"} placeholder="VD: 22" />
              </label>
              <label className="text-[13px] font-semibold">Giới tính
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls + " mt-1"}>
                  <option value="">Chưa chọn</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
              <label className="text-[13px] font-semibold">Chiều cao (cm)
                <input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls + " mt-1"} placeholder="VD: 170" />
              </label>
              <label className="text-[13px] font-semibold">Cân nặng (kg)
                <input type="number" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls + " mt-1"} placeholder="VD: 60" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => goto(STEPS.length - 1)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-3 font-semibold">Quay lại</button>
              <button disabled={saving} onClick={save} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 font-bold">{saving ? "Đang lưu..." : "Lưu & hoàn tất"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

