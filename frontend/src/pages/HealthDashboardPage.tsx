import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar 
} from 'recharts';
import { 
  Home, HeartPulse, Wind, BarChart3, Settings, 
  TrendingUp, Cpu, RefreshCw, Footprints, Flame, Route, Award, TrendingDown, FileText, X,
  User, Shield, Bell, Droplet, Database, Download, Moon, Languages, Cloud, Info, ChevronRight,
  Camera, Calendar, Mail, Phone, Ruler, Scale, ArrowLeft, Loader2
} from "lucide-react";
// Import store để lấy và cập nhật thông tin user (Nếu bạn dùng Zustand)
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore"; 

const dailyMockData = [
  { time: "T2", hr: 72, spo2: 98 }, { time: "T3", hr: 75, spo2: 97 },
  { time: "T4", hr: 71, spo2: 99 }, { time: "T5", hr: 78, spo2: 96 },
  { time: "T6", hr: 74, spo2: 98 }, { time: "T7", hr: 80, spo2: 97 }, 
  { time: "Hôm nay", hr: 0, spo2: 0 },
];

const monthlyMockData = [
  { time: "Tuần 1", hr: 74, spo2: 98 }, { time: "Tuần 2", hr: 75, spo2: 97 },
  { time: "Tuần 3", hr: 72, spo2: 98 }, { time: "Tuần này", hr: 0, spo2: 0 },
];

const stepsMockData = [
  { day: "T2", steps: 4200 }, { day: "T3", steps: 6500 },
  { day: "T4", steps: 8100 }, { day: "T5", steps: 5200 },
  { day: "T6", steps: 9400 }, { day: "T7", steps: 7200 },
  { day: "Hôm nay", steps: 0 },
];

// Nút gạt Toggle được thiết kế lại để hỗ trợ Dark Mode
const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick?: () => void }) => (
  <div onClick={onClick} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${active ? 'bg-[#18b77a]' : 'bg-[#e2e8f0] dark:bg-slate-600'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
  </div>
);

export function HealthDashboardPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  // Bao gồm tất cả các tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'heart' | 'spo2' | 'statistics' | 'reports' | 'settings' | 'profile'>('dashboard');

  const [heartRate, setHeartRate] = useState<number>(0);
  const [spO2, setSpO2] = useState<number>(0);
  const [steps, setSteps] = useState<number>(0);
  const [calories, setCalories] = useState<number>(0);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'daily' | 'monthly'>('live');
  
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // STATE QUẢN LÝ HỒ SƠ CÁ NHÂN
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

  // CÀI ĐẶT HỆ THỐNG — dùng global store để persist và áp dụng toàn trang
  const appSettings = useSettingsStore();
  const { toggleSetting: toggleStoreSetting } = useSettingsStore();

  const [sessionStats, setSessionStats] = useState({ 
    sumHr: 0, sumSpo2: 0, count: 0, 
    maxHr: 0, minHr: 999, 
    maxSpo2: 0, minSpo2: 100 
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Dark mode được xử lý toàn cục trong App.tsx thông qua useSettingsStore

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

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiUrl.replace('/api', '');
    const socket = io(socketUrl); 

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => {
      setIsConnected(false);
      setHeartRate(0); 
      setSpO2(0);
    });

    socket.on("sensorData", (data) => {
      setHeartRate(data.heartRate || 0);
      setSpO2(data.spO2 || 0);
      if (data.steps !== undefined) setSteps(data.steps);
      if (data.calories !== undefined) setCalories(data.calories);

      setLiveData((prev) => {
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newDataPoint = { time: timeString, hr: data.heartRate, spo2: data.spO2 };
        return [...prev.slice(-19), newDataPoint];
      });

      if (data.heartRate > 0 && data.spO2 > 0) {
        setSessionStats(prev => ({
          sumHr: prev.sumHr + data.heartRate,
          sumSpo2: prev.sumSpo2 + data.spO2,
          count: prev.count + 1,
          maxHr: Math.max(prev.maxHr, data.heartRate),
          minHr: prev.minHr === 999 ? data.heartRate : Math.min(prev.minHr, data.heartRate),
          maxSpo2: Math.max(prev.maxSpo2, data.spO2),
          minSpo2: Math.min(prev.minSpo2, data.spO2)
        }));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("sensorData");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      const fetchReports = async () => {
        setIsLoadingReports(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
          const res = await axios.get(`${apiUrl}/users/reports`, { withCredentials: true });
          setReports(res.data);
        } catch (error) {
          console.error("Lỗi lấy báo cáo từ server:", error);
        } finally {
          setIsLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
      const res = await axios.put(`${apiUrl}/users/profile`, profileData, {
        withCredentials: true
      });
      setUser(res.data);
      alert("Cập nhật hồ sơ thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu hồ sơ:", error);
      alert("Lỗi khi lưu hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileChange = (e: any) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSetting = (key: string) => {
    toggleStoreSetting(key as any);
  };

  const avgHr = sessionStats.count > 0 ? Math.round(sessionStats.sumHr / sessionStats.count) : 0;
  const avgSpo2 = sessionStats.count > 0 ? Math.round(sessionStats.sumSpo2 / sessionStats.count) : 0;
  const maxHrDisp = sessionStats.count === 0 ? '--' : sessionStats.maxHr;
  const minHrDisp = sessionStats.count === 0 ? '--' : sessionStats.minHr;
  const maxSpo2Disp = sessionStats.count === 0 ? '--' : sessionStats.maxSpo2;
  const minSpo2Disp = sessionStats.count === 0 ? '--' : sessionStats.minSpo2;
  const distanceKm = steps > 0 ? (steps * 0.0007).toFixed(2) : '--';

  const getChartData = () => {
    if (viewMode === 'daily') {
      const dynamicDaily = [...dailyMockData];
      if (avgHr > 0) dynamicDaily[6] = { time: "Hôm nay", hr: avgHr, spo2: avgSpo2 };
      return dynamicDaily;
    }
    if (viewMode === 'monthly') {
      const dynamicMonthly = [...monthlyMockData];
      if (avgHr > 0) dynamicMonthly[3] = { time: "Tuần này", hr: avgHr, spo2: avgSpo2 };
      return dynamicMonthly;
    }
    return liveData;
  };

  const getStepsChartData = () => {
    const dynamicSteps = [...stepsMockData];
    if (steps > 0) dynamicSteps[6] = { day: "Hôm nay", steps: steps };
    return dynamicSteps;
  };

  const getHealthStatus = () => {
    if (heartRate === 0 && spO2 === 0) return { text: "Chưa có dữ liệu", score: 0, trend: "Chờ kết nối", color: "#8b96a5", darkColor: "#64748b" };
    if (spO2 < 95) return { text: "SpO2 Đang Thấp!", score: 65, trend: "Cần chú ý", color: "#f45d69", darkColor: "#f45d69" };
    if (heartRate > 100) return { text: "Nhịp tim cao", score: 75, trend: "Vận động mạnh?", color: "#f5a33b", darkColor: "#f5a33b" };
    if (heartRate < 60) return { text: "Nhịp tim thấp", score: 80, trend: "Đang nghỉ ngơi", color: "#4385f5", darkColor: "#4385f5" };
    return { text: "Sức khỏe ổn định", score: 98, trend: "Tốt hơn 8% so với tuần trước", color: "#18b77a", darkColor: "#18b77a" };
  };

  const status = getHealthStatus();

  return (
    <div className="flex flex-col md:flex-row bg-[#f5f7fb] dark:bg-[#0f172a] text-[#17212b] dark:text-white font-sans w-full min-h-[calc(100vh-65px)] transition-colors duration-300">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="hidden md:block w-[245px] shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto bg-white dark:bg-[#1e293b] border-r border-[#e8edf2] dark:border-[#334155] py-[25px] px-[15px] z-10 transition-colors duration-300">
        <div className="text-[10px] font-bold text-[#a2aab5] dark:text-slate-400 tracking-[1px] px-[13px] mb-[9px] uppercase">Theo dõi</div>
        
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <Home className="w-[18px] h-[18px]" /><span>Tổng quan</span>
        </button>
        <button onClick={() => setActiveTab('heart')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'heart' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <HeartPulse className="w-[18px] h-[18px]" /><span>Nhịp tim</span>
        </button>
        <button onClick={() => setActiveTab('spo2')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'spo2' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <Wind className="w-[18px] h-[18px]" /><span>SpO₂</span>
        </button>

        <div className="text-[10px] font-bold text-[#a2aab5] dark:text-slate-400 tracking-[1px] px-[13px] m-[22px_0_9px] uppercase mt-4">Hệ thống</div>
        
        <button onClick={() => setActiveTab('statistics')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'statistics' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <BarChart3 className="w-[18px] h-[18px]" /><span>Thống kê sức khoẻ</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <FileText className="w-[18px] h-[18px]" /><span>Báo cáo</span>
        </button>

        <button className="w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10 text-[14px] font-semibold transition-all cursor-pointer">
          <Cpu className="w-[18px] h-[18px]" /><span>Thiết bị</span>
        </button>
        
        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${['settings', 'profile'].includes(activeTab) ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-300 hover:text-[#18b77a] hover:bg-[#f3faf7] dark:hover:bg-[#18b77a]/10'}`}>
          <Settings className="w-[18px] h-[18px]" /><span>Cài đặt</span>
        </button>
      </aside>

      {/* ================= BOTTOM NAV (MOBILE) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-white dark:bg-[#1e293b] border-t border-[#e8edf2] dark:border-[#334155] z-[50] flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <button onClick={() => setActiveTab('dashboard')} className={`p-[10px] rounded-[11px] ${activeTab === 'dashboard' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-400'}`}><Home className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('heart')} className={`p-[10px] rounded-[11px] ${activeTab === 'heart' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-400'}`}><HeartPulse className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('spo2')} className={`p-[10px] rounded-[11px] ${activeTab === 'spo2' ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-400'}`}><Wind className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-[10px] rounded-[11px] ${['settings', 'profile'].includes(activeTab) ? 'text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10' : 'text-[#707b8b] dark:text-slate-400'}`}><Settings className="w-[20px] h-[20px]" /></button>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-[20px] pb-[90px] md:pb-[60px] md:p-[30px_40px] max-w-[1500px] w-full relative">
        
        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-[25px]">
              <h1 className="text-[24px] md:text-[28px] font-bold">Bảng theo dõi 👋</h1>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Đây là tình trạng sức khỏe của bạn hiện tại.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[20px] mb-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none min-h-[270px] p-[25px] flex flex-col md:flex-row items-center justify-between overflow-hidden relative transition-colors duration-300">
                <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 90% 20%, #18b77a 0, transparent 40%)' }}></div>
                <div className="text-center md:text-left relative z-10">
                  <h2 className="text-[23px] font-bold">Điểm sức khỏe</h2>
                  <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] m-[8px_0_20px]">Tổng hợp dựa trên dữ liệu từ thiết bị đeo.</p>
                  <div className="inline-flex items-center gap-[8px] bg-[#e9faf3] dark:bg-[#18b77a]/20 text-[#18b77a] p-[8px_12px] rounded-[30px] text-[12px] font-semibold">
                    <TrendingUp className="w-[14px] h-[14px]" /> {status.trend}
                  </div>
                </div>
                <div className="w-[170px] h-[170px] rounded-full flex justify-center items-center mt-[20px] md:mt-0 relative z-10" 
                     style={{ background: `conic-gradient(${appSettings.darkMode ? status.darkColor : status.color} ${status.score}%, ${appSettings.darkMode ? '#334155' : '#e9eef2'} ${status.score}%)` }}>
                  <div className="w-[132px] h-[132px] bg-white dark:bg-[#1e293b] rounded-full flex flex-col justify-center items-center shadow-sm">
                    <strong className="text-[38px] font-bold">{status.score}</strong>
                    <span className="text-[11px] text-[#8b96a5] dark:text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] flex flex-col justify-between transition-colors duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[16px]">Thiết bị</div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[3px]">Thiết bị theo dõi hiện tại</div>
                  </div>
                  {!isConnected ? (
                    <div className="text-[#f45d69] text-[12px] font-semibold flex items-center bg-[#fff0f2] dark:bg-[#f45d69]/10 px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#f45d69] rounded-full mr-[6px]"></span> Mất kết nối
                    </div>
                  ) : heartRate > 0 ? (
                    <div className="text-[#18b77a] text-[12px] font-semibold flex items-center bg-[#e9faf3] dark:bg-[#18b77a]/10 px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#18b77a] rounded-full mr-[6px] animate-pulse"></span> Đang truyền
                    </div>
                  ) : (
                    <div className="text-[#f5a33b] text-[12px] font-semibold flex items-center bg-[#fff5e8] dark:bg-[#f5a33b]/10 px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#f5a33b] rounded-full mr-[6px]"></span> Chờ tín hiệu
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-[15px] m-[25px_0]">
                  <div className="w-[58px] h-[58px] bg-[#20262e] dark:bg-slate-700 text-white rounded-[17px] flex justify-center items-center">
                    <Cpu className="w-[26px] h-[26px]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold">Mạch ESP32</h3>
                    <p className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[5px]">Kết nối Socket.io · MAX30102</p>
                  </div>
                </div>
                <button onClick={() => setSessionStats({ sumHr: 0, sumSpo2: 0, count: 0, maxHr: 0, minHr: 999, maxSpo2: 0, minSpo2: 100 })} className="w-full border-none bg-[#e9faf3] dark:bg-[#18b77a]/10 text-[#18b77a] p-[10px_15px] rounded-[10px] font-semibold cursor-pointer hover:bg-[#d6f5e7] dark:hover:bg-[#18b77a]/20 transition-colors flex justify-center items-center gap-2">
                  <RefreshCw className="w-[14px] h-[14px]" /> Khởi tạo lại phiên đo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[20px]">
              <div onClick={() => setActiveTab('heart')} className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[24px] cursor-pointer hover:border-[#18b77a] transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[13px] font-medium">Nhịp tim</div>
                    <div className="text-[30px] font-bold mt-[4px]">{heartRate > 0 ? heartRate : '--'} <small className="text-[14px] font-normal text-[#8b96a5] dark:text-slate-400">BPM</small></div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#18b77a] bg-[#e9faf3] dark:bg-[#18b77a]/10">
                    <HeartPulse className={`w-[24px] h-[24px] ${heartRate > 0 ? 'animate-pulse' : ''}`} />
                  </div>
                </div>
              </div>

              <div onClick={() => setActiveTab('spo2')} className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[24px] cursor-pointer hover:border-[#4385f5] transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[13px] font-medium">SpO₂</div>
                    <div className="text-[30px] font-bold mt-[4px]">{spO2 > 0 ? spO2 : '--'}<small className="text-[14px] font-normal text-[#8b96a5] dark:text-slate-400">%</small></div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#4385f5] bg-[#edf4ff] dark:bg-[#4385f5]/10">
                    <Wind className="w-[24px] h-[24px]" />
                  </div>
                </div>
              </div>

              <div onClick={() => setActiveTab('statistics')} className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[24px] cursor-pointer hover:border-[#f5a33b] transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[13px] font-medium">Bước chân</div>
                    <div className="text-[30px] font-bold mt-[4px]">{steps > 0 ? steps.toLocaleString() : '--'}</div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#f5a33b] bg-[#fff5e8] dark:bg-[#f5a33b]/10">
                    <Footprints className="w-[24px] h-[24px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] flex flex-col transition-colors duration-300">
              <div className="mb-[20px]">
                <div className="font-bold text-[16px]">Hoạt động trong tuần</div>
                <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[5px]">Số bước chân mỗi ngày</div>
              </div>
              
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getStepsChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={appSettings.darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <Tooltip cursor={{fill: appSettings.darkMode ? '#334155' : '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: appSettings.darkMode ? '#1e293b' : 'white', color: appSettings.darkMode ? 'white' : 'black', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '13px' }}/>
                    <Bar dataKey="steps" name="Số bước" fill="url(#colorSteps)" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NHỊP TIM */}
        {activeTab === 'heart' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="mb-[25px]">
              <h2 className="text-[24px] font-bold">Nhịp tim</h2>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Theo dõi dữ liệu nhịp tim trực tiếp từ thiết bị đeo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[16px] font-bold text-slate-800 dark:text-white">Nhịp tim hiện tại</div>
                <div className="text-[42px] font-bold my-[15px]">{heartRate > 0 ? heartRate : '--'} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">BPM</small></div>
                <span className="text-[#18b77a] text-[13px] font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#18b77a] animate-pulse"></span> Trong giới hạn bình thường</span>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-[8px] rounded-full overflow-hidden mt-4">
                  <div className="bg-[#18b77a] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((heartRate / 150) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[16px] font-bold text-slate-800 dark:text-white">Nhịp tim trung bình</div>
                <div className="text-[42px] font-bold my-[15px]">{avgHr > 0 ? avgHr : '--'} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">BPM</small></div>
                <p className="text-[#8b96a5] dark:text-slate-400 text-[13px]">Tính toán dựa trên toàn bộ dữ liệu phiên đo hiện tại.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                <div className="text-[16px] font-bold mb-4 text-slate-900 dark:text-white">Biểu đồ nhịp tim</div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={appSettings.darkMode ? '#334155' : '#e8edf2'} />
                      <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#18b77a" domain={['auto', 'auto']} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: appSettings.darkMode ? '#1e293b' : 'white', color: appSettings.darkMode ? 'white' : 'black', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}/>
                      <Line type="monotone" dataKey="hr" name="Nhịp tim (BPM)" stroke="#18b77a" strokeWidth={3.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[18px] font-bold mb-6 text-slate-900 dark:text-white">Thống kê</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-3 w-1/2">Chỉ số</th>
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-3 w-1/2">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Cao nhất</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{maxHrDisp} BPM</td>
                    </tr>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Thấp nhất</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{minHrDisp} BPM</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Trung bình</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{avgHr > 0 ? avgHr : '--'} BPM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SpO2 */}
        {activeTab === 'spo2' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="mb-[25px]">
              <h2 className="text-[24px] font-bold">Nồng độ Oxy (SpO₂)</h2>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Theo dõi độ bão hòa oxy trong máu thời gian thực.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[16px] font-bold text-slate-800 dark:text-white">SpO₂ hiện tại</div>
                <div className="text-[42px] font-bold my-[15px]">{spO2 > 0 ? spO2 : '--'} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">%</small></div>
                <span className="text-[#4385f5] text-[13px] font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4385f5]"></span> Chỉ số an toàn</span>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-[8px] rounded-full overflow-hidden mt-4">
                  <div className="bg-[#4385f5] h-full rounded-full transition-all duration-500" style={{ width: `${spO2}%` }}></div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[16px] font-bold text-slate-800 dark:text-white">SpO₂ trung bình</div>
                <div className="text-[42px] font-bold my-[15px]">{avgSpo2 > 0 ? avgSpo2 : '--'} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">%</small></div>
                <p className="text-[#8b96a5] dark:text-slate-400 text-[13px]">Chỉ số bão hòa oxy lý tưởng dao động từ 95% đến 100%.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                <div className="text-[16px] font-bold mb-4 text-slate-900 dark:text-white">Biểu đồ SpO₂</div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={appSettings.darkMode ? '#334155' : '#e8edf2'} />
                      <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4385f5" domain={[90, 100]} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: appSettings.darkMode ? '#1e293b' : 'white', color: appSettings.darkMode ? 'white' : 'black', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}/>
                      <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#4385f5" strokeWidth={3.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[25px] transition-colors duration-300">
                <div className="text-[18px] font-bold mb-6 text-slate-900 dark:text-white">Thống kê</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-3 w-1/2">Chỉ số</th>
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-3 w-1/2">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Cao nhất</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{maxSpo2Disp} %</td>
                    </tr>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Thấp nhất</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{minSpo2Disp} %</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200 font-medium">Trung bình</td>
                      <td className="py-4 text-[14px] text-slate-800 dark:text-slate-200">{avgSpo2 > 0 ? avgSpo2 : '--'} %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THỐNG KÊ SỨC KHOẺ */}
        {activeTab === 'statistics' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="mb-[25px]">
              <h2 className="text-[24px] font-bold">Thống kê sức khoẻ</h2>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Báo cáo chi tiết và phân tích xu hướng thể chất của bạn.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[20px]">
              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[20px] transition-colors duration-300">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[3px]">Kỷ lục Nhịp tim</div>
                    <div className="text-[25px] font-bold mt-[10px]">{maxHrDisp} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">BPM</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#ef4444] bg-[#fee2e2] dark:bg-[#ef4444]/20">
                    <TrendingUp className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[20px] transition-colors duration-300">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[3px]">SpO₂ Thấp nhất</div>
                    <div className="text-[25px] font-bold mt-[10px]">{minSpo2Disp}<small className="text-[14px] text-[#8b96a5] dark:text-slate-400">%</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#8b5cf6] bg-[#ede9fe] dark:bg-[#8b5cf6]/20">
                    <TrendingDown className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[20px] transition-colors duration-300">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[3px]">Tổng Quãng đường</div>
                    <div className="text-[25px] font-bold mt-[10px]">{distanceKm} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">km</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#10b981] bg-[#d1fae5] dark:bg-[#10b981]/20">
                    <Route className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[20px] transition-colors duration-300">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[3px]">Calo tiêu hao</div>
                    <div className="text-[25px] font-bold mt-[10px]">{calories > 0 ? calories.toLocaleString() : '--'} <small className="text-[14px] text-[#8b96a5] dark:text-slate-400">kcal</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#f97316] bg-[#ffedd5] dark:bg-[#f97316]/20">
                    <Flame className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] flex flex-col mb-[20px] transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[20px] gap-3">
                <div>
                  <div className="font-bold text-[16px]">Biểu đồ tổng hợp Nhịp tim & SpO₂</div>
                  <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[5px]">Dữ liệu lưu trữ hệ thống</div>
                </div>
                
                <div className="flex bg-[#f5f7fb] dark:bg-[#0f172a] p-1 rounded-[10px] shrink-0">
                  <button onClick={() => setViewMode('live')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'live' ? 'bg-white dark:bg-[#1e293b] text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b] dark:hover:text-white'}`}>Live</button>
                  <button onClick={() => setViewMode('daily')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'daily' ? 'bg-white dark:bg-[#1e293b] text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b] dark:hover:text-white'}`}>Ngày</button>
                  <button onClick={() => setViewMode('monthly')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-[#1e293b] text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b] dark:hover:text-white'}`}>Tháng</button>
                </div>
              </div>
              
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={appSettings.darkMode ? '#334155' : '#e8edf2'} />
                    <XAxis dataKey="time" stroke="#8b96a5" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                    <YAxis yAxisId="left" stroke="#18b77a" domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#4385f5" domain={[90, 100]} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: `1px solid ${appSettings.darkMode ? '#334155' : '#e8edf2'}`, backgroundColor: appSettings.darkMode ? '#1e293b' : 'white', color: appSettings.darkMode ? 'white' : 'black', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '13px', padding: '10px 15px' }}/>
                    <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', color: appSettings.darkMode ? '#cbd5e1' : '#17212b', fontWeight: 500 }}/>
                    <Line yAxisId="left" type="monotone" dataKey="hr" name="Nhịp tim" stroke="#18b77a" strokeWidth={3.5} dot={viewMode !== 'live'} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO2" stroke="#4385f5" strokeWidth={3.5} dot={viewMode !== 'live'} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
              <div className="font-bold text-[16px]">Phân tích xu hướng (AI)</div>
              <div className="text-[#8b96a5] dark:text-slate-400 text-[12px] mt-[5px] mb-[15px]">Dự báo dựa trên chuỗi dữ liệu 7 ngày qua</div>

              <div className="flex gap-[15px] py-[12px] border-b border-[#e8edf2] dark:border-[#334155]">
                <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#e9faf3] dark:bg-[#18b77a]/20 text-[#18b77a]">
                  <Award className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <strong className="text-[13px] block text-slate-800 dark:text-slate-200">Cải thiện tim mạch</strong>
                  <p className="text-[12px] text-[#8b96a5] dark:text-slate-400 mt-[4px] leading-relaxed">
                    Nhịp tim lúc nghỉ ngơi của bạn đã giảm 2% so với tuần trước. Đây là dấu hiệu cơ tim đang trở nên khỏe mạnh hơn nhờ việc duy trì số bước chân đều đặn.
                  </p>
                </div>
              </div>

              <div className="flex gap-[15px] py-[12px]">
                <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#fff5e8] dark:bg-[#f5a33b]/20 text-[#f5a33b]">
                  <Flame className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <strong className="text-[13px] block text-slate-800 dark:text-slate-200">Biến động Calo</strong>
                  <p className="text-[12px] text-[#8b96a5] dark:text-slate-400 mt-[4px] leading-relaxed">
                    Hoạt động ngày Thứ 5 tuần này suy giảm, lượng Calo tiêu thụ thấp hơn mức trung bình 15%. Hãy cố gắng vận động bù vào cuối tuần nhé.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BÁO CÁO */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-[25px]">
              <h2 className="text-[24px] font-bold">Báo cáo</h2>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Tổng hợp dữ liệu sức khỏe theo thời gian.</p>
            </div>

            <div className="w-full bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
              <div className="font-bold text-[16px] mb-[20px]">Báo cáo gần đây</div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#e8edf2] dark:border-[#334155]">
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-4 px-4 w-1/4">Thời gian</th>
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-4 px-4 w-1/3">Loại báo cáo</th>
                      <th className="text-left font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-4 px-4 w-1/4">Trạng thái</th>
                      <th className="text-right font-normal text-[#8b96a5] dark:text-slate-400 text-[13px] pb-4 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingReports ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500 text-[14px]">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#18b77a]" />
                          Đang tải dữ liệu báo cáo...
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500 text-[14px]">
                          Chưa có báo cáo nào. Báo cáo đầu tiên sẽ được hệ thống tổng hợp vào lúc 23:59 đêm nay.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="border-b border-[#e8edf2] dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-4 text-[14px] text-slate-800 dark:text-slate-200">{report.date}</td>
                          <td className="py-4 px-4 text-[14px] text-slate-800 dark:text-slate-200">{report.type}</td>
                          <td className="py-4 px-4">
                            <span className="bg-[#e9faf3] dark:bg-[#18b77a]/20 text-[#18b77a] px-3 py-1 rounded-full text-[12px] font-semibold">
                              {report.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => setSelectedReport(report)}
                              className="bg-[#e9faf3] dark:bg-[#18b77a]/20 text-[#18b77a] px-4 py-1.5 rounded-lg text-[13px] font-bold hover:bg-[#d6f5e7] dark:hover:bg-[#18b77a]/40 transition-colors"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CÀI ĐẶT */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-[25px]">
              <h2 className="text-[24px] font-bold">Cài đặt</h2>
              <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[5px]">Tùy chỉnh hệ thống PulseCare.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              {/* Cột Trái */}
              <div className="space-y-[20px]">
                {/* Tài khoản */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <User className="w-[18px] h-[18px]" /> Tài khoản
                  </h3>
                  
                  {/* BẤM VÀO ĐÂY SẼ CHUYỂN SANG TRANG /profile */}
                  <div onClick={() => navigate('/profile')} className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><User className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Hồ sơ cá nhân</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">{user?.displayName || "Cập nhật thông tin"}</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Shield className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Bảo mật</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Mật khẩu, xác thực và phiên đăng nhập</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>

                {/* Theo dõi sức khỏe */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <HeartPulse className="w-[18px] h-[18px]" /> Theo dõi sức khỏe
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><HeartPulse className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Nhịp tim</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Theo dõi liên tục</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.heartRateTracking} onClick={() => toggleSetting('heartRateTracking')} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Wind className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">SpO₂</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Theo dõi oxy máu</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.spo2Tracking} onClick={() => toggleSetting('spo2Tracking')} />
                  </div>
                </div>

                {/* Giao diện */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Settings className="w-[18px] h-[18px]" /> Giao diện
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Moon className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Chế độ tối</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Dark Mode</div>
                      </div>
                    </div>
                    {/* CÔNG TẮC BẬT TẮT CHẾ ĐỘ TỐI */}
                    <ToggleSwitch active={appSettings.darkMode} onClick={() => toggleSetting('darkMode')} />
                  </div>
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Languages className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Ngôn ngữ</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Tiếng Việt</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="space-y-[20px]">
                {/* Thông báo */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Bell className="w-[18px] h-[18px]" /> Thông báo
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Bell className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Cảnh báo sức khỏe</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Thông báo dữ liệu bất thường</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.healthAlerts} onClick={() => toggleSetting('healthAlerts')} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Droplet className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Nhắc uống nước</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Nhắc theo mục tiêu</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.waterReminder} onClick={() => toggleSetting('waterReminder')} />
                  </div>
                </div>

                {/* Quyền riêng tư */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Shield className="w-[18px] h-[18px]" /> Quyền riêng tư
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Database className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Phân tích dữ liệu</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Cho phép phân tích tự động</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.dataAnalysis} onClick={() => toggleSetting('dataAnalysis')} />
                  </div>
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Download className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Tải dữ liệu</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Xuất dữ liệu cá nhân</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>

                {/* Hệ thống */}
                <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[23px] transition-colors duration-300">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                    <Cpu className="w-[18px] h-[18px]" /> Hệ thống
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Cloud className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Sao lưu</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">Tự động sao lưu dữ liệu</div>
                      </div>
                    </div>
                    <ToggleSwitch active={appSettings.autoBackup} onClick={() => toggleSetting('autoBackup')} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400"><Info className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Phiên bản</div>
                        <div className="text-[12px] text-[#8b96a5] dark:text-slate-400">PulseCare v1.0.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: HỒ SƠ CÁ NHÂN (TÍCH HỢP TRONG CÙNG 1 FILE) */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
            {/* Header / Nút quay lại */}
            <div className="flex items-center gap-4 mb-[25px]">
              <button 
                onClick={() => setActiveTab('settings')} 
                className="p-2 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors border border-[#e8edf2] dark:border-[#334155]"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h2 className="text-[24px] font-bold">Hồ sơ cá nhân</h2>
                <p className="text-[#8b96a5] dark:text-slate-400 text-[13px] mt-[2px]">Quản lý thông tin và dữ liệu sức khỏe của bạn.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] border border-[#e8edf2] dark:border-[#334155] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] dark:shadow-none p-[30px] transition-colors duration-300">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8 mt-2">
                <div className="w-24 h-24 bg-gradient-to-br from-[#d7f8eb] to-[#b5efd9] dark:from-[#18b77a]/30 dark:to-[#18b77a]/10 text-[#0b9665] dark:text-[#18b77a] rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-sm border border-[#a3e4c8] dark:border-[#18b77a]/30">
                  {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'NA'}
                </div>
                <button className="text-[#18b77a] font-semibold text-sm flex items-center gap-1.5 hover:text-[#149965] transition-colors">
                  <Camera className="w-4 h-4" /> Thay đổi ảnh đại diện
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                {/* Họ và tên */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="text" 
                      name="displayName"
                      value={profileData.displayName}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm" 
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ngày sinh</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="date" 
                      name="dob"
                      value={profileData.dob}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm [color-scheme:light] dark:[color-scheme:dark]" 
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Giới tính</label>
                  <select 
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm appearance-none"
                  >
                    <option value="Chưa chọn">Chưa chọn</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#334155] rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm" 
                      placeholder="nguyenan@example.com"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm" 
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                {/* Chiều cao */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Chiều cao (cm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Ruler className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="number" 
                      name="height"
                      value={profileData.height}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm" 
                      placeholder="170"
                    />
                  </div>
                </div>

                {/* Cân nặng */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cân nặng (kg)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Scale className="h-[18px] w-[18px]" />
                    </div>
                    <input 
                      type="number" 
                      name="weight"
                      value={profileData.weight}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm" 
                      placeholder="65"
                    />
                  </div>
                </div>

                {/* Mục tiêu sức khỏe */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mục tiêu sức khỏe</label>
                  <select 
                    name="healthGoal"
                    value={profileData.healthGoal}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] rounded-xl focus:ring-2 focus:ring-[#18b77a]/20 focus:border-[#18b77a] outline-none text-slate-800 dark:text-white transition-all text-sm appearance-none"
                  >
                    <option value="Duy trì sức khỏe">Duy trì sức khỏe</option>
                    <option value="Giảm cân">Giảm cân</option>
                    <option value="Tăng cơ">Tăng cơ</option>
                    <option value="Cải thiện tim mạch">Cải thiện tim mạch</option>
                  </select>
                </div>

              </div>

              {/* Nút lưu */}
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-[#18b77a] hover:bg-[#149965] text-white px-8 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* POPUP CHI TIẾT BÁO CÁO */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border dark:border-[#334155]">
            <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-[#18b77a]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.type}</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ngày tổng hợp: {selectedReport.date}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nhịp tim TB</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.avgHr} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">BPM</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">SpO₂ TB</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.avgSpo2} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">%</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng bước chân</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.steps?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng Calo</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.calo?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kcal</span></p>
                </div>
              </div>
              <div className="bg-[#e9faf3] dark:bg-[#18b77a]/10 p-4 rounded-xl border border-[#b5efd9] dark:border-[#18b77a]/30">
                <p className="text-sm text-[#0b9665] dark:text-[#18b77a] font-medium leading-relaxed">
                  <strong>Nhận xét:</strong> Các chỉ số trong {selectedReport.type === "Báo cáo hàng ngày" ? "ngày" : "tuần"} này đều nằm trong mức an toàn. Mức vận động đạt tiêu chuẩn. Hãy tiếp tục duy trì nhé!
                </p>
              </div>
            </div>
            <button className="w-full mt-6 bg-[#18b77a] hover:bg-[#149965] text-white py-2.5 rounded-xl font-bold transition-colors" onClick={() => setSelectedReport(null)}>
              Đóng báo cáo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthDashboardPage;