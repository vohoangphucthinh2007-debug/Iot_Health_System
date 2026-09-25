import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, ArrowLeft, Clock, CalendarDays, CalendarSearch } from "lucide-react";
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
    // Tự động lấy URL từ file .env (cắt bỏ phần /api ở đuôi để kết nối đúng rễ của Socket.io)
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const socketUrl = apiUrl.replace('/api', '');
    
    const socket = io(socketUrl); 

    socket.on("sensorData", (data) => {
      setHeartRate(data.heartRate);
      setSpO2(data.spO2);

      // Thêm điểm dữ liệu mới vào biểu đồ (Chỉ giữ lại 20 điểm gần nhất để chống lag)
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

  // Xác định dữ liệu nào sẽ được đưa vào biểu đồ tùy theo Tab đang chọn
  const getChartData = () => {
    if (viewMode === 'daily') return dailyMockData;
    if (viewMode === 'monthly') return monthlyMockData;
    return liveData;
  };

  // Hàm tự động đánh giá sức khỏe dựa trên số đo
  const getHealthStatus = () => {
    if (heartRate === 0 && spO2 === 0) return { text: "Đang chờ dữ liệu...", color: "text-slate-500", bg: "bg-slate-100" };
    if (spO2 < 95) return { text: "Cảnh báo: SpO2 thấp! Thiếu Oxy", color: "text-red-700", bg: "bg-red-100" };
    if (heartRate > 100) return { text: "Cảnh báo: Nhịp tim đang cao", color: "text-amber-700", bg: "bg-amber-100" };
    if (heartRate < 60) return { text: "Lưu ý: Nhịp tim khá thấp", color: "text-blue-700", bg: "bg-blue-100" };
    return { text: "Sức khỏe ổn định. Các chỉ số đều tốt!", color: "text-emerald-700", bg: "bg-emerald-100" };
  };

  const status = getHealthStatus();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-10">
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
        
        {/* Nút quay lại & Tiêu đề */}
        <div className="flex flex-col gap-2">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors w-fit mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại trang chủ
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Bảng theo dõi sức khỏe</h1>
        </div>

        {/* Thanh chọn chế độ xem (Tabs) */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-fit overflow-x-auto">
          <button 
            onClick={() => setViewMode('live')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shrink-0 transition-all ${viewMode === 'live' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Clock className="h-4 w-4" /> Thời gian thực (Live)
          </button>
          <button 
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shrink-0 transition-all ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <CalendarDays className="h-4 w-4" /> Hằng ngày
          </button>
          <button 
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shrink-0 transition-all ${viewMode === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <CalendarSearch className="h-4 w-4" /> Hằng tháng
          </button>
        </div>

        {/* Khối hiển thị 2 thẻ Card Nhịp tim & SpO2 */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Nhịp tim (Heart Rate)</CardTitle>
              <Heart className={`h-5 w-5 text-red-500 ${viewMode === 'live' && heartRate > 0 ? 'animate-pulse' : ''}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">{viewMode === 'live' ? (heartRate || "--") : "74"}</span>
                <span className="text-sm text-slate-500">bpm {viewMode !== 'live' && "(Trung bình)"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Nồng độ Oxy (SpO2)</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">{viewMode === 'live' ? (spO2 || "--") : "98"}</span>
                <span className="text-sm text-slate-500">% {viewMode !== 'live' && "(Trung bình)"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Khối Đánh giá Tình trạng sức khỏe */}
        <div className={`p-4 rounded-xl border ${status.bg} ${status.color} flex items-center justify-between transition-colors`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Đánh giá hệ thống</p>
            <p className="font-semibold text-sm md:text-base">{status.text}</p>
          </div>
        </div>

        {/* Khối Biểu đồ Kép (Cả Nhịp tim & SpO2) */}
        <Card className="border-border shadow-sm pt-6">
          <CardContent>
            <div className="h-72 md:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickMargin={10} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#ef4444" 
                    domain={['auto', 'auto']} 
                    fontSize={12} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#3b82f6" 
                    domain={[90, 100]} 
                    fontSize={12} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  
                  {/* Đường biểu đồ Nhịp tim (Màu đỏ) */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="hr" 
                    name="Nhịp tim (bpm)" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={viewMode !== 'live'} 
                    isAnimationActive={false} // Tắt animation ở chế độ Live để giảm delay
                  />
                  
                  {/* Đường biểu đồ SpO2 (Màu xanh) */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="spo2" 
                    name="SpO2 (%)" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={viewMode !== 'live'} 
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

export default HealthDashboardPage;