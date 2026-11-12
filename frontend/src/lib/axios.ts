import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Gắn access token vào request header
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Tự động gọi refresh api khi access token hết hạn
api.interceptors.response.use(
  (res) => {
    // Nếu server có gửi token mới qua header x-new-access-token
    const newToken = res.headers["x-new-access-token"];
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken);
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || "";

    // Những api auth không cần retry refresh
    if (
      url.includes("auth/signin") ||
      url.includes("auth/signup") ||
      url.includes("auth/refresh") ||
      url.includes("check-duplicate")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount || 0;

    if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest._retryCount < 2) {
      originalRequest._retryCount += 1;

      try {
        const res = await api.post("auth/refresh");
        const newAccessToken = res.data.accessToken;

        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearState();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
