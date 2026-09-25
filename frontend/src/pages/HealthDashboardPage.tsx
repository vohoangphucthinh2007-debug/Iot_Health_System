import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Dữ liệu mẫu cho Hằng Ngày và Hằng Tháng
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
  // State lưu số liệu hiện tại
  const [heartRate, setHeartRate] = useState<number>(0);
  const [spO2, setSpO2] = useState<number>(0);
  
  // State lưu mảng dữ liệu cho biểu đồ Real-time
  const [liveData, setLiveData] = useState<any[]>([]);
  
  // Chế độ xem: 'live' | 'daily' | 'monthly'
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

  // Hàm đánh giá sức khỏe (Đã đổi màu theo theme PulseCare)
  const getHealthStatus = () => {
    if (heartRate === 0 && spO2 === 0) return { text: "Đang chờ dữ liệu...", score: 0, trend: "Kết nối thiết bị", color: "#8b96a5" };
    if (spO2 < 95) return { text: "Cảnh báo: SpO2 thấp!", score: 65, trend: "Cần chú ý", color: "#f45d69" };
    if (heartRate > 100) return { text: "Nhịp tim đang cao", score: 75, trend: "Vận động mạnh?", color: "#f5a33b" };
    if (heartRate < 60) return { text: "Nhịp tim khá thấp", score: 80, trend: "Nghỉ ngơi", color: "#4385f5" };
    return { text: "Sức khỏe ổn định", score: 98, trend: "Tốt hơn 8% tuần trước", color: "#18b77a" };
  };

  const status = getHealthStatus();

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#17212b] font-sans flex">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 w-full h-[65px] bottom-0 md:w-[245px] md:h-screen bg-white md:border-r border-t md:border-t-0 border-[#e8edf2] md:py-[25px] md:px-[15px] z-[100] flex md:block justify-around md:justify-start items-center md:items-stretch shadow-[0_-5px_20px_rgba(0,0,0,0.05)] md:shadow-none mt-auto md:mt-0 top-auto md:top-0">
        
        {/* Logo (Ẩn trên mobile) */}
        <div className="hidden md:flex items-center gap-[12px] px-[10px] mb-[35px]">
          <div className="w-[42px] h-[42px] rounded-[13px] bg-gradient-to-br from-[#1fc88a] to-[#0ca86e] text-white flex justify-center items-center text-[20px] shadow-[0_8px_20px_rgba(24,183,122,0.25)]">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <h2 className="text-[20px] font-bold">Pulse<span className="text-[#18b77a]">Care</span></h2>
        </div>

        <div className="hidden md:block text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] m-[22px_0_9px] uppercase">Theo dõi</div>
        
        {/* Menu Items (Tạm thời là thẻ <a>, bạn có thể đổi thành <Link to="..."> sau) */}
        <a className="flex items-center md:gap-[13px] p-[10px] md:p-[12px_14px] md:m-[4px_0] rounded-[11px] text-[#18b77a] bg-[#e9faf3] font-semibold text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-house w-[20px] text-center text-[18px] md:text-[14px]"></i>
          <span className="hidden md:inline">Tổng quan</span>
        </a>
        <a className="flex items-center md:gap-[13px] p-[10px] md:p-[12px_14px] md:m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-heart-pulse w-[20px] text-center text-[18px] md:text-[14px]"></i>
          <span className="hidden md:inline">Nhịp tim</span>
        </a>
        <a className="flex items-center md:gap-[13px] p-[10px] md:p-[12px_14px] md:m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-lungs w-[20px] text-center text-[18px] md:text-[14px]"></i>
          <span className="hidden md:inline">SpO₂</span>
        </a>
        
        <div className="hidden md:block text-[10px] font-bold text-[#a2aab5] tracking-[1px] px-[13px] m-[22px_0_9px] uppercase">Hệ thống</div>
        <a className="hidden md:flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-chart-column w-[20px] text-center"></i>
          <span>Báo cáo</span>
        </a>
        <a className="hidden md:flex items-center gap-[13px] p-[12px_14px] m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-watch-smart w-[20px] text-center"></i>
          <span>Thiết bị</span>
        </a>
        <a className="flex items-center md:gap-[13px] p-[10px] md:p-[12px_14px] md:m-[4px_0] rounded-[11px] text-[#707b8b] hover:text-[#18b77a] hover:bg-[#f3faf7] text-[14px] cursor-pointer transition-all">
          <i className="fa-solid fa-gear w-[20px] text-center text-[18px] md:text-[14px]"></i>
          <span className="hidden md:inline">Cài đặt</span>
        </a>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 md:ml-[245px] p-[20px_15px_80px] md:p-[30px_40px_60px] max-w-[1500px] w-full">
        
        {/* TOPBAR */}
        <div className="flex justify-between items-center mb-[28px]">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold">Chào bạn 👋</h1>
            <p className="text-[#8b96a5] text-[13px] mt-[5px]">Đây là tình trạng sức khỏe của bạn hiện tại.</p>
          </div>
          <div className="flex items-center gap-[12px]">
            <button className="w-[42px] h-[42px] border border-[#e8edf2] bg-white rounded-[11px] text-[#687486] cursor-pointer hover:bg-slate-50 transition-colors hidden md:block">
              <i className="fa-regular fa-bell"></i>
            </button>
            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#d7f8eb] to-[#b5efd9] flex justify-center items-center text-[#0b9665] font-bold cursor-pointer overflow-hidden border-2 border-white shadow-sm">
              <i className="fa-solid fa-user"></i>
            </div>
          </div>
        </div>

        {/* HERO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-[20px] mb-[20px]">
          {/* Health Score Card */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] min-h-[270px] p-[25px] flex flex-col md:flex-row md:items-center justify-between overflow-hidden relative"
               style={{ background: 'radial-gradient(circle at 90% 20%, #e8faf3 0, transparent 35%), #ffffff' }}>
            <div>
              <h2 className="text-[23px] font-bold">Điểm sức khỏe</h2>
              <p className="text-[#8b96a5] text-[13px] m-[8px_0_20px]">{status.text}</p>
              <div className="inline-flex items-center gap-[8px] bg-[#e9faf3] text-[#18b77a] p-[8px_12px] rounded-[30px] text-[12px] font-semibold">
                <i className="fa-solid fa-arrow-trend-up"></i> {status.trend}
              </div>
            </div>
            
            <div className="w-[170px] h-[170px] rounded-full flex justify-center items-center mt-[20px] md:mt-0 self-center" 
                 style={{ background: `conic-gradient(${status.color} ${status.score}%, #e9eef2 ${status.score}%)` }}>
              <div className="w-[132px] h-[132px] bg-white rounded-full flex flex-col justify-center items-center shadow-inner">
                <strong className="text-[38px] font-bold">{status.score}</strong>
                <span className="text-[11px] text-[#8b96a5]">/ 100</span>
              </div>
            </div>
          </div>

          {/* Device Card */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col justify-between">
            <div className="flex justify-between">
              <div>
                <div className="text-[16px] font-bold">Thiết bị đo</div>
                <div className="text-[#8b96a5] text-[12px] mt-[5px]">Vi điều khiển hiện tại</div>
              </div>
              <div className="text-[#18b77a] text-[12px] font-semibold flex items-center">
                <span className="w-[7px] h-[7px] bg-[#18b77a] rounded-full mr-[5px] animate-pulse"></span>
                {heartRate > 0 || spO2 > 0 ? 'Đang truyền' : 'Đã kết nối'}
              </div>
            </div>

            <div className="flex items-center gap-[15px] m-[25px_0]">
              <div className="w-[58px] h-[58px] bg-[#20262e] text-white rounded-[17px] flex justify-center items-center text-[25px]">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div>
                <h3 className="text-[15px] font-bold">Mạch ESP32</h3>
                <p className="text-[#8b96a5] text-[12px] mt-[5px]">Cảm biến MAX30102 · Socket.io</p>
              </div>
            </div>

            <button className="w-full border-none bg-[#e9faf3] text-[#18b77a] p-[10px_15px] rounded-[10px] font-semibold cursor-pointer hover:bg-[#d6f5e7] transition-colors">
              <i className="fa-solid fa-rotate mr-2"></i> Đồng bộ ngay
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] mb-[20px]">
          {/* Nhịp tim */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Nhịp tim</div>
                <div className="text-[25px] font-bold mt-[10px]">
                  {heartRate || '--'} <small className="text-[14px] text-[#8b96a5]">BPM</small>
                </div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#f45d69] bg-[#fff0f2]">
                <i className={`fa-solid fa-heart-pulse ${viewMode === 'live' && heartRate > 0 ? 'animate-pulse' : ''}`}></i>
              </div>
            </div>
          </div>

          {/* SpO2 */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">SpO₂</div>
                <div className="text-[25px] font-bold mt-[10px]">
                  {spO2 || '--'}<small className="text-[14px] text-[#8b96a5]">%</small>
                </div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#4385f5] bg-[#edf4ff]">
                <i className="fa-solid fa-lungs"></i>
              </div>
            </div>
          </div>

          {/* Bước chân (Mock Giao diện) */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Bước chân</div>
                <div className="text-[25px] font-bold mt-[10px]">7,842</div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#f5a33b] bg-[#fff5e8]">
                <i className="fa-solid fa-person-walking"></i>
              </div>
            </div>
          </div>

          {/* Giấc ngủ (Mock Giao diện) */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[20px]">
            <div className="flex justify-between">
              <div>
                <div className="text-[#8b96a5] text-[12px] mt-[3px]">Giấc ngủ</div>
                <div className="text-[25px] font-bold mt-[10px]">7h32</div>
              </div>
              <div className="w-[40px] h-[40px] rounded-[12px] flex justify-center items-center text-[#8c6df2] bg-[#f2efff]">
                <i className="fa-solid fa-moon"></i>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD GRID (Biểu đồ & Insights) */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr] gap-[20px]">
          
          {/* Biểu đồ */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-[20px]">
              <div>
                <div className="text-[16px] font-bold">Biến thiên chỉ số sinh tồn</div>
                <div className="text-[#8b96a5] text-[12px] mt-[5px]">Biểu đồ nhịp tim và nồng độ Oxy</div>
              </div>
              
              {/* Tabs chọn View */}
              <div className="flex bg-[#f5f7fb] p-1 rounded-[10px] mt-3 md:mt-0">
                <button onClick={() => setViewMode('live')} className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'live' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5]'}`}>Live</button>
                <button onClick={() => setViewMode('daily')} className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'daily' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5]'}`}>Ngày</button>
                <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${viewMode === 'monthly' ? 'bg-white text-[#18b77a] shadow-sm' : 'text-[#8b96a5]'}`}>Tháng</button>
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2" />
                  <XAxis dataKey="time" stroke="#8b96a5" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#f45d69" domain={['auto', 'auto']} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4385f5" domain={[90, 100]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 10px 30px rgba(20,35,55,.06)', fontSize: '13px' }}/>
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#17212b' }}/>
                  <Line yAxisId="left" type="monotone" dataKey="hr" name="Nhịp tim" stroke="#f45d69" strokeWidth={3} dot={viewMode !== 'live'} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO2" stroke="#4385f5" strokeWidth={3} dot={viewMode !== 'live'} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white border border-[#e8edf2] rounded-[18px] shadow-[0_10px_30px_rgba(20,35,55,0.06)] p-[23px]">
            <div className="text-[16px] font-bold">Smart Insights</div>
            <div className="text-[#8b96a5] text-[12px] mt-[5px] mb-[15px]">Phân tích từ dữ liệu ESP32</div>

            <div className="flex gap-[12px] py-[15px] border-b border-[#e8edf2]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#e9faf3] text-[#18b77a]">
                <i className="fa-solid fa-heart-circle-check"></i>
              </div>
              <div>
                <strong className="text-[13px]">Trạng thái nhịp tim</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  {heartRate === 0 ? "Chưa có tín hiệu đo từ cảm biến." : 
                   heartRate > 100 ? "Nhịp tim đang ở mức cao. Hãy ngồi xuống nghỉ ngơi." :
                   heartRate < 60 ? "Nhịp tim đo được thấp hơn bình thường." :
                   "Nhịp tim duy trì trong khoảng an toàn, rất tốt."}
                </p>
              </div>
            </div>

            <div className="flex gap-[12px] py-[15px] border-b border-[#e8edf2]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#edf4ff] text-[#4385f5]">
                <i className="fa-solid fa-lungs"></i>
              </div>
              <div>
                <strong className="text-[13px]">Nồng độ Oxy (SpO2)</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  {spO2 === 0 ? "Chưa có tín hiệu đo từ cảm biến." : 
                   spO2 < 95 ? "Chỉ số SpO2 đang thấp. Cần hít thở sâu, chú ý hô hấp." :
                   "Lượng oxy trong máu dồi dào, hệ hô hấp ổn định."}
                </p>
              </div>
            </div>

            {/* Mục Mock cho phần giao diện mượt */}
            <div className="flex gap-[12px] py-[15px]">
              <div className="w-[37px] h-[37px] shrink-0 rounded-[10px] flex justify-center items-center bg-[#f2efff] text-[#8c6df2]">
                <i className="fa-solid fa-tower-broadcast"></i>
              </div>
              <div>
                <strong className="text-[13px]">Tốc độ truyền dữ liệu</strong>
                <p className="text-[11px] text-[#8b96a5] mt-[4px] leading-relaxed">
                  Đang nhận tín hiệu WebSockets realtime từ server Node.js một cách liên tục.
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