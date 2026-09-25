import { HeartPulse, ShieldCheck, ArrowRight, ActivitySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router"; 
import { useAuthStore } from "@/stores/useAuthStore"; 

export default function HomePage() {
  // Lấy trạng thái user để đổi nút ở giữa trang
  const { user } = useAuthStore(); 

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Phần giới thiệu chính (Hero Section) */}
      {/* Giảm khoảng cách mt-12 thành mt-8 trên mobile */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-6 mt-8 md:mt-24">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs md:text-sm text-blue-600 mb-6 md:mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          Hệ thống theo dõi thời gian thực
        </div>
        
        {/* Thu nhỏ chữ 1 chút trên mobile (text-3xl), lên máy tính to ra 5xl/6xl */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-4 md:mb-6 tracking-tight max-w-4xl">
          Theo Dõi Sức Khỏe Tim Mạch <br className="hidden md:block" /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Thông Minh & Liên Tục
          </span>
        </h1>
        
        <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 max-w-2xl leading-relaxed px-2 md:px-0">
          Nền tảng kết nối thiết bị IoT, thu thập chỉ số nhịp tim và nồng độ oxy trong máu (SpO2) chính xác. Phát hiện bất thường và cảnh báo tức thì để bảo vệ sức khỏe của bạn và gia đình.
        </p>
        
        {/* LOGIC ĐỔI NÚT Ở GIỮA TRANG */}
        {/* Ép w-full cho khối chứa nút trên mobile */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
          {user ? (
             <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 w-full bg-blue-600 hover:bg-blue-700 text-base md:text-lg px-8 h-12 md:h-14">
                Vào bảng điều khiển <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              {/* Thẻ Link cũng cần w-full để nút bấm bên trong bung hết cỡ */}
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 w-full bg-blue-600 hover:bg-blue-700 text-base md:text-lg px-8 h-12 md:h-14">
                  Bắt đầu theo dõi ngay <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base md:text-lg px-8 h-12 md:h-14 bg-white">
                  Vào bảng điều khiển
                </Button>
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Phần tính năng (Features) */}
      {/* Giảm khoảng cách py-20 thành py-12 trên mobile */}
      <section className="py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mt-8 md:mt-12">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-red-100 w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-4 md:mb-6">
            <HeartPulse className="h-6 w-6 md:h-7 md:w-7 text-red-600" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">Nhịp tim & SpO2</h3>
          <p className="text-sm md:text-base text-slate-600">Đồng bộ dữ liệu liên tục từ cảm biến MAX30102, hiển thị biểu đồ trực quan biến thiên sức khỏe theo từng giây.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-cyan-100 w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-4 md:mb-6">
            <ActivitySquare className="h-6 w-6 md:h-7 md:w-7 text-cyan-600" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">Cảnh báo tức thì</h3>
          <p className="text-sm md:text-base text-slate-600">Hệ thống phân tích Node-RED xử lý tín hiệu thông minh, lập tức phát tín hiệu cảnh báo khi chỉ số vượt ngưỡng an toàn.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-green-100 w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-4 md:mb-6">
            <ShieldCheck className="h-6 w-6 md:h-7 md:w-7 text-green-600" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">Bảo mật dữ liệu</h3>
          <p className="text-sm md:text-base text-slate-600">Mọi thông tin y tế cá nhân đều được mã hóa chuẩn JWT và lưu trữ an toàn trên hệ thống MongoDB Cloud.</p>
        </div>
      </section>

      {/* Sửa text footer nhỏ lại xíu trên mobile */}
      <footer className="mt-auto py-6 md:py-8 border-t border-slate-200 bg-white text-center text-slate-500 text-xs md:text-sm px-4">
        <p>© 2026 Hệ thống Chăm Sóc Sức Khỏe (CSSK). Đồ án phát triển.</p>
      </footer>
    </div>
  );
}