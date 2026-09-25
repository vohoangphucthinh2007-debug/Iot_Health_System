import { useState } from "react";
import { 
  TrendingUp, Watch, RotateCw, HeartPulse, 
  Wind, Footprints, Moon, Bell, Droplet 
} from "lucide-react";

export default function Dashboard() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Nút đồng bộ giả lập
  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("✓ Đồng bộ dữ liệu thành công!");
    }, 1500);
  };

  return (
    // Bọc toàn bộ trang bằng màu nền xám nhạt đặc trưng của PulseCare
    <div className="bg-[#f5f7fb] min-h-screen p-4 sm:p-6 md:p-8 font-sans text-[#17212b]">
      
      {/* 1. LỜI CHÀO */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-[28px] font-bold">Chào buổi tối 👋</h1>
        <p className="text-[#8b96a5] text-[13px] mt-1.5">
          Đây là tình trạng sức khỏe của bạn hôm nay.
        </p>
      </div>

      {/* 2. HERO GRID: ĐIỂM SỨC KHỎE & THIẾT BỊ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 mb-5">
        
        {/* Điểm sức khỏe */}
        <div 
          className="rounded-[18px] p-6 flex flex-col sm:flex-row items-center justify-between overflow-hidden border border-[#e8edf2] shadow-sm min-h-[270px]"
          style={{ background: "radial-gradient(circle at 90% 20%, #e8faf3 0, transparent 35%), #ffffff" }}
        >
          <div className="flex-1 text-left">
            <h2 className="text-[23px] font-bold text-slate-900">Điểm sức khỏe</h2>
            <p className="text-[13px] text-[#8b96a5] mt-2 mb-5 max-w-[200px]">
              Tổng hợp dựa trên dữ liệu từ thiết bị đeo.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#e9faf3] text-[#18b77a] px-3 py-2 rounded-full text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              Tốt hơn 8% so với tuần trước
            </div>
          </div>

          <div 
            className="w-[170px] h-[170px] rounded-full flex items-center justify-center shrink-0 mt-6 sm:mt-0 relative"
            style={{ background: "conic-gradient(#18b77a 86%, #e9eef2 86%)" }}
          >
            <div className="w-[132px] h-[132px] bg-white rounded-full flex flex-col justify-center items-center shadow-sm">
              <strong className="text-[38px] font-bold text-slate-900 leading-none">86</strong>
              <span className="text-[11px] text-[#8b96a5] mt-1">/ 100</span>
            </div>
          </div>
        </div>

        {/* Thiết bị */}
        <div className="rounded-[18px] p-6 bg-white border border-[#e8edf2] shadow-sm flex flex-col justify-between min-h-[270px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[16px] font-bold">Thiết bị</div>
              <div className="text-[12px] text-[#8b96a5] mt-1">Thiết bị theo dõi hiện tại</div>
            </div>
            <div className="text-[#18b77a] text-[12px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18b77a]"></span>
              Đã kết nối
            </div>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="w-[58px] h-[58px] bg-[#20262e] text-white rounded-[17px] flex items-center justify-center shrink-0 shadow-md">
              <Watch className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">Apple Watch Series 9</h3>
              <p className="text-[12px] text-[#8b96a5] mt-1">Pin 78% · Đồng bộ 2 phút trước</p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full py-2.5 bg-[#e9faf3] text-[#18b77a] rounded-[10px] font-semibold flex items-center justify-center gap-2 hover:bg-[#d1f4e5] transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
          </button>
        </div>
      </div>

      {/* 3. GRID 4 CHỈ SỐ NHANH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Nhịp tim */}
        <div className="bg-white p-5 rounded-[18px] border border-[#e8edf2] shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#8b96a5]">Nhịp tim</div>
              <div className="text-[25px] font-bold mt-4">
                72 <span className="text-[14px] font-normal">BPM</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-[#e9faf3] text-[#18b77a] flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-white p-5 rounded-[18px] border border-[#e8edf2] shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#8b96a5]">SpO₂</div>
              <div className="text-[25px] font-bold mt-4">
                98<span className="text-[14px] font-normal">%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-[#edf4ff] text-[#4385f5] flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Bước chân */}
        <div className="bg-white p-5 rounded-[18px] border border-[#e8edf2] shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#8b96a5]">Bước chân</div>
              <div className="text-[25px] font-bold mt-4">7,842</div>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-[#fff5e8] text-[#f5a33b] flex items-center justify-center">
              <Footprints className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Giấc ngủ */}
        <div className="bg-white p-5 rounded-[18px] border border-[#e8edf2] shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] text-[#8b96a5]">Giấc ngủ</div>
              <div className="text-[25px] font-bold mt-4">7h32</div>
            </div>
            <div className="w-10 h-10 rounded-[12px] bg-[#f2efff] text-[#8c6df2] flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACTIVITY CHART & SMART INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.8fr] gap-5">
        
        {/* Biểu đồ */}
        <div className="bg-white p-6 rounded-[18px] border border-[#e8edf2] shadow-sm flex flex-col">
          <div className="text-[16px] font-bold">Hoạt động trong tuần</div>
          <div className="text-[12px] text-[#8b96a5] mt-1">Số bước chân mỗi ngày</div>
          
          <div className="flex-1 flex items-end justify-between gap-2 mt-8 pt-4">
            {[
              { day: 'T2', height: '45%' },
              { day: 'T3', height: '65%' },
              { day: 'T4', height: '80%' },
              { day: 'T5', height: '55%' },
              { day: 'T6', height: '92%' },
              { day: 'T7', height: '70%' },
              { day: 'CN', height: '82%' },
            ].map((col, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-48 justify-end">
                <div 
                  className="w-full max-w-[30px] rounded-t-[7px] rounded-b-[2px]"
                  style={{ 
                    height: col.height, 
                    background: "linear-gradient(to top, #19b77b, #74ddb5)" 
                  }}
                ></div>
                <div className="text-[11px] text-[#8b96a5] font-medium">{col.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white p-6 rounded-[18px] border border-[#e8edf2] shadow-sm">
          <div className="text-[16px] font-bold">Smart Insights</div>
          <div className="text-[12px] text-[#8b96a5] mt-1 mb-2">Phân tích từ dữ liệu thiết bị</div>

          <div className="flex gap-3 py-4 border-b border-[#e8edf2]">
            <div className="w-9 h-9 rounded-[10px] bg-[#e9faf3] text-[#18b77a] flex items-center justify-center shrink-0">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-[13px]">Hoạt động tốt</strong>
              <p className="text-[11px] text-[#8b96a5] mt-1">Bạn đã hoàn thành 78% mục tiêu bước chân hôm nay.</p>
            </div>
          </div>

          <div className="flex gap-3 py-4 border-b border-[#e8edf2]">
            <div className="w-9 h-9 rounded-[10px] bg-[#e9faf3] text-[#18b77a] flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-[13px]">Giấc ngủ ổn định</strong>
              <p className="text-[11px] text-[#8b96a5] mt-1">Thời lượng ngủ trung bình tuần này là 7h24.</p>
            </div>
          </div>

          <div className="flex gap-3 py-4">
            <div className="w-9 h-9 rounded-[10px] bg-[#e9faf3] text-[#18b77a] flex items-center justify-center shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-[13px]">Nhắc uống nước</strong>
              <p className="text-[11px] text-[#8b96a5] mt-1">Bạn còn khoảng 500 ml để đạt mục tiêu hôm nay.</p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}