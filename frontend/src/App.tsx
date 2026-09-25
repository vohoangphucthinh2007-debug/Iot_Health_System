import { BrowserRouter, Route, Routes } from "react-router"; 
// Các trang
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import HealthDashboardPage from "@/pages/HealthDashboardPage";
import ProfilePage from "@/pages/ProfilePage"; 
import SettingsPage from "@/pages/SettingsPage"; 
import GuidePage from "@/pages/GuidePage"; // <-- IMPORT TRANG HƯỚNG DẪN MỚI

// Layout dùng chung
import Navbar from "@/components/Navbar"; // <-- IMPORT NAVBAR (sửa đường dẫn nếu ông lưu file Navbar ở chỗ khác)

import { Toaster } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        {/* ĐẶT NAVBAR Ở ĐÂY: Nó sẽ luôn nằm trên cùng mọi trang! */}
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/guide" element={<GuidePage />} /> {/* Đường dẫn cho trang Hướng dẫn */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Các trang cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<HealthDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;