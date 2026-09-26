import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router"; 
// Các trang
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import HealthDashboardPage from "@/pages/HealthDashboardPage";
import ProfilePage from "@/pages/ProfilePage"; 
import SettingsPage from "@/pages/SettingsPage"; 
import GuidePage from "@/pages/GuidePage";

// Layout dùng chung
import Navbar from "@/components/Navbar";

import { Toaster } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useSettingsStore } from "@/stores/useSettingsStore";

function App() {
  const { darkMode } = useSettingsStore();

  // Áp dụng class 'dark' lên <html> toàn cục cho mọi trang
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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