import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Home, HeartPulse, Wind, BarChart3, Settings, 
  TrendingUp, Cpu, RefreshCw, Footprints, 
  Moon, Activity, Droplet, Bell
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore"; // Lấy thông tin user nếu cần

const dailyMockData = [
  { time: "T2", hr: 72, spo2: 98 }, { time: "T3", hr: 75, spo2: 97 },
  { time: "T4", hr: 71, spo2: 99 }, { time: "T5", hr: 78, spo2: 96 },
  { time: "T6", hr: 74, spo2: 98 }, { time: "T7", hr: 80, spo2: 97 }, { time: "CN", hr: 73, spo2: 98 },
];

const monthlyMockData = [
  { time: "Tuần 1", hr: 74, spo2: 98 }, { time: "Tuần 2", hr: 75, spo2: 97 },
  { time: "Tuần 3", hr: 72, spo2: 98 }, { time: "Tuần 4", hr: 76, spo2: 98 },
];

export function HealthDashboardPage() {
  const { user } = useAuthStore(); // Lấy user từ Zustand (nếu muốn hiển thị tên)
  
  // State lưu số liệu hiện tại
  const [heartRate, setHeartRate] = useState<number>(0);
  const [spO2, setSpO2] = useState<number>(0);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'daily' | 'monthly'>('live');

  // Lắng nghe WebSockets
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiUrl.replace('/api', '');
    const socket = io(socketUrl); 

    socket.on("sensorData", (data) => {
      setHeartRate(data.heartRate);
      setSpO2(data.spO2);

      setLiveData((prev) => {
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newDataPoint = { time: timeString, hr: data.heartRate, spo2: data.spO2 };
        return [...prev.slice(-19), newDataPoint];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getChartData = () => {
    if (viewMode === 'daily') return dailyMockData;
    if (viewMode === 'monthly') return monthlyMockData;
    return liveData;
  };

  // Logic màu sắc bám sát CSS gốc: Green (#18b77a), Red (#f45d69), Orange (#f5a33b), Blue (#4385f5)
  const getHealthStatus = () => {
    if (heartRate === 0 && spO2 === 0) return { text: "Chưa có dữ liệu", score: 0, trend: "Chờ kết nối", color: "#8b96a5", bg: "#f5f7fb" };
    if (spO2 < 95) return { text: "SpO2 Đang Thấp!", score: 65, trend: "Cần chú ý", color: "#f45d69", bg: "#fff0f2" };
    if (heartRate > 100) return { text: "Nhịp tim cao", score: 75, trend: "Vận động mạnh?", color: "#f5a33b", bg: "#fff5e8" };
    if (heartRate < 60) return { text: "Nhịp tim thấp", score: 80, trend: "Đang nghỉ ngơi", color: "#4385f5", bg: "#edf4ff" };
    return { text: "Sức khỏe ổn định", score: 86, trend: "Tốt hơn 8% so với tuần trước", color: "#18b77a", bg: "#e9faf3" };
  };

  const status = getHealthStatus();

  return (
    // Dùng flex thay vì min-h-screen để chung sống hòa bình với global Navbar
    <div className="flex flex-col md:flex-row bg-[#f5f7fb] text-[#17212b] font-sans w-full min-h-[calc(100vh-65px)]">
      
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      {/* Dùng sticky top-[65px] thay vì fixed top-0 để không bao giờ đè lên Navbar của bạn */}
      <aside className="hidden md:block w-[245px] shrink-0 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto bg-white border-r border-[#e8edf2] py-[25px] px-[15px] z-10">
        
        {/* Đã xóa hẳn phần Logo PulseCare như yêu cầu */}
        
        <div className="text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] mb-[9px] uppercase">Theo dõi</div>
        
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#18b77a] bg-[#e9faf3] font-semibold text-[14px] cursor-pointer transition-all">
          <Home className="w-[18px] h-[18px]" />
          <span>Tổng quan</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <HeartPulse className="w-[18px] h-[18px]" />
          <span>Nhịp tim</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <Footprints className="w-[18px] h-[18px]" />
          <span>Hoạt động</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <Moon className="w-[18px] h-[18px]" />
          <span>Giấc ngủ</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <Wind className="w-[18px] h-[18px]" />
          <span>SpO₂</span>
        </a>
        
        <div className="text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] m-[22px_0_9px] uppercase">Hệ thống</div>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <BarChart3 className="w-[18px] h-[18px]" />
          <span>Báo cáo</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <Cpu className="w-[18px] h-[18px]" />
          <span>Thiết bị</span>
        </a>
        <a className="flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <Settings className="w-[18px] h-[18px]" />
          <span>Cài đặt</span>
        </a>
      </aside>

      {/* ================= BOTTOM NAV (MOBILE) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-white border-t border-[#e8edf2] z-[100] flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <a className="p-[10px] text-[#18b77a] bg-[#e9faf3] rounded-[11px]"><Home className="w-[20px] h-[20px]" /></a>
        <a className="p-[10px] text-[#707b8b]"><HeartPulse className="w-[20px] h-[20px]" /></a>
        <a className="p-[10px] text-[#707b8b]"><Wind className="w-[20px] h-[20px]" /></a>
        <a className="p-[10px] text-[#707b8b]"><Settings className="w-[20px] h-[20px]" /></a>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-[20px] pb-[90px] md:pb-[60px] md:p-[30px_40px] max-w-[1500px] w-full">
        
        {/* TOPBAR PAGE */}
        <div className="flex justify-between items-center mb-[28px]">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold">Chào buổi tối 👋</h1>
            <p className="text-[#8b96a5] text-[13px] mt-[5px]">Đây là tình trạng sức khỏe của bạn hôm nay.</p>
          </div>
          
          <div className="hidden md:flex items-center gap-[12px]">
            {/* Nút chuông thông báo */}
            <button className="w-[42px] h-[42px] border border-[#e8edf2] bg-white rounded-[11px] text-[#687486] cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center relative">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-[10px] right-[12px] w-[6px] h-[6px] bg-[#f45d69] rounded-full"></span>
            </button>
            {/* Avatar nhỏ trong page (Tùy chọn: có thể bỏ nếu thấy trùng với thanh Navbar trên cùng) */}
            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#d7f8eb] to-[#b5efd9] flex justify-center items-center text-[#0b9665] font-bold overflow-hidden cursor-pointer">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "NA"}
            </div>
          </div>
        </div>

        {/* HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[20px] mb-[20px]">
          
          {/* Health Score */}
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

          {/* Device Card */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-[16px]">Thiết bị</div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Thiết bị theo dõi hiện tại</div>
              </div>
              <div className="text-[#18b77a] text-[12px] font-semibold flex items-center">
                <span className={`w-[7px] h-[7px] bg-[#18b77a] rounded-full mr-[5px] ${heartRate > 0 ? 'animate-pulse' : ''}`}></span>
                {heartRate > 0 ? 'Đang truyền' : 'Đã kết nối'}
              </div>
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

            <button className="w-full border-none bg-[#e9faf3] text-[#18b77a] p-[10px_15px] rounded-[10px] font-semibold cursor-pointer hover:bg-[#d6f5e7] transition-colors flex justify-center items-center gap-2">
              <RefreshCw className="w-[14px] h-[14px]" /> Đồng bộ dữ liệu
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[20px]">
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Nhịp tim</div>
                <div className="text-[25px] font-bold mt-[10px]">{heartRate || '--'} <small className="text-[12px] font-normal text-[#8b96a5]">BPM</small></div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#18b77a] bg-[#e9faf3]">
                <HeartPulse className={`w-[20px] h-[20px] ${viewMode === 'live' && heartRate > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">SpO₂</div>
                <div className="text-[25px] font-bold mt-[10px]">{spO2 || '--'}<small className="text-[12px] font-normal text-[#8b96a5]">%</small></div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#4385f5] bg-[#edf4ff]">
                <Wind className="w-[20px] h-[20px]" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Bước chân</div>
                <div className="text-[25px] font-bold mt-[10px]">7,842</div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#f5a33b] bg-[#fff5e8]">
                <Footprints className="w-[20px] h-[20px]" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Giấc ngủ</div>
                <div className="text-[25px] font-bold mt-[10px]">7h32</div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#8c6df2] bg-[#f2efff]">
                <Moon className="w-[20px] h-[20px]" />
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD GRID (Biểu đồ & Insights) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.8fr] gap-[20px]">
          
          {/* Biểu đồ */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[10px] gap-3">
              <div>
                <div className="font-bold text-[16px]">Biến thiên chỉ số sinh tồn</div>
                <div className="text-[#8b96a5] text-[12px] mt-[5px]">Biểu đồ nhịp tim và nồng độ Oxy</div>
              </div>
              <div className="flex bg-[#f5f7fb] p-1 rounded-[10px] shrink-0">
                <button onClick={() => setViewMode('live')} className={`px-[12px] py-[6px] text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'live' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Live</button>
                <button onClick={() => setViewMode('daily')} className={`px-[12px] py-[6px] text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'daily' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Ngày</button>
                <button onClick={() => setViewMode('monthly')} className={`px-[12px] py-[6px] text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'monthly' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5] hover:text-[#17212b]'}`}>Tháng</button>
              </div>
            </div>
            
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2" />
                  <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#18b77a" domain={['auto', 'auto']} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4385f5" domain={[90, 100]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 10px 30px rgba(20,35,55,.06)', fontSize: '13px' }}/>
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#17212b' }}/>
                  <Line yAxisId="left" type="monotone" dataKey="hr" name="Nhịp tim" stroke="#18b77a" strokeWidth={3} dot={viewMode !== 'live'} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO2" stroke="#4385f5" strokeWidth={3} dot={viewMode !== 'live'} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
            <div className="font-bold text-[16px]">Smart Insights</div>
            <div className="text-[#8b96a5] text-[12px] mt-[5px] mb-[15px]">Phân tích từ dữ liệu thiết bị</div>

            <div className="flex gap-[12px] py-[15px] border-b border-[#e8edf2]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#e9faf3] text-[#18b77a]">
                <Activity className="w-[18px] h-[18px]" />
              </div>
              <div>
                <strong className="text-[13px] block">Trạng thái sinh tồn</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  {status.text}. Phân tích tín hiệu mới nhất gửi về từ cảm biến đo.
                </p>
              </div>
            </div>

            <div className="flex gap-[12px] py-[15px] border-b border-[#e8edf2]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#f2efff] text-[#8c6df2]">
                <Moon className="w-[18px] h-[18px]" />
              </div>
              <div>
                <strong className="text-[13px] block">Giấc ngủ ổn định</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  Thời lượng ngủ trung bình tuần này là 7h24. Đạt chỉ tiêu.
                </p>
              </div>
            </div>

            <div className="flex gap-[12px] py-[15px]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#edf4ff] text-[#4385f5]">
                <Droplet className="w-[18px] h-[18px]" />
              </div>
              <div>
                <strong className="text-[13px] block">Nhắc uống nước</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  Bạn còn khoảng 500 ml để đạt mục tiêu cung cấp nước hôm nay.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default HealthDashboardPage;