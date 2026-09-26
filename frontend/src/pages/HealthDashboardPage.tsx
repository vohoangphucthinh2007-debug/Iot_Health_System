import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar 
} from 'recharts';
import { 
  Home, HeartPulse, Wind, BarChart3, Settings, 
  TrendingUp, Cpu, RefreshCw, Footprints, Flame, Route, Award, TrendingDown, FileText, X,
  User, Shield, Bell, Droplet, Database, Download, Moon, Languages, Cloud, Info, ChevronRight
} from "lucide-react";

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

// Nút gạt đã được nâng cấp để nhận sự kiện onClick
const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick?: () => void }) => (
  <div onClick={onClick} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${active ? 'bg-[#18b77a]' : 'bg-[#e2e8f0]'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
  </div>
);

export function HealthDashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'heart' | 'spo2' | 'statistics' | 'reports' | 'settings'>('dashboard');

  const [heartRate, setHeartRate] = useState<number>(0);
  const [spO2, setSpO2] = useState<number>(0);
  const [steps, setSteps] = useState<number>(0);
  const [calories, setCalories] = useState<number>(0);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'daily' | 'monthly'>('live');
  
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // STATE QUẢN LÝ CÀI ĐẶT
  const [appSettings, setAppSettings] = useState({
    heartRateTracking: true,
    spo2Tracking: true,
    darkMode: false,
    healthAlerts: true,
    waterReminder: true,
    dataAnalysis: true,
    autoBackup: true
  });

  const [sessionStats, setSessionStats] = useState({ 
    sumHr: 0, sumSpo2: 0, count: 0, 
    maxHr: 0, minHr: 999, 
    maxSpo2: 0, minSpo2: 100 
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Lắng nghe Dark Mode
  useEffect(() => {
    if (appSettings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [appSettings.darkMode]);

  // Lắng nghe WebSockets
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

  const toggleSetting = (key: keyof typeof appSettings) => {
    setAppSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
    if (heartRate === 0 && spO2 === 0) return { text: "Chưa có dữ liệu", score: 0, trend: "Chờ kết nối", color: "#8b96a5" };
    if (spO2 < 95) return { text: "SpO2 Đang Thấp!", score: 65, trend: "Cần chú ý", color: "#f45d69" };
    if (heartRate > 100) return { text: "Nhịp tim cao", score: 75, trend: "Vận động mạnh?", color: "#f5a33b" };
    if (heartRate < 60) return { text: "Nhịp tim thấp", score: 80, trend: "Đang nghỉ ngơi", color: "#4385f5" };
    return { text: "Sức khỏe ổn định", score: 98, trend: "Tốt hơn 8% so với tuần trước", color: "#18b77a" };
  };

  const status = getHealthStatus();

  return (
    <div className="flex flex-col md:flex-row bg-[#f5f7fb] text-[#17212b] font-sans w-full min-h-[calc(100vh-65px)]">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="hidden md:block w-[245px] shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto bg-white border-r border-[#e8edf2] py-[25px] px-[15px] z-10">
        <div className="text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] mb-[9px] uppercase">Theo dõi</div>
        
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <Home className="w-[18px] h-[18px]" /><span>Tổng quan</span>
        </button>
        <button onClick={() => setActiveTab('heart')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'heart' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <HeartPulse className="w-[18px] h-[18px]" /><span>Nhịp tim</span>
        </button>
        <button onClick={() => setActiveTab('spo2')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'spo2' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <Wind className="w-[18px] h-[18px]" /><span>SpO₂</span>
        </button>

        <div className="text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] m-[22px_0_9px] uppercase mt-4">Hệ thống</div>
        
        <button onClick={() => setActiveTab('statistics')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'statistics' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <BarChart3 className="w-[18px] h-[18px]" /><span>Thống kê sức khoẻ</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <FileText className="w-[18px] h-[18px]" /><span>Báo cáo</span>
        </button>

        <button className="w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] font-semibold transition-all cursor-pointer">
          <Cpu className="w-[18px] h-[18px]" /><span>Thiết bị</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[14px] font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7]'}`}>
          <Settings className="w-[18px] h-[18px]" /><span>Cài đặt</span>
        </button>
      </aside>

      {/* ================= BOTTOM NAV (MOBILE) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-white border-t border-[#e8edf2] z-[50] flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`p-[10px] rounded-[11px] ${activeTab === 'dashboard' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b]'}`}><Home className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('heart')} className={`p-[10px] rounded-[11px] ${activeTab === 'heart' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b]'}`}><HeartPulse className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('spo2')} className={`p-[10px] rounded-[11px] ${activeTab === 'spo2' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b]'}`}><Wind className="w-[20px] h-[20px]" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-[10px] rounded-[11px] ${activeTab === 'settings' ? 'text-[#18b77a] bg-[#e9faf3]' : 'text-[#707b8b]'}`}><Settings className="w-[20px] h-[20px]" /></button>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-[20px] pb-[90px] md:pb-[60px] md:p-[30px_40px] max-w-[1500px] w-full relative">
        
        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-[25px]">
              <h1 className="text-[24px] md:text-[28px] font-bold">Bảng theo dõi 👋</h1>
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Đây là tình trạng sức khỏe của bạn hiện tại.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[20px] mb-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] min-h-[270px] p-[25px] flex flex-col md:flex-row items-center justify-between overflow-hidden relative"
                   style={{ background: 'radial-gradient(circle at 90% 20%, #e8faf3 0, transparent 35%), #ffffff' }}>
                <div className="text-center md:text-left">
                  <h2 className="text-[23px] font-bold">Điểm sức khỏe</h2>
                  <p className="text-[#8b96a5] text-[13px] m-[8px_0_20px]">Tổng hợp dựa trên dữ liệu từ thiết bị đeo.</p>
                  <div className="inline-flex items-center gap-[8px] bg-[#e9faf3] text-[#18b77a] p-[8px_12px] rounded-[30px] text-[12px] font-semibold">
                    <TrendingUp className="w-[14px] h-[14px]" /> {status.trend}
                  </div>
                </div>
                <div className="w-[170px] h-[170px] rounded-full flex justify-center items-center mt-[20px] md:mt-0" 
                     style={{ background: `conic-gradient(${status.color} ${status.score}%, #e9eef2 ${status.score}%)` }}>
                  <div className="w-[132px] h-[132px] bg-white rounded-full flex flex-col justify-center items-center shadow-sm">
                    <strong className="text-[38px] font-bold">{status.score}</strong>
                    <span className="text-[11px] text-[#8b96a5]">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[16px]">Thiết bị</div>
                    <div className="text-[#8b96a5] text-[12px] mt-[3px]">Thiết bị theo dõi hiện tại</div>
                  </div>
                  {!isConnected ? (
                    <div className="text-[#f45d69] text-[12px] font-semibold flex items-center bg-[#fff0f2] px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#f45d69] rounded-full mr-[6px]"></span> Mất kết nối
                    </div>
                  ) : heartRate > 0 ? (
                    <div className="text-[#18b77a] text-[12px] font-semibold flex items-center bg-[#e9faf3] px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#18b77a] rounded-full mr-[6px] animate-pulse"></span> Đang truyền
                    </div>
                  ) : (
                    <div className="text-[#f5a33b] text-[12px] font-semibold flex items-center bg-[#fff5e8] px-3 py-1.5 rounded-full">
                      <span className="w-[7px] h-[7px] bg-[#f5a33b] rounded-full mr-[6px]"></span> Chờ tín hiệu
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-[15px] m-[25px_0]">
                  <div className="w-[58px] h-[58px] bg-[#20262e] text-white rounded-[17px] flex justify-center items-center">
                    <Cpu className="w-[26px] h-[26px]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold">Mạch ESP32</h3>
                    <p className="text-[#8b96a5] text-[12px] mt-[5px]">Kết nối Socket.io · MAX30102</p>
                  </div>
                </div>
                <button onClick={() => setSessionStats({ sumHr: 0, sumSpo2: 0, count: 0, maxHr: 0, minHr: 999, maxSpo2: 0, minSpo2: 100 })} className="w-full border-none bg-[#e9faf3] text-[#18b77a] p-[10px_15px] rounded-[10px] font-semibold cursor-pointer hover:bg-[#d6f5e7] transition-colors flex justify-center items-center gap-2">
                  <RefreshCw className="w-[14px] h-[14px]" /> Khởi tạo lại phiên đo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[20px]">
              <div onClick={() => setActiveTab('heart')} className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[24px] cursor-pointer hover:border-[#18b77a] transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] text-[13px] font-medium">Nhịp tim</div>
                    <div className="text-[30px] font-bold mt-[4px]">{heartRate > 0 ? heartRate : '--'} <small className="text-[14px] font-normal text-[#8b96a5]">BPM</small></div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#18b77a] bg-[#e9faf3]">
                    <HeartPulse className={`w-[24px] h-[24px] ${heartRate > 0 ? 'animate-pulse' : ''}`} />
                  </div>
                </div>
              </div>

              <div onClick={() => setActiveTab('spo2')} className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[24px] cursor-pointer hover:border-[#4385f5] transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] text-[13px] font-medium">SpO₂</div>
                    <div className="text-[30px] font-bold mt-[4px]">{spO2 > 0 ? spO2 : '--'}<small className="text-[14px] font-normal text-[#8b96a5]">%</small></div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#4385f5] bg-[#edf4ff]">
                    <Wind className="w-[24px] h-[24px]" />
                  </div>
                </div>
              </div>

              <div onClick={() => setActiveTab('statistics')} className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[24px] cursor-pointer hover:border-[#f5a33b] transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[#8b96a5] text-[13px] font-medium">Bước chân</div>
                    <div className="text-[30px] font-bold mt-[4px]">{steps > 0 ? steps.toLocaleString() : '--'}</div>
                  </div>
                  <div className="w-[48px] h-[48px] rounded-[14px] flex justify-center items-center text-[#f5a33b] bg-[#fff5e8]">
                    <Footprints className="w-[24px] h-[24px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col">
              <div className="mb-[20px]">
                <div className="font-bold text-[16px]">Hoạt động trong tuần</div>
                <div className="text-[#8b96a5] text-[12px] mt-[5px]">Số bước chân mỗi ngày</div>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(20,35,55,.06)', fontSize: '13px' }}/>
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
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Theo dõi dữ liệu nhịp tim trực tiếp từ thiết bị đeo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[16px] font-bold text-slate-800">Nhịp tim hiện tại</div>
                <div className="text-[42px] font-bold my-[15px]">{heartRate > 0 ? heartRate : '--'} <small className="text-[14px] text-[#8b96a5]">BPM</small></div>
                <span className="text-[#18b77a] text-[13px] font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#18b77a] animate-pulse"></span> Trong giới hạn bình thường</span>
                <div className="w-full bg-slate-100 h-[8px] rounded-full overflow-hidden mt-4">
                  <div className="bg-[#18b77a] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((heartRate / 150) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[16px] font-bold text-slate-800">Nhịp tim trung bình</div>
                <div className="text-[42px] font-bold my-[15px]">{avgHr > 0 ? avgHr : '--'} <small className="text-[14px] text-[#8b96a5]">BPM</small></div>
                <p className="text-[#8b96a5] text-[13px]">Tính toán dựa trên toàn bộ dữ liệu phiên đo hiện tại.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                <div className="text-[16px] font-bold mb-4 text-slate-900">Biểu đồ nhịp tim</div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2" />
                      <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#18b77a" domain={['auto', 'auto']} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(20,35,55,.06)' }}/>
                      <Line type="monotone" dataKey="hr" name="Nhịp tim (BPM)" stroke="#18b77a" strokeWidth={3.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[18px] font-bold mb-6 text-slate-900">Thống kê</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8edf2]">
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-3 w-1/2">Chỉ số</th>
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-3 w-1/2">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e8edf2]">
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Cao nhất</td>
                      <td className="py-4 text-[14px] text-slate-800">{maxHrDisp} BPM</td>
                    </tr>
                    <tr className="border-b border-[#e8edf2]">
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Thấp nhất</td>
                      <td className="py-4 text-[14px] text-slate-800">{minHrDisp} BPM</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Trung bình</td>
                      <td className="py-4 text-[14px] text-slate-800">{avgHr > 0 ? avgHr : '--'} BPM</td>
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
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Theo dõi độ bão hòa oxy trong máu thời gian thực.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[16px] font-bold text-slate-800">SpO₂ hiện tại</div>
                <div className="text-[42px] font-bold my-[15px]">{spO2 > 0 ? spO2 : '--'} <small className="text-[14px] text-[#8b96a5]">%</small></div>
                <span className="text-[#4385f5] text-[13px] font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4385f5]"></span> Chỉ số an toàn</span>
                <div className="w-full bg-slate-100 h-[8px] rounded-full overflow-hidden mt-4">
                  <div className="bg-[#4385f5] h-full rounded-full transition-all duration-500" style={{ width: `${spO2}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[16px] font-bold text-slate-800">SpO₂ trung bình</div>
                <div className="text-[42px] font-bold my-[15px]">{avgSpo2 > 0 ? avgSpo2 : '--'} <small className="text-[14px] text-[#8b96a5]">%</small></div>
                <p className="text-[#8b96a5] text-[13px]">Chỉ số bão hòa oxy lý tưởng dao động từ 95% đến 100%.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                <div className="text-[16px] font-bold mb-4 text-slate-900">Biểu đồ SpO₂</div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2" />
                      <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#4385f5" domain={[90, 100]} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(20,35,55,.06)' }}/>
                      <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#4385f5" strokeWidth={3.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[25px]">
                <div className="text-[18px] font-bold mb-6 text-slate-900">Thống kê</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8edf2]">
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-3 w-1/2">Chỉ số</th>
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-3 w-1/2">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e8edf2]">
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Cao nhất</td>
                      <td className="py-4 text-[14px] text-slate-800">{maxSpo2Disp} %</td>
                    </tr>
                    <tr className="border-b border-[#e8edf2]">
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Thấp nhất</td>
                      <td className="py-4 text-[14px] text-slate-800">{minSpo2Disp} %</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-[14px] text-slate-800 font-medium">Trung bình</td>
                      <td className="py-4 text-[14px] text-slate-800">{avgSpo2 > 0 ? avgSpo2 : '--'} %</td>
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
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Báo cáo chi tiết và phân tích xu hướng thể chất của bạn.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[20px]">
              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] text-[12px] mt-[3px]">Kỷ lục Nhịp tim</div>
                    <div className="text-[25px] font-bold mt-[10px]">{maxHrDisp} <small className="text-[14px] text-[#8b96a5]">BPM</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#ef4444] bg-[#fee2e2]">
                    <TrendingUp className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] text-[12px] mt-[3px]">SpO₂ Thấp nhất</div>
                    <div className="text-[25px] font-bold mt-[10px]">{minSpo2Disp}<small className="text-[14px] text-[#8b96a5]">%</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#8b5cf6] bg-[#ede9fe]">
                    <TrendingDown className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] text-[12px] mt-[3px]">Tổng Quãng đường</div>
                    <div className="text-[25px] font-bold mt-[10px]">{distanceKm} <small className="text-[14px] text-[#8b96a5]">km</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#10b981] bg-[#d1fae5]">
                    <Route className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
                <div className="flex justify-between">
                  <div>
                    <div className="text-[#8b96a5] text-[12px] mt-[3px]">Calo tiêu hao</div>
                    <div className="text-[25px] font-bold mt-[10px]">{calories > 0 ? calories.toLocaleString() : '--'} <small className="text-[14px] text-[#8b96a5]">kcal</small></div>
                  </div>
                  <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#f97316] bg-[#ffedd5]">
                    <Flame className="w-[20px] h-[20px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col mb-[20px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[20px] gap-3">
                <div>
                  <div className="font-bold text-[16px]">Biểu đồ tổng hợp Nhịp tim & SpO₂</div>
                  <div className="text-[#8b96a5] text-[12px] mt-[5px]">Dữ liệu lưu trữ hệ thống</div>
                </div>
                
                <div className="flex bg-[#f5f7fb] p-1 rounded-[10px] shrink-0">
                  <button onClick={() => setViewMode('live')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'live' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Live</button>
                  <button onClick={() => setViewMode('daily')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'daily' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Ngày</button>
                  <button onClick={() => setViewMode('monthly')} className={`px-[16px] py-[6px] text-[13px] font-semibold rounded-[8px] transition-all ${viewMode === 'monthly' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Tháng</button>
                </div>
              </div>
              
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2" />
                    <XAxis dataKey="time" stroke="#8b96a5" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} />
                    <YAxis yAxisId="left" stroke="#18b77a" domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#4385f5" domain={[90, 100]} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 10px 30px rgba(20,35,55,.06)', fontSize: '13px', padding: '10px 15px' }}/>
                    <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#17212b', fontWeight: 500 }}/>
                    <Line yAxisId="left" type="monotone" dataKey="hr" name="Nhịp tim" stroke="#18b77a" strokeWidth={3.5} dot={viewMode !== 'live'} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO2" stroke="#4385f5" strokeWidth={3.5} dot={viewMode !== 'live'} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
              <div className="font-bold text-[16px]">Phân tích xu hướng (AI)</div>
              <div className="text-[#8b96a5] text-[12px] mt-[5px] mb-[15px]">Dự báo dựa trên chuỗi dữ liệu 7 ngày qua</div>

              <div className="flex gap-[15px] py-[12px] border-b border-[#e8edf2]">
                <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#e9faf3] text-[#18b77a]">
                  <Award className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <strong className="text-[13px] block text-slate-800">Cải thiện tim mạch</strong>
                  <p className="text-[12px] text-[#8b96a5] mt-[4px] leading-relaxed">
                    Nhịp tim lúc nghỉ ngơi của bạn đã giảm 2% so với tuần trước. Đây là dấu hiệu cơ tim đang trở nên khỏe mạnh hơn nhờ việc duy trì số bước chân đều đặn.
                  </p>
                </div>
              </div>

              <div className="flex gap-[15px] py-[12px]">
                <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#fff5e8] text-[#f5a33b]">
                  <Flame className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <strong className="text-[13px] block text-slate-800">Biến động Calo</strong>
                  <p className="text-[12px] text-[#8b96a5] mt-[4px] leading-relaxed">
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
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Tổng hợp dữ liệu sức khỏe theo thời gian.</p>
            </div>

            <div className="w-full bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
              <div className="font-bold text-[16px] mb-[20px]">Báo cáo gần đây</div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#e8edf2]">
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-4 px-4 w-1/4">Thời gian</th>
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-4 px-4 w-1/3">Loại báo cáo</th>
                      <th className="text-left font-normal text-[#8b96a5] text-[13px] pb-4 px-4 w-1/4">Trạng thái</th>
                      <th className="text-right font-normal text-[#8b96a5] text-[13px] pb-4 px-4"></th>
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
                        <tr key={report.id} className="border-b border-[#e8edf2] hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-[14px] text-slate-800">{report.date}</td>
                          <td className="py-4 px-4 text-[14px] text-slate-800">{report.type}</td>
                          <td className="py-4 px-4">
                            <span className="bg-[#e9faf3] text-[#18b77a] px-3 py-1 rounded-full text-[12px] font-semibold">
                              {report.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              onClick={() => setSelectedReport(report)}
                              className="bg-[#e9faf3] text-[#18b77a] px-4 py-1.5 rounded-lg text-[13px] font-bold hover:bg-[#d6f5e7] transition-colors"
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
              <p className="text-[#8b96a5] text-[13px] mt-[5px]">Tùy chỉnh hệ thống PulseCare.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
              {/* Cột Trái */}
              <div className="space-y-[20px]">
                {/* Tài khoản */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <User className="w-[18px] h-[18px]" /> Tài khoản
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2] cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><User className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Hồ sơ cá nhân</div>
                        <div className="text-[12px] text-[#8b96a5]">Nguyễn An</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Shield className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Bảo mật</div>
                        <div className="text-[12px] text-[#8b96a5]">Mật khẩu, xác thực và phiên đăng nhập</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>

                {/* Theo dõi sức khỏe */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <HeartPulse className="w-[18px] h-[18px]" /> Theo dõi sức khỏe
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><HeartPulse className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Nhịp tim</div>
                        <div className="text-[12px] text-[#8b96a5]">Theo dõi liên tục</div>
                      </div>
                    </div>
                    {/* GẮN SỰ KIỆN CLICK CHO NÚT GẠT */}
                    <ToggleSwitch 
                      active={appSettings.heartRateTracking} 
                      onClick={() => toggleSetting('heartRateTracking')} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Wind className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">SpO₂</div>
                        <div className="text-[12px] text-[#8b96a5]">Theo dõi oxy máu</div>
                      </div>
                    </div>
                    <ToggleSwitch 
                      active={appSettings.spo2Tracking} 
                      onClick={() => toggleSetting('spo2Tracking')} 
                    />
                  </div>
                </div>

                {/* Giao diện */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <Settings className="w-[18px] h-[18px]" /> Giao diện
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Moon className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Chế độ tối</div>
                        <div className="text-[12px] text-[#8b96a5]">Dark Mode</div>
                      </div>
                    </div>
                    {/* NÚT GẠT DARK MODE */}
                    <ToggleSwitch 
                      active={appSettings.darkMode} 
                      onClick={() => toggleSetting('darkMode')} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Languages className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Ngôn ngữ</div>
                        <div className="text-[12px] text-[#8b96a5]">Tiếng Việt</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="space-y-[20px]">
                {/* Thông báo */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <Bell className="w-[18px] h-[18px]" /> Thông báo
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Bell className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Cảnh báo sức khỏe</div>
                        <div className="text-[12px] text-[#8b96a5]">Thông báo dữ liệu bất thường</div>
                      </div>
                    </div>
                    <ToggleSwitch 
                      active={appSettings.healthAlerts} 
                      onClick={() => toggleSetting('healthAlerts')} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Droplet className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Nhắc uống nước</div>
                        <div className="text-[12px] text-[#8b96a5]">Nhắc theo mục tiêu</div>
                      </div>
                    </div>
                    <ToggleSwitch 
                      active={appSettings.waterReminder} 
                      onClick={() => toggleSetting('waterReminder')} 
                    />
                  </div>
                </div>

                {/* Quyền riêng tư */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <Shield className="w-[18px] h-[18px]" /> Quyền riêng tư
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Database className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Phân tích dữ liệu</div>
                        <div className="text-[12px] text-[#8b96a5]">Cho phép phân tích tự động</div>
                      </div>
                    </div>
                    <ToggleSwitch 
                      active={appSettings.dataAnalysis} 
                      onClick={() => toggleSetting('dataAnalysis')} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Download className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Tải dữ liệu</div>
                        <div className="text-[12px] text-[#8b96a5]">Xuất dữ liệu cá nhân</div>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                  </div>
                </div>

                {/* Hệ thống */}
                <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
                  <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2 text-slate-900">
                    <Cpu className="w-[18px] h-[18px]" /> Hệ thống
                  </h3>
                  <div className="flex items-center justify-between py-3 border-b border-[#e8edf2]">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Cloud className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Sao lưu</div>
                        <div className="text-[12px] text-[#8b96a5]">Tự động sao lưu dữ liệu</div>
                      </div>
                    </div>
                    <ToggleSwitch 
                      active={appSettings.autoBackup} 
                      onClick={() => toggleSetting('autoBackup')} 
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Info className="w-[18px] h-[18px]" /></div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">Phiên bản</div>
                        <div className="text-[12px] text-[#8b96a5]">PulseCare v1.0.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* POPUP CHI TIẾT BÁO CÁO */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-[#18b77a]" />
                <h3 className="text-lg font-bold text-slate-900">{selectedReport.type}</h3>
              </div>
              <p className="text-sm text-slate-500">Ngày tổng hợp: {selectedReport.date}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nhịp tim TB</p>
                  <p className="text-lg font-bold text-slate-900">{selectedReport.avgHr} <span className="text-xs font-normal text-slate-500">BPM</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">SpO₂ TB</p>
                  <p className="text-lg font-bold text-slate-900">{selectedReport.avgSpo2} <span className="text-xs font-normal text-slate-500">%</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tổng bước chân</p>
                  <p className="text-lg font-bold text-slate-900">{selectedReport.steps?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tổng Calo</p>
                  <p className="text-lg font-bold text-slate-900">{selectedReport.calo?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500">kcal</span></p>
                </div>
              </div>

              <div className="bg-[#e9faf3] p-4 rounded-xl border border-[#b5efd9]">
                <p className="text-sm text-[#0b9665] font-medium leading-relaxed">
                  <strong>Nhận xét:</strong> Các chỉ số trong {selectedReport.type === "Báo cáo hàng ngày" ? "ngày" : "tuần"} này đều nằm trong mức an toàn. Mức vận động đạt tiêu chuẩn. Hãy tiếp tục duy trì nhé!
                </p>
              </div>
            </div>
            
            <button 
              className="w-full mt-6 bg-[#18b77a] hover:bg-[#149965] text-white py-2.5 rounded-xl font-bold transition-colors" 
              onClick={() => setSelectedReport(null)}
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthDashboardPage;