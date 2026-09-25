// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, email, firstName, và lastName",
      });
    }

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username });

    if (duplicate) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }
    // kiểm tra email tồn tại chưa
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email này đã được đăng ký!" });
    }
    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // tạo user mới
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    // lấy inputs
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    // lấy hashedPassword trong db để so với password input
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    // nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", //backend, frontend deploy riêng
      maxAge: REFRESH_TOKEN_TTL,
    });

    // trả access token về trong res
    return res
      .status(200)
      .json({ message: `User ${user.displayName} đã logged in!`, accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // xoá refresh token trong Session
      await Session.deleteOne({ refreshToken: token });

      // xoá cookie
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
  
};
// Thêm hàm kiểm tra trùng lặp thời gian thực
export const checkDuplicate = async (req, res) => {
  try {
    const { username, email } = req.query;
    
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Tên đăng nhập đã tồn tại!" });
      }
    }
    
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email này đã được đăng ký!" });
      }
    }

    return res.sendStatus(200); // Trả về 200 OK nếu không trùng gì cả
  } catch (error) {
    console.error("Lỗi khi kiểm tra trùng lặp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateProfile = async (req, res) => {
  console.log("🔥 Đã vào updateProfile!");
  console.log("👉 Dữ liệu req.user từ middleware là:", req.user); 
  // ^ Dòng này sẽ cho ông biết chính xác biến ID tên là gì

  try {
    const { displayName, phone, dateOfBirth, address } = req.body;
    
    // Tự động rà soát lấy ID từ token (bao mọi trường hợp ông có thể viết ở middleware)
    const targetId = req.user?._id || req.user?.userId || req.user?.id || req.userId;
    console.log("🎯 Target ID mang đi cập nhật là:", targetId);

    if (!targetId) {
      return res.status(401).json({ message: "Lỗi: Không lấy được ID từ Token!" });
    }

    // Tìm user theo ID và cập nhật
    const updatedUser = await User.findByIdAndUpdate(
      targetId, 
      { displayName, phone, dateOfBirth, address },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      console.log("❌ Quét DB không thấy user nào có ID:", targetId);
      return res.status(404).json({ message: "Không tìm thấy người dùng trong database" });
    }

    console.log("✅ Cập nhật thành công!");
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ Lỗi cập nhật profile:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};