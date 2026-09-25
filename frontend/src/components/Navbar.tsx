import { User, ActivitySquare, Settings, LogOut, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router"; 
import { useAuthStore } from "@/stores/useAuthStore";

export default function Navbar() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 gap-1">
        
        {/* KHỐI LOGO VÀ MENU CHÍNH */}
        <div className="flex items-center gap-2 sm:gap-6 shrink min-w-0">
          
          {/* Logo - Ẩn chữ CSSK trên mobile để tiết kiệm diện tích */}
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0">
            <img src="/logo.jpg" alt="logo" className="h-7 sm:h-9 md:h-10 w-auto rounded-md object-contain" />
            <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 hidden sm:block">
              CSSK
            </span>
          </Link>

          {/* CÁC TRANG CƠ BẢN - Chỉ hiện icon trên mobile, hiện cả chữ trên màn lớn */}
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

        {/* KHỐI TÀI KHOẢN & NÚT TẢI APP */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          
          {/* Nút tải App - Tối ưu size cho mobile */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open("https://iot-health-system-red.vercel.app", "_blank")}
            className="text-[11px] sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
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
                      <LogOut className="h-4 w-4" /> Đăng xuất an toàn
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
  );
}