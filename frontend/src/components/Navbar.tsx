import { useState, useEffect } from "react";
import { User, ActivitySquare, Settings, LogOut, Home, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router"; 
import { useAuthStore } from "@/stores/useAuthStore";

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Bắt sự kiện hệ thống cho phép cài đặt App (Chỉ hoạt động trên Android/Chrome)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Ngăn trình duyệt tự động hiện bảng quá sớm
      e.preventDefault();
      // Lưu trữ lại sự kiện để gọi khi người dùng bấm nút
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Hàm xử lý khi bấm nút Tải App
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Máy hỗ trợ cài tự động (Android) -> Hiện bảng xác nhận của hệ thống
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Máy không hỗ trợ (iPhone) hoặc web chưa cấu hình đủ chuẩn PWA -> Hiện bảng dự phòng
      setShowAppGuide(true);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 gap-1">
          
          <div className="flex items-center gap-2 sm:gap-6 shrink min-w-0">
            <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0">
              <img src="/logo.jpg" alt="logo" className="h-7 sm:h-9 md:h-10 w-auto rounded-md object-contain" />
              <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 hidden sm:block">
                CSSK
              </span>
            </Link>

            <nav className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <Link to="/" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <Home className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Trang chủ</span>
              </Link>
              <Link to="/guide" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <BookOpen className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Hướng dẫn</span>
              </Link>
              <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <ActivitySquare className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" /> 
                <span className="hidden sm:inline text-sm font-semibold">Bảng đo</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            
            {/* Nút tải App thông minh */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInstallClick}
              className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Tải App
            </Button>

            {user ? (
              <div className="relative group">
                <Button variant="outline" size="sm" className="font-semibold flex items-center gap-1 text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> 
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">
                    {user.displayName || "Tài khoản"}
                  </span>
                </Button>
                
                <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-slate-100 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || "Người dùng"}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                        <User className="h-4 w-4" /> Thông tin cá nhân
                      </Link>
                      <Link to="/settings" className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Cài đặt & Cảnh báo
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button onClick={signOut} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline" size="sm" className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8 font-semibold">Đăng nhập</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8 font-semibold bg-blue-600 hover:bg-blue-700">Đăng ký</Button>
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
                  <p><strong>iOS (iPhone):</strong> Bấm nút <em>Chia sẻ</em> (dưới cùng) {'->'} Chọn <em>Thêm vào MH chính</em>.</p>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-xl">🤖</span>
                  <p><strong>Android/PC:</strong> Trình duyệt chưa hỗ trợ cài tự động, hãy bấm <em>Menu 3 chấm</em> {'->'} <em>Thêm vào Màn hình chính/Cài đặt ứng dụng</em>.</p>
                </div>
              </div>
              {/* NÚT TẢI FILE APK TRỰC TIẾP ÔNG VỪA THÊM */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-2">Cài đặt trực tiếp (Android):</p>
                <Button 
                  variant="outline"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
                  onClick={() => window.open("https://drive.google.com/file/d/1Op8O3PeTyqJAYSNO_6LMd0Rx_uoXrmFT/view?usp=sharinghttps://drive.google.com/file/d/1Op8O3PeTyqJAYSNO_6LMd0Rx_uoXrmFT/view?usp=sharing", "_blank")}
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
    </>
  );
}