import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CANDIDATES = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
];

let _genAI = null;
function getGenAI() {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _genAI;
}

function callModelWithTimeout(modelName, prompt, timeoutMs) {
  const model = getGenAI().getGenerativeModel({ model: modelName });
  const call = model.generateContent(prompt);
  let timerId;
  const timer = new Promise((_, rej) => {
    timerId = setTimeout(() => rej(new Error(`Model ${modelName} timeout (${timeoutMs}ms)`)), timeoutMs);
  });
  return Promise.race([call, timer]).finally(() => clearTimeout(timerId));
}

// Gọi Gemini với danh sách model dự phòng nhanh (flash-lite ~1.5s) và ép kết quả về 1 đối tượng JSON
export async function askGeminiJSON(prompt, timeoutMs = 12000) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Thiếu GEMINI_API_KEY trên server");

  let lastErr = null;
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const result = await callModelWithTimeout(modelName, prompt, timeoutMs);
      const raw = result.response.text().trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Model ${modelName} không trả về JSON hợp lệ`);
      return JSON.parse(match[0]);
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ [Gemini] Model ${modelName} lỗi/chậm (${err.message?.slice(0, 100)}), chuyển sang model dự phòng...`);
    }
  }
  throw lastErr || new Error("AI phản hồi quá lâu (timeout)");
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
