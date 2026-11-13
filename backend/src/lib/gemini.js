import { GoogleGenerativeAI } from "@google/generative-ai";

let _model = null;
function getModel() {
  if (!_model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  }
  return _model;
}

// Gọi Gemini và ép kết quả về 1 đối tượng JSON (có timeout để không treo request)
export async function askGeminiJSON(prompt, timeoutMs = 25000) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Thiếu GEMINI_API_KEY trên server");
  const call = getModel().generateContent(prompt);
  const timer = new Promise((_, rej) => setTimeout(() => rej(new Error("AI phản hồi quá lâu (timeout)")), timeoutMs));
  const result = await Promise.race([call, timer]);
  const raw = result.response.text().trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI không trả về JSON hợp lệ");
  return JSON.parse(match[0]);
}

export function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

