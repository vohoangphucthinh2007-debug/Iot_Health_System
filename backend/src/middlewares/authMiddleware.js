// @ts-nocheck
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import crypto from "crypto";

const ACCESS_TOKEN_TTL = "30m";

// authorization - xác minh user là ai
// Hỗ trợ cả Bearer header và tự động refresh từ cookie refreshToken
export const protectedRoute = async (req, res, next) => {
  try {
    // 1. Lấy access token từ header
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader && authHeader.split(" ")[1];

    if (bearerToken) {
      // Thử verify access token từ header
      try {
        const decoded = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-hashedPassword");
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });
        req.user = user;
        return next();
      } catch (err) {
        // Token hết hạn hoặc không hợp lệ → thử refresh từ cookie bên dưới
        if (err.name !== "TokenExpiredError" && err.name !== "JsonWebTokenError") {
          return res.status(403).json({ message: "Access token không hợp lệ" });
        }
        // TokenExpiredError → tiếp tục thử cookie
      }
    }

    // 2. Thử dùng refreshToken từ cookie để cấp accessToken mới
    const refreshTokenVal = req.cookies?.refreshToken;
    if (!refreshTokenVal) {
      return res.status(401).json({ message: "Không tìm thấy access token hoặc refresh token" });
    }

    const session = await Session.findOne({ refreshToken: refreshTokenVal });
    if (!session) {
      return res.status(403).json({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
    }
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(403).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" });
    }

    // Tạo access token mới
    const newAccessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Gửi token mới về client qua header để client cập nhật store
    res.setHeader("x-new-access-token", newAccessToken);

    // Lấy user từ session
    const user = await User.findById(session.userId).select("-hashedPassword");
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

    req.user = user;
    return next();

  } catch (error) {
    console.error("Lỗi khi xác minh JWT trong authMiddleware", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
