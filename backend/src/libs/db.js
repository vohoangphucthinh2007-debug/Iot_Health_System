import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Chuỗi kết nối Node.js đang đọc:", process.env.MONGODB_CONNECTIONSTRING);
    // @ts-ignore
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING, {
      dbName: "AppTimMach" // <-- Nằm gọn trong ngoặc nhọn ở tham số thứ 2
    });
    console.log("Liên kết CSDL thành công!");
  } catch (error) {
    console.log("Lỗi khi kết nối CSDL:", error);
    process.exit(1);
  }
};