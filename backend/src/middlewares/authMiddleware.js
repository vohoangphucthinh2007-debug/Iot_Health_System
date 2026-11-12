// @ts-nocheck
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";

// authorization - xác minh user là ai
export const protectedRoute = async (req, res, next) => {
  try {
    // 1. Lấy access token từ header
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader && authHeader.split(" ")[1];

    if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined") {
      try {
        const decoded = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-hashedPassword");
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });
        req.user = user;
        return next();
      } catch (err) {
        // Token hết hạn hoặc không hợp lệ: thử tìm cookie refreshToken bên dưới
      }
    }

    // 2. Thử dùng refreshToken từ cookie (nếu có) để cấp accessToken mới
    const refreshTokenVal = req.cookies?.refreshToken;
    if (refreshTokenVal) {
      const session = await Session.findOne({ refreshToken: refreshTokenVal });
      if (session && session.expiresAt >= new Date()) {
        const newAccessToken = jwt.sign(
          { userId: session.userId },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: ACCESS_TOKEN_TTL }
        );
        res.setHeader("x-new-access-token", newAccessToken);

        const user = await User.findById(session.userId).select("-hashedPassword");
        if (user) {
          req.user = user;
          return next();
        }
      }
    }

    // 3. Không có token hợp lệ
    return res.status(401).json({ message: "Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại." });

  } catch (error) {
    console.error("Lỗi khi xác minh JWT trong authMiddleware:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
