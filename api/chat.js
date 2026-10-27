export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const { message } = body || {};
  if (!message) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Vercel' });
  }

  // Danh sách model tương thích API mới nhất
  const models = [
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  const systemPrompt = "Bạn là Trợ lý AI của AquaGreen Sài Gòn. Hãy giải đáp thân thiện, tích cực bằng tiếng Việt về phân loại rác và bảo vệ môi trường, kênh rạch TP.HCM. Hướng dẫn người dùng các tính năng: Báo cáo kênh ô nhiễm trên bản đồ (+50đ), thi Trắc nghiệm 20 câu, và Game Pixel vớt rác. Trả lời súc tích, ngắn gọn 2-4 câu.";

  let lastErrorDetail = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nNgười dùng hỏi: ${message}` }]
            }
          ]
        })
      });

      const data = await response.json();

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({
          reply: data.candidates[0].content.parts[0].text
        });
      } else {
        lastErrorDetail = data?.error?.message || `Lỗi HTTP ${response.status}`;
      }
    } catch (err) {
      lastErrorDetail = err.message;
    }
  }

  return res.status(500).json({
    error: `Lỗi từ Gemini: ${lastErrorDetail}`,
    reply: `Lỗi từ Gemini: ${lastErrorDetail}`
  });
}
