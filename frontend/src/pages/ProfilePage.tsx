import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { 
  User, Calendar, Mail, Phone, Ruler, Scale, 
  ArrowLeft, Camera, Loader2 
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();

  // Khởi tạo state dựa trên dữ liệu user hiện tại
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    dob: user?.dob || "",
    gender: user?.gender || "Chưa chọn",
    email: user?.email || "",
    phone: user?.phone || "",
    height: user?.height || "",
    weight: user?.weight || "",
    healthGoal: user?.healthGoal || "Duy trì sức khỏe"
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Cập nhật lại form nếu user data load chậm
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        dob: user.dob || "",
        gender: user.gender || "Chưa chọn",
        email: user.email || "",
        phone: user.phone || "",
        height: user.height || "",
        weight: user.weight || "",
        healthGoal: user.healthGoal || "Duy trì sức khỏe"
      });
    }
  }, [user]);

  // Xử lý khi gõ vào input
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Hàm Lưu thay đổi gọi API
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await api.put("users/profile", profileData);
      // Reload user từ server để cập nhật đúng dữ liệu
      await fetchMe();
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu hồ sơ:", error);
      toast.error("Lỗi khi lưu hồ sơ. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#0f172a] text-[#17212b] dark:text-white font-sans p-[20px] md:p-[40px] transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        
        {/* Nút quay lại & Tiêu đề */}
        <div className="flex items-center gap-4 mb-[30px]">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white dark:bg-[#1e293b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-[#e8edf2] dark:border-[#334155]"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold">Hồ sơ cá nhân</h1>
            <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[2px]">Quản lý thông tin và dữ liệu sức khỏe của bạn.</p>
          </div>
        </div>

        {/* Khung nội dung chính */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[30px] md:p-[40px] transition-colors duration-300">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-[100px] h-[100px] bg-gradient-to-br from-[#d7f8eb] to-[#b5efd9] dark:from-[#18b77a]/30 dark:to-[#18b77a]/10 text-[#0b9665] dark:text-[#18b77a] rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-sm border border-[#a3e4c8] dark:border-[#18b77a]/30">
              {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <button className="text-[#18b77a] font-semibold text-[14px] flex items-center gap-1.5 hover:text-[#149965] transition-colors">
              <Camera className="w-4 h-4" /> Thay đổi ảnh đại diện
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Họ và tên */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="text" 
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px]" 
                  placeholder="Nguyễn An"
                />
              </div>
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày sinh</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="date" 
                  name="dob"
                  value={profileData.dob}
                  onChange={handleProfileChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px] [color-scheme:light] dark:[color-scheme:dark]" 
                />
              </div>
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Giới tính</label>
              <select 
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px] appearance-none cursor-pointer"
              >
                <option value="Chưa chọn">Chưa chọn</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={profileData.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-[#e8edf2] dark:border-[#334155] rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed text-[14px]" 
                  placeholder="nguyenan@example.com"
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px]" 
                  placeholder="0901234567"
                />
              </div>
            </div>

            {/* Chiều cao */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Chiều cao (cm)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Ruler className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="number" 
                  name="height"
                  value={profileData.height}
                  onChange={handleProfileChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px]" 
                  placeholder="170"
                />
              </div>
            </div>

            {/* Cân nặng */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Cân nặng (kg)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Scale className="h-[18px] w-[18px]" />
                </div>
                <input 
                  type="number" 
                  name="weight"
                  value={profileData.weight}
                  onChange={handleProfileChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px]" 
                  placeholder="65"
                />
              </div>
            </div>

            {/* Mục tiêu sức khỏe */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Mục tiêu sức khỏe</label>
              <select 
                name="healthGoal"
                value={profileData.healthGoal}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-[#e8edf2] dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-[14px] appearance-none cursor-pointer"
              >
                <option value="Duy trì sức khỏe">Duy trì sức khỏe</option>
                <option value="Giảm cân">Giảm cân</option>
                <option value="Tăng cơ">Tăng cơ</option>
                <option value="Cải thiện tim mạch">Cải thiện tim mạch</option>
              </select>
            </div>

          </div>

          {/* Nút lưu */}
          <div className="mt-10 flex justify-end">
            <button 
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-[#18b77a] hover:bg-[#149965] text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 flex items-center gap-2 text-[15px] shadow-[0_4px_15px_rgba(24,183,122,0.3)] hover:shadow-[0_6px_20px_rgba(24,183,122,0.4)]"
            >
              {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}