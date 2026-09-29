import { useState, useEffect } from "react";
import { User, ActivitySquare, LogOut, Home, BookOpen, X, Bell, Shield, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router"; 
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

// Modal bảo mật nhỏ gọn (đổi mật khẩu) — dùng trực tiếp trong Navbar
import api from "@/lib/axios";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";

const SecurityModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 6) { toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Mật khẩu xác nhận không khớp!"); return; }
    setIsLoading(true);
    try {
      await api.put("users/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đổi mật khẩu thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full pl-4 pr-11 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none text-slate-800 dark:text-white transition-all text-sm";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border dark:border-[#334155]">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] dark:bg-[#2563eb]/20 flex items-center justify-center text-[#2563eb]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bảo mật tài khoản</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đổi mật khẩu để bảo vệ tài khoản của bạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Mật khẩu hiện tại</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} name="currentPassword" value={form.currentPassword} onChange={handleChange} required className={inputCls} placeholder="Nhập mật khẩu hiện tại" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Mật khẩu mới</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} name="newPassword" value={form.newPassword} onChange={handleChange} required minLength={6} className={inputCls} placeholder="Ít nhất 6 ký tự" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className={inputCls} placeholder="Nhập lại mật khẩu mới" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp!</p>
            )}
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-2 bg-[#2563eb] hover:bg-[#149965] disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_4px_15px_rgba(24,183,122,0.3)]">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {isLoading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const { darkMode, toggleSetting } = useSettingsStore();
  const { hasUnread, setHasUnread } = useNotificationStore();
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowAppGuide(true);
    }
  };

  return (
    <>
      <header className="hidden md:block bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2.5 gap-1">
          
          <div className="flex items-center gap-2 sm:gap-6 shrink min-w-0">
            <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0">
              <img src="/logo.jpg" alt="logo" className="h-7 sm:h-9 md:h-10 w-auto rounded-md object-contain" />
              <span className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-[#2563eb] to-blue-600 bg-clip-text text-transparent hidden sm:block">
                CSSK
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-3 sm:gap-4 md:gap-6">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-[#2563eb] flex items-center gap-1 transition-colors">
                <Home className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Trang chủ</span>
              </Link>
              <Link to="/guide" className="text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-[#2563eb] flex items-center gap-1 transition-colors">
                <BookOpen className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Hướng dẫn</span>
              </Link>
              <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-[#2563eb] flex items-center gap-1 transition-colors">
                <ActivitySquare className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Bảng đo</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInstallClick}
              className="text-[11px] sm:text-sm px-2 sm:px-3 h-8 sm:h-10 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Tải App
            </Button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Nút chuông thông báo (Dạng hình vuông bo góc) */}
                <button 
                  onClick={() => {
                    setHasUnread(false);
                    toast.success("Bạn không có thông báo mới nào");
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center relative shadow-sm hover:shadow"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {hasUnread && <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>}
                </button>

                {/* Avatar tròn chứa chữ cái đầu & Dropdown menu */}
                <div className="relative group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#d7f8eb] to-[#b5efd9] flex justify-center items-center text-[#0b9665] font-bold text-sm sm:text-base cursor-pointer border border-[#b5efd9] shadow-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                  
                  <div className="absolute right-0 top-full pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 flex flex-col overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || "Người dùng"}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                          <User className="h-4 w-4" /> Thông tin cá nhân
                        </Link>
                        {/* Bảo mật - mở modal trực tiếp */}
                        <button
                          onClick={() => setShowSecurityModal(true)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" /> Bảo mật tài khoản
                        </button>
                      </div>

                      {/* Chế độ tối — toggle ngay trong dropdown */}
                      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          {darkMode ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                          <span className="font-medium">Chế độ {darkMode ? 'tối' : 'sáng'}</span>
                        </div>
                        {/* Toggle switch */}
                        <div
                          onClick={() => toggleSetting('darkMode' as any)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${darkMode ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 py-1">
                        <button onClick={signOut} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <LogOut className="h-4 w-4" /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline" size="sm" className="text-[11px] sm:text-sm px-2 sm:px-3 h-8 sm:h-10 font-semibold">Đăng nhập</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="text-[11px] sm:text-sm px-2 sm:px-3 h-8 sm:h-10 font-semibold bg-blue-600 hover:bg-blue-700">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* POPUP DỰ PHÒNG */}
      {showAppGuide && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setShowAppGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Cài đặt Ứng dụng</h3>
              <p className="text-sm text-slate-500 mb-6">Quét mã QR hoặc thao tác tay để cài đặt</p>
              
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white border-2 border-slate-100 rounded-xl shadow-sm">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://iot-health-system-red.vercel.app" 
                    alt="QR Code" 
                    className="w-40 h-40"
                  />
                </div>
              </div>

              <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Do giới hạn thiết bị, hãy làm theo:</p>
                <div className="flex gap-2 items-start">
                  <span className="text-xl">🍏</span>
                  <p><strong>iOS (iPhone):</strong> Bấm nút <em>Chia sẻ</em> (dưới cùng) {'-> '}Chọn <em>Thêm vào MH chính</em>.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-xl">🤖</span>
                  <p><strong>Android/PC:</strong> Trình duyệt chưa hỗ trợ cài tự động, hãy bấm <em>Menu 3 chấm</em> {'-> '} <em>Thêm vào Màn hình chính/Cài đặt ứng dụng</em>.</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-2">Cài đặt trực tiếp (Android):</p>
                <Button 
                  variant="outline"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                  onClick={() => window.open("https://drive.google.com/uc?export=download&id=1Op8O3PeTyqJAYSNO_6LMd0Rx_uoXrmFT", "_self")}
                >
                  Tải file cài đặt APK
                </Button>
              </div>
              
              <Button 
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800" 
                onClick={() => setShowAppGuide(false)}
              >
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẢO MẬT */}
      {showSecurityModal && <SecurityModal onClose={() => setShowSecurityModal(false)} />}
    </>
  );
}