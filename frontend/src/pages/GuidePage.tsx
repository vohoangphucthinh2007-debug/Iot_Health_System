import { BookOpen, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function GuidePage() {
  return (
    // Giảm p-6 thành p-4 trên mobile, giữ p-12 cho PC để 2 bên lề thoáng đãng
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-12">
      
      {/* Giảm khoảng cách giữa các phần trên mobile (space-y-6 thay vì 8) */}
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          {/* Thu nhỏ icon 1 chút trên mobile, thêm shrink-0 chống méo */}
          <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-blue-600 shrink-0" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Hướng dẫn sử dụng hệ thống CSSK</h1>
        </div>

        {/* Giảm gap giữa các thẻ trên mobile */}
        <div className="grid gap-4 md:gap-6">
          
          {/* Hướng dẫn đeo cảm biến */}
          {/* Giảm padding bên trong thẻ trên mobile (p-4 thay vì p-6) */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 mb-3 md:mb-4">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> 1. Cách đo nhịp tim & SpO2
            </h2>
            {/* Chữ nhỏ hơn xíu trên điện thoại (text-sm), lên máy tính to ra (text-base) */}
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-slate-600">
              <li>Đặt ngón tay trỏ hoặc ngón giữa lên bề mặt cảm biến MAX30100 (phần có đèn LED đỏ sáng).</li>
              <li>Nhấn một lực **vừa phải**. Không ấn quá mạnh (làm nghẽn mạch máu) và không để quá lỏng (lọt ánh sáng từ bên ngoài).</li>
              <li>Giữ yên ngón tay, hạn chế cử động trong khoảng **5 - 10 giây** để hệ thống ổn định và vẽ biểu đồ.</li>
            </ul>
          </div>

          {/* Ý nghĩa chỉ số */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 mb-3 md:mb-4">
              <Info className="h-5 w-5 text-blue-500 shrink-0" /> 2. Ý nghĩa các chỉ số
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="font-bold text-red-700 text-sm md:text-base">❤️ Nhịp tim (Heart Rate - BPM):</p>
                <p className="text-xs md:text-sm text-red-600 mt-1">Người trưởng thành bình thường lúc nghỉ ngơi dao động từ <strong>60 - 100 nhịp/phút</strong>. Nếu tập thể thao có thể cao hơn.</p>
              </div>
              <div className="p-3 md:p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                <p className="font-bold text-cyan-700 text-sm md:text-base">💨 Nồng độ Oxy trong máu (SpO2 - %):</p>
                <p className="text-xs md:text-sm text-cyan-600 mt-1">
                  • <strong>95% - 100%:</strong> Rất tốt, trạng thái bình thường.<br/>
                  • <strong>90% - 94%:</strong> Cần theo dõi, có dấu hiệu thiếu oxy.<br/>
                  • <strong>Dưới 90%:</strong> Nguy hiểm, cần sự can thiệp của y tế!
                </p>
              </div>
            </div>
          </div>

          {/* Khắc phục lỗi */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 mb-3 md:mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" /> 3. Xử lý sự cố thường gặp
            </h2>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-slate-600">
              <li><strong>Chỉ số nhảy loạn xạ:</strong> Do ngón tay bị rung hoặc bị ướt. Lau khô tay và giữ yên tĩnh.</li>
              <li><strong>Ứng dụng báo mất kết nối:</strong> Kiểm tra lại mạng WiFi của mạch ESP32. Đảm bảo đèn báo trên mạch vẫn đang sáng.</li>
              <li><strong>Không hiện số SpO2:</strong> SpO2 cần thời gian đo lâu hơn nhịp tim. Vui lòng giữ ngón tay trên cảm biến lâu hơn 10 giây.</li>
            </ul>
          </div>
          
        </div>
      </div>
    </div>
  );
}