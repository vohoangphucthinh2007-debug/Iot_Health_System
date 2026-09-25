import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router"; 
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSaveSettings = () => {
    toast.success("Đã lưu các cài đặt thành công!");
  };

  return (
    // Sửa p-6 thành p-4 cho mobile, lên màn hình to (md) mới dùng p-10 cho thoáng
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-10">
      
      {/* Thêm w-full để đảm bảo luôn bung hết cỡ trên mobile trước khi bị giới hạn bởi max-w-3xl */}
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại trang chủ
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>

        {/* Khối Cài đặt cảnh báo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">Cảnh báo sức khỏe (Node-RED)</h2>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Thêm gap-4 để text không dính vào nút, flex-1 cho text và shrink-0 cho nút gạt để nút gạt không bao giờ bị bóp méo */}
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm md:text-base font-medium text-slate-900">Cảnh báo nhịp tim bất thường</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Gửi thông báo khi nhịp tim vọt lên quá 100 bpm hoặc tụt dưới 60 bpm</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm md:text-base font-medium text-slate-900">Cảnh báo SpO2 thấp</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Báo động ngay lập tức nếu nồng độ Oxy dưới 95%</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

          </div>
        </div>

        {/* Khối Đổi mật khẩu */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <Lock className="h-5 w-5 text-slate-700 shrink-0" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">Bảo mật tài khoản</h2>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none max-w-md block" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none max-w-md block" />
            </div>
            
            <Button className="w-full sm:w-auto mt-4" variant="outline" onClick={handleSaveSettings}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}