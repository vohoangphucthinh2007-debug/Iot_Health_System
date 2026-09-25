import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Camera, Edit, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { authService } from "@/services/authService"; // Import service gọi API

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  
  // Trạng thái bật/tắt chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lưu trữ dữ liệu đang nhập
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    dateOfBirth: "",
    address: ""
  });

  // Đồng bộ dữ liệu từ store vào form khi load trang
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        phone: user.phone || "",
        // Xử lý định dạng ngày tháng chuẩn yyyy-mm-dd cho thẻ <input type="date">
        dateOfBirth: (user as any)?.dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : "",
        address: (user as any)?.address || ""
      });
    }
  }, [user]);

  // Hàm xử lý khi gõ vào ô input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm gửi dữ liệu lên Backend
  const handleUpdate = async () => {
    try {
      setLoading(true);
      // Gọi API cập nhật
      await authService.updateProfile(formData);
      
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false); // Tắt chế độ sửa
      
      // Cập nhật lại thông tin mới nhất vào Zustand Store
      await fetchMe(); 
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Đổi p-6 thành p-4 trên mobile để tiết kiệm diện tích màn hình
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại trang chủ
        </Link>

        {/* Chữ nhỏ lại xíu trên mobile (text-2xl) */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* CỘT TRÁI: AVATAR */}
          <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-4 border-white shadow-sm overflow-hidden">
                <User className="h-12 w-12" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user?.displayName || "Chưa cập nhật"}</h2>
            <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-200">
              Tài khoản đang hoạt động
            </span>
          </div>

          {/* CỘT PHẢI: FORM THÔNG TIN */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Thông tin chi tiết</h3>
              
              {/* Nút bật/tắt chế độ sửa */}
              {!isEditing ? (
                <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" /> Chỉnh sửa
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:bg-slate-100" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" /> Hủy
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><User className="h-4 w-4"/> Họ và tên</label>
                  <input 
                    type="text" name="displayName" 
                    disabled={!isEditing} 
                    value={formData.displayName} onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${isEditing ? "bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Mail className="h-4 w-4"/> Email liên hệ</label>
                  <input type="email" disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400" value={user?.email || ""} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Phone className="h-4 w-4"/> Số điện thoại</label>
                  <input 
                    type="text" name="phone" placeholder="Chưa cập nhật"
                    disabled={!isEditing} 
                    value={formData.phone} onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${isEditing ? "bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4"/> Ngày sinh</label>
                  <input 
                    type="date" name="dateOfBirth"
                    disabled={!isEditing} 
                    value={formData.dateOfBirth} onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${isEditing ? "bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`} 
                  />
                </div>
                
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4"/> Địa chỉ liên hệ</label>
                  <input 
                    type="text" name="address" placeholder="Ví dụ: KTX ĐH SPKT, TP.HCM"
                    disabled={!isEditing} 
                    value={formData.address} onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${isEditing ? "bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600"}`} 
                  />
                </div>
              </div>
              
              {/* Ép w-full cho mobile, lên máy tính rụt lại w-auto */}
              {isEditing && (
                <div className="pt-4 flex justify-end">
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" onClick={handleUpdate} disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}