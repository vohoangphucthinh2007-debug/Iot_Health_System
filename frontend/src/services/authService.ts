import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => {
    const res = await api.post(
      "auth/signup", // Đã bỏ dấu /
      { username, password, email, firstName, lastName },
      { withCredentials: true }
    );

    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "auth/signin",
      { username, password },
      { withCredentials: true }
    );
    return res.data; // access token
  },

  signOut: async () => {
    return api.post("auth/signout", { withCredentials: true }); // Đã bỏ dấu /
  },

  fetchMe: async () => {
    const res = await api.get("users/me", { withCredentials: true }); // Đã bỏ dấu /
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("auth/refresh", { withCredentials: true }); // Đã bỏ dấu /
    return res.data.accessToken;
  },
  
  updateProfile: async (data: { displayName: string, phone: string, dateOfBirth: string, address: string }) => {
    const response = await api.put("users/profile", data, { withCredentials: true }); // Đã bỏ dấu /
    return response.data;
  },
};