// Lưu tên model hoạt động tốt vào bộ nhớ đệm của Serverless để không phải tìm lại
let cachedWorkingModel = 'models/gemini-3.8-flash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel.' });
  }

  const systemInstruction = "Bạn là Trợ lý AI thông minh của dự án môi trường AquaGreen Sài Gòn. Hãy trả lời chính xác, tự nhiên và súc tích bằng tiếng Việt cho MỌI câu hỏi của người dùng (kể cả toán học, kiến thức chung hay giao tiếp). Nếu câu hỏi liên quan đến môi trường hoặc website, hãy hướng dẫn các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50 điểm), Trắc nghiệm 20 câu, và Game Pixel vớt rác.";

  // Hàm gọi trực tiếp Gemini API
  async function callGemini(modelName) {
    const cleanModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.7 }
      })
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  }

  try {
    // BƯỚC 1: Gọi thẳng model 3.8-flash đang lưu trong cache (Tốc độ < 1 giây)
    let result = await callGemini(cachedWorkingModel);
    let reply = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (result.ok && reply) {
      return res.status(200).json({ reply });
    }

    // BƯỚC 2: Nếu máy chủ Google báo bận (503 High Demand), chờ 600ms rồi gọi lại ngay
    if (result.status === 503 || result.data?.error?.message?.includes('high demand')) {
      await new Promise(r => setTimeout(r, 600));
      result = await callGemini(cachedWorkingModel);
      reply = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (result.ok && reply) {
        return res.status(200).json({ reply });
      }
    }

    // BƯỚC 3: Nếu model hiện tại bị 404 hoặc lỗi khác, thử fallback qua gemini-3.8-pro
    if (!result.ok) {
      const fallbackModel = 'models/gemini-3.8-pro';
      if (cachedWorkingModel !== fallbackModel) {
        const fallbackResult = await callGemini(fallbackModel);
        const fallbackReply = fallbackResult.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (fallbackResult.ok && fallbackReply) {
          cachedWorkingModel = fallbackModel;
          return res.status(200).json({ reply: fallbackReply });
        }
      }
    }

    // Nếu vẫn không thành công, in chính xác thông báo lỗi từ Google API
    return res.status(result.status || 500).json({
      error: `LỖI GOOGLE API: ${result.data?.error?.message || 'Không thể tạo phản hồi'}`
    });
  } catch (err) {
    return res.status(500).json({ error: `LỖI MÁY CHỦ: ${err.message}` });
  }
}
